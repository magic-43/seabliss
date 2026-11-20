-- Run after 001. This migration intentionally fails if existing active bookings overlap;
-- reconcile those reservations before retrying rather than silently cancelling guests.
BEGIN;

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Public signups must never receive administrative privileges.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 'user')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
  RETURN NEW;
END;
$$;

-- A row policy does not restrict which columns a user may update.
REVOKE UPDATE ON public.user_profiles FROM PUBLIC, anon, authenticated;
GRANT UPDATE (full_name) ON public.user_profiles TO authenticated;
DROP POLICY IF EXISTS "Allow authenticated read user_profiles" ON public.user_profiles;
CREATE POLICY "Users can read their own profile" ON public.user_profiles
FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));

-- Guest mutations go through validated server actions using the service role.
DROP POLICY IF EXISTS "Anyone can create a booking" ON public.bookings;
DROP POLICY IF EXISTS "Anyone can submit payment proofs" ON public.payment_submissions;
DROP POLICY IF EXISTS "Anyone can submit buyout inquiries" ON public.estate_buyout_inquiries;
DROP POLICY IF EXISTS "Anyone can upload payment proof" ON storage.objects;
REVOKE INSERT, UPDATE, DELETE ON public.bookings, public.payment_submissions,
  public.estate_buyout_inquiries, public.rooms, public.resort_settings FROM PUBLIC, anon, authenticated;

-- Half-open date ranges allow checkout and the next check-in on the same day.
ALTER TABLE public.bookings ADD CONSTRAINT bookings_no_overlapping_stays
EXCLUDE USING gist (room_id WITH =, daterange(check_in, check_out, '[)') WITH &&)
WHERE (status NOT IN ('rejected', 'cancelled'));

ALTER TABLE public.bookings ADD CONSTRAINT bookings_valid_amounts CHECK (
  rate_per_night >= 0 AND extra_person_fee >= 0 AND extra_persons >= 0 AND security_deposit >= 0
  AND subtotal >= 0 AND total_amount >= 0 AND amount_paid >= 0 AND amount_paid <= total_amount
  AND remaining_balance = total_amount - amount_paid
) NOT VALID;
ALTER TABLE public.rooms ADD CONSTRAINT rooms_valid_capacity CHECK (min_guests <= max_guests) NOT VALID;
ALTER TABLE public.resort_settings ADD CONSTRAINT settings_valid_prices CHECK (
  extra_person_fee >= 0 AND security_deposit >= 0 AND global_discount_percentage BETWEEN 0 AND 100
) NOT VALID;
CREATE INDEX IF NOT EXISTS payment_submissions_booking_id_idx ON public.payment_submissions (booking_id);

-- Keep edits to regular prices consistent with the configured global promotion.
CREATE FUNCTION public.apply_room_discount() RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE percentage integer;
BEGIN
  SELECT global_discount_percentage INTO STRICT percentage FROM public.resort_settings WHERE id = 1;
  NEW.discounted_rate = round(NEW.regular_rate::numeric * (100 - percentage) / 100)::integer;
  RETURN NEW;
END;
$$;
CREATE TRIGGER apply_room_discount BEFORE UPDATE OF regular_rate ON public.rooms
FOR EACH ROW EXECUTE FUNCTION public.apply_room_discount();

CREATE FUNCTION public.set_global_discount(percentage integer) RETURNS void
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF percentage IS NULL OR percentage NOT BETWEEN 0 AND 100 THEN
    RAISE EXCEPTION 'Discount must be between 0 and 100';
  END IF;
  UPDATE public.resort_settings SET global_discount_percentage = percentage WHERE id = 1;
  IF NOT FOUND THEN RAISE EXCEPTION 'Resort settings are missing'; END IF;
  UPDATE public.rooms SET discounted_rate = round(regular_rate::numeric * (100 - percentage) / 100)::integer;
END;
$$;

CREATE FUNCTION public.submit_payment_proof(
  booking_id uuid, token_hash text, method text, amount integer, storage_path text
) RETURNS uuid
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE booking public.bookings%ROWTYPE; submission_id uuid;
BEGIN
  SELECT * INTO STRICT booking FROM public.bookings WHERE id = booking_id FOR UPDATE;
  IF booking.guest_access_token_hash IS DISTINCT FROM token_hash THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF booking.status IN ('cancelled', 'rejected', 'completed') THEN RAISE EXCEPTION 'Reservation is closed'; END IF;
  IF storage_path NOT LIKE 'proofs/' || booking.id::text || '/%' THEN RAISE EXCEPTION 'Invalid receipt path'; END IF;
  INSERT INTO public.payment_submissions (booking_id, payment_method, amount_claimed, proof_storage_path)
  VALUES (booking.id, method, amount, storage_path) RETURNING id INTO submission_id;
  IF booking.status = 'awaiting_payment' THEN
    UPDATE public.bookings SET status = 'pending_review' WHERE id = booking.id;
  END IF;
  RETURN submission_id;
END;
$$;

CREATE FUNCTION public.review_payment(
  submission_id uuid, decision text, reviewer_id uuid, rejection_reason text DEFAULT NULL
) RETURNS text
LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  submission public.payment_submissions%ROWTYPE;
  booking public.bookings%ROWTYPE;
  target_booking_id uuid;
  paid integer;
  required_amount integer;
  new_status text;
BEGIN
  IF decision IS NULL OR decision NOT IN ('approved', 'rejected') THEN RAISE EXCEPTION 'Invalid decision'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = reviewer_id AND role IN ('admin', 'superadmin')) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  SELECT booking_id INTO STRICT target_booking_id FROM public.payment_submissions WHERE id = submission_id;
  -- Always lock booking first so reviews of different receipts serialize consistently.
  SELECT * INTO STRICT booking FROM public.bookings WHERE id = target_booking_id FOR UPDATE;
  SELECT * INTO STRICT submission FROM public.payment_submissions WHERE id = submission_id FOR UPDATE;
  IF submission.review_status = decision THEN RETURN booking.status; END IF;
  IF submission.review_status <> 'pending' THEN RAISE EXCEPTION 'Payment has already been reviewed'; END IF;
  IF booking.status IN ('cancelled', 'rejected', 'completed') THEN RAISE EXCEPTION 'Reservation is closed'; END IF;

  paid = booking.amount_paid;
  IF decision = 'approved' THEN
    IF submission.amount_claimed > booking.total_amount - paid THEN RAISE EXCEPTION 'Payment exceeds remaining balance'; END IF;
    paid = paid + submission.amount_claimed;
  END IF;
  UPDATE public.payment_submissions SET review_status = decision,
    rejection_reason = CASE WHEN decision = 'rejected' THEN COALESCE(NULLIF(btrim(review_payment.rejection_reason), ''), 'Receipt unverified') ELSE NULL END,
    reviewed_by = reviewer_id, reviewed_at = NOW()
  WHERE id = submission.id;

  required_amount = CASE WHEN booking.payment_option = 'half' THEN ceil(booking.total_amount::numeric / 2)::integer ELSE booking.total_amount END;
  new_status = CASE
    WHEN paid >= required_amount THEN 'approved'
    WHEN EXISTS (SELECT 1 FROM public.payment_submissions WHERE booking_id = booking.id AND review_status = 'pending') THEN 'pending_review'
    ELSE 'awaiting_payment'
  END;
  UPDATE public.bookings SET amount_paid = paid, remaining_balance = total_amount - paid,
    status = new_status, reviewed_by = reviewer_id, reviewed_at = NOW() WHERE id = booking.id;
  RETURN new_status;
END;
$$;

-- These functions execute with the service caller's permissions, never as public RPCs.
REVOKE ALL ON FUNCTION public.set_global_discount(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_payment_proof(uuid, text, text, integer, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.review_payment(uuid, text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_global_discount(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_payment_proof(uuid, text, text, integer, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.review_payment(uuid, text, uuid, text) TO service_role;

COMMIT;
