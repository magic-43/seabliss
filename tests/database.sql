-- Regression checks for a disposable Supabase database after migrations 001 through 003.
-- Run as postgres: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/database.sql
-- All fixtures and changes are rolled back.
BEGIN;
DO $$
DECLARE
  admin_id uuid = gen_random_uuid();
  room_id uuid;
  reservation_id uuid;
  receipt_id uuid;
  rejected_id uuid;
  overpaid_id uuid;
  final_id uuid;
  snapshot public.bookings%ROWTYPE;
  result text;
BEGIN
  INSERT INTO auth.users (id, email) VALUES (admin_id, 'regression-' || admin_id || '@example.com');
  IF (SELECT role FROM public.user_profiles WHERE id = admin_id) <> 'user' THEN
    RAISE EXCEPTION 'Public signups must default to user';
  END IF;
  UPDATE public.user_profiles SET role = 'superadmin' WHERE id = admin_id;

  IF has_column_privilege('authenticated', 'public.user_profiles', 'role', 'UPDATE') THEN
    RAISE EXCEPTION 'Authenticated users must not be able to update role';
  END IF;
  IF NOT has_column_privilege('authenticated', 'public.user_profiles', 'full_name', 'UPDATE') THEN
    RAISE EXCEPTION 'Users should still be able to edit their name';
  END IF;
  IF has_function_privilege('anon', 'public.review_payment(uuid,text,uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Payment review must not be a public RPC';
  END IF;
  IF has_table_privilege('anon', 'public.bookings', 'INSERT') THEN
    RAISE EXCEPTION 'Guests must not be able to bypass server-side pricing';
  END IF;

  INSERT INTO public.rooms (name, slug, category, regular_rate, min_guests, max_guests)
  VALUES ('Regression room', 'regression-' || admin_id, 'Villa', 1001, 1, 2) RETURNING id INTO room_id;
  INSERT INTO public.bookings (
    reference_number, room_id, guest_name, guest_email, guest_phone,
    check_in, check_out, rate_per_night, subtotal, total_amount, remaining_balance,
    payment_option, client_request_id, guest_access_token_hash
  ) VALUES (
    'TEST-' || gen_random_uuid(), room_id, 'Regression guest', 'guest@example.com', '09171234567',
    '2099-01-01', '2099-01-03', 1001, 1001, 1001, 1001,
    'half', gen_random_uuid(), repeat('a', 64)
  ) RETURNING id INTO reservation_id;

  BEGIN
    INSERT INTO public.bookings (
      reference_number, room_id, guest_name, guest_email, guest_phone,
      check_in, check_out, rate_per_night, subtotal, total_amount, remaining_balance,
      payment_option, client_request_id, guest_access_token_hash
    ) VALUES (
      'TEST-' || gen_random_uuid(), room_id, 'Other guest', 'other@example.com', '09171234567',
      '2099-01-02', '2099-01-04', 1001, 1001, 1001, 1001,
      'full', gen_random_uuid(), repeat('b', 64)
    );
    RAISE EXCEPTION 'Overlapping reservations must fail';
  EXCEPTION WHEN exclusion_violation THEN NULL;
  END;

  -- A checkout on January 3 permits another guest to check in on January 3.
  INSERT INTO public.bookings (
    reference_number, room_id, guest_name, guest_email, guest_phone,
    check_in, check_out, rate_per_night, subtotal, total_amount, remaining_balance,
    payment_option, client_request_id, guest_access_token_hash
  ) VALUES (
    'TEST-' || gen_random_uuid(), room_id, 'Next guest', 'next@example.com', '09171234567',
    '2099-01-03', '2099-01-04', 1001, 1001, 1001, 1001,
    'full', gen_random_uuid(), repeat('c', 64)
  );

  receipt_id = public.submit_payment_proof(reservation_id, repeat('a', 64), 'gcash', 501, 'proofs/' || reservation_id || '/first.png');
  result = public.review_payment(receipt_id, 'approved', admin_id);
  IF result <> 'approved' THEN RAISE EXCEPTION 'Half payment should approve the reservation'; END IF;
  PERFORM public.review_payment(receipt_id, 'approved', admin_id);
  SELECT * INTO STRICT snapshot FROM public.bookings WHERE id = reservation_id;
  IF snapshot.amount_paid <> 501 OR snapshot.remaining_balance <> 500 THEN
    RAISE EXCEPTION 'Replaying approval must not count the receipt twice';
  END IF;

  rejected_id = public.submit_payment_proof(reservation_id, repeat('a', 64), 'gcash', 500, 'proofs/' || reservation_id || '/second.png');
  result = public.review_payment(rejected_id, 'rejected', admin_id, 'Unreadable receipt');
  IF result <> 'approved' THEN RAISE EXCEPTION 'Rejecting a later receipt must preserve the accepted deposit'; END IF;

  overpaid_id = public.submit_payment_proof(reservation_id, repeat('a', 64), 'gcash', 501, 'proofs/' || reservation_id || '/overpaid.png');
  BEGIN
    PERFORM public.review_payment(overpaid_id, 'approved', admin_id);
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Overpayment must fail';
  EXCEPTION WHEN raise_exception THEN NULL;
  END;
  IF (SELECT review_status FROM public.payment_submissions WHERE id = overpaid_id) <> 'pending' THEN
    RAISE EXCEPTION 'Failed review must leave the submission unchanged';
  END IF;
  PERFORM public.review_payment(overpaid_id, 'rejected', admin_id);

  final_id = public.submit_payment_proof(reservation_id, repeat('a', 64), 'bank_transfer', 500, 'proofs/' || reservation_id || '/final.pdf');
  PERFORM public.review_payment(final_id, 'approved', admin_id);
  SELECT * INTO STRICT snapshot FROM public.bookings WHERE id = reservation_id;
  IF snapshot.amount_paid <> 1001 OR snapshot.remaining_balance <> 0 THEN RAISE EXCEPTION 'Final balance is incorrect'; END IF;

  UPDATE public.rooms SET regular_rate = 1003 WHERE id = room_id;
  IF (SELECT regular_rate FROM public.rooms WHERE id = room_id) <> 1003 THEN
    RAISE EXCEPTION 'Room edits must retain the saved nightly rate';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid = 'public.rooms'::regclass AND tgname = 'apply_room_discount')
    OR to_regprocedure('public.set_global_discount(integer)') IS NOT NULL THEN
    RAISE EXCEPTION 'Legacy promotion automation must be retired';
  END IF;
END;
$$;
ROLLBACK;

