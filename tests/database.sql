-- Regression checks for a disposable Supabase database after migrations 001 through 004.
-- Run as postgres: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/database.sql
-- All fixtures and changes are rolled back.
BEGIN;
DO $$
DECLARE
  admin_id uuid = gen_random_uuid();
  room_id uuid;
  reservation_id uuid;
  identical_id uuid;
  partial_id uuid;
  request_id uuid = gen_random_uuid();
  other_receipt_id uuid;
  partial_receipt_id uuid;
  non_admin_id uuid = gen_random_uuid();
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
  IF has_function_privilege('authenticated', 'public.submit_payment_proof(uuid,text,text,integer,text)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.review_payment(uuid,text,uuid,text)', 'EXECUTE')
    OR has_table_privilege('anon', 'public.payment_submissions', 'INSERT') THEN
    RAISE EXCEPTION 'Guest payment writes and reviews must remain server controlled';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE oid IN ('public.bookings'::regclass, 'public.payment_submissions'::regclass)
    AND NOT relrowsecurity) THEN
    RAISE EXCEPTION 'Booking and payment row-level security must remain enabled';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.bookings'::regclass AND conname = 'bookings_no_overlapping_stays') THEN
    RAISE EXCEPTION 'Apply migration 004 before running these tests';
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
    'half', request_id, repeat('a', 64)
  ) RETURNING id INTO reservation_id;

  -- A: Different guests can request the same room with identical dates.
  INSERT INTO public.bookings (
    reference_number, room_id, guest_name, guest_email, guest_phone,
    check_in, check_out, rate_per_night, subtotal, total_amount, remaining_balance,
    payment_option, client_request_id, guest_access_token_hash
  ) VALUES (
    'TEST-' || gen_random_uuid(), room_id, 'Identical dates guest', 'identical@example.com', '09171234567',
    '2099-01-01', '2099-01-03', 1001, 1001, 1001, 1001,
    'full', gen_random_uuid(), repeat('b', 64)
  ) RETURNING id INTO identical_id;
  IF identical_id = reservation_id OR (SELECT count(*) FROM public.bookings WHERE id IN (reservation_id, identical_id)) <> 2 THEN
    RAISE EXCEPTION 'Identical-date requests must have distinct booking records';
  END IF;
  RAISE NOTICE 'A: Identical-date booking requests created independently';

  -- B: A third guest can also request partially overlapping dates.
  INSERT INTO public.bookings (
    reference_number, room_id, guest_name, guest_email, guest_phone,
    check_in, check_out, rate_per_night, subtotal, total_amount, remaining_balance,
    payment_option, client_request_id, guest_access_token_hash
  ) VALUES (
    'TEST-' || gen_random_uuid(), room_id, 'Partial overlap guest', 'partial@example.com', '09171234567',
    '2099-01-02', '2099-01-04', 1001, 1001, 1001, 1001,
    'full', gen_random_uuid(), repeat('c', 64)
  ) RETURNING id INTO partial_id;
  IF (SELECT count(*) FROM public.bookings WHERE id IN (reservation_id, identical_id, partial_id)) <> 3 THEN
    RAISE EXCEPTION 'Partial-overlap requests must also be retained';
  END IF;
  RAISE NOTICE 'B: Partially overlapping booking request created';

  -- E: Retrying a client request cannot duplicate the booking; references stay unique.
  BEGIN
    INSERT INTO public.bookings (
      reference_number, room_id, guest_name, guest_email, guest_phone,
      check_in, check_out, rate_per_night, subtotal, total_amount, remaining_balance,
      payment_option, client_request_id, guest_access_token_hash
    ) VALUES (
      'TEST-' || gen_random_uuid(), room_id, 'Duplicate request', 'duplicate@example.com', '09171234567',
      '2099-01-01', '2099-01-03', 1001, 1001, 1001, 1001,
      'half', request_id, repeat('a', 64)
    );
    RAISE EXCEPTION 'A duplicate client request must fail';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  IF (SELECT count(*) FROM public.bookings WHERE client_request_id = request_id) <> 1
    OR (SELECT id FROM public.bookings WHERE client_request_id = request_id) <> reservation_id THEN
    RAISE EXCEPTION 'A repeated request must resolve to the original booking';
  END IF;
  BEGIN
    INSERT INTO public.bookings (
      reference_number, room_id, guest_name, guest_email, guest_phone,
      check_in, check_out, rate_per_night, subtotal, total_amount, remaining_balance,
      payment_option, client_request_id, guest_access_token_hash
    ) SELECT b.reference_number, b.room_id, b.guest_name, b.guest_email, b.guest_phone,
      b.check_in, b.check_out, b.rate_per_night, b.subtotal, b.total_amount, b.remaining_balance,
      b.payment_option, gen_random_uuid(), b.guest_access_token_hash
      FROM public.bookings b WHERE b.id = reservation_id;
    RAISE EXCEPTION 'Booking references must stay unique';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  RAISE NOTICE 'E: Request idempotency and reference uniqueness retained';

  -- Adjacent dates remain allowed as well.
  INSERT INTO public.bookings (
    reference_number, room_id, guest_name, guest_email, guest_phone,
    check_in, check_out, rate_per_night, subtotal, total_amount, remaining_balance,
    payment_option, client_request_id, guest_access_token_hash
  ) VALUES (
    'TEST-' || gen_random_uuid(), room_id, 'Next guest', 'next@example.com', '09171234567',
    '2099-01-03', '2099-01-04', 1001, 1001, 1001, 1001,
    'full', gen_random_uuid(), repeat('c', 64)
  );

  -- D: Removing date exclusivity must not remove unrelated validation.
  BEGIN
    UPDATE public.bookings SET check_out = check_in WHERE id = partial_id;
    RAISE EXCEPTION 'A zero-night stay must fail';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE public.bookings SET check_out = check_in - 1 WHERE id = partial_id;
    RAISE EXCEPTION 'A reversed date range must fail';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE public.bookings SET adult_guests = 0 WHERE id = partial_id;
    RAISE EXCEPTION 'A booking without an adult must fail';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE public.bookings SET child_guests = -1 WHERE id = partial_id;
    RAISE EXCEPTION 'A negative child count must fail';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    PERFORM public.submit_payment_proof(identical_id, repeat('a', 64), 'gcash', 1001, 'proofs/' || identical_id || '/wrong-token.png');
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Another guest token must fail';
  EXCEPTION WHEN raise_exception THEN NULL;
  END;
  BEGIN
    PERFORM public.submit_payment_proof(identical_id, repeat('b', 64), 'gcash', 1001, 'proofs/' || reservation_id || '/wrong-booking.png');
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'A receipt path for another booking must fail';
  EXCEPTION WHEN raise_exception THEN NULL;
  END;
  BEGIN
    PERFORM public.submit_payment_proof(identical_id, repeat('b', 64), 'gcash', 0, 'proofs/' || identical_id || '/zero.png');
    RAISE EXCEPTION 'A nonpositive payment claim must fail';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  RAISE NOTICE 'D: Date, guest, token, path, and payment validation retained';

  -- C: All overlapping requests accept receipts tied to their own booking IDs.
  receipt_id = public.submit_payment_proof(reservation_id, repeat('a', 64), 'gcash', 501, 'proofs/' || reservation_id || '/first.png');
  other_receipt_id = public.submit_payment_proof(identical_id, repeat('b', 64), 'bank_transfer', 1001, 'proofs/' || identical_id || '/other.png');
  partial_receipt_id = public.submit_payment_proof(partial_id, repeat('c', 64), 'gcash', 1001, 'proofs/' || partial_id || '/partial.png');
  IF receipt_id = other_receipt_id OR receipt_id = partial_receipt_id OR other_receipt_id = partial_receipt_id
    OR (SELECT booking_id FROM public.payment_submissions WHERE id = receipt_id) <> reservation_id
    OR (SELECT booking_id FROM public.payment_submissions WHERE id = other_receipt_id) <> identical_id
    OR (SELECT booking_id FROM public.payment_submissions WHERE id = partial_receipt_id) <> partial_id THEN
    RAISE EXCEPTION 'Each receipt must remain linked to its own booking';
  END IF;
  IF (SELECT count(*) FROM public.bookings WHERE id IN (reservation_id, identical_id, partial_id) AND status = 'pending_review') <> 3 THEN
    RAISE EXCEPTION 'All overlapping requests must independently enter payment review';
  END IF;
  IF (SELECT count(*) FROM public.payment_submissions p JOIN public.bookings b ON b.id = p.booking_id
    WHERE b.id IN (reservation_id, identical_id, partial_id)) <> 3 THEN
    RAISE EXCEPTION 'The dashboard join must retain all overlapping submissions';
  END IF;
  RAISE NOTICE 'C: Independent payment submissions and dashboard associations retained';

  INSERT INTO auth.users (id, email) VALUES (non_admin_id, 'non-admin-' || non_admin_id || '@example.com');
  BEGIN
    PERFORM public.review_payment(receipt_id, 'approved', non_admin_id);
    RAISE EXCEPTION USING ERRCODE = 'P0002', MESSAGE = 'Non-admin review must fail';
  EXCEPTION WHEN raise_exception THEN NULL;
  END;

  -- F: Reviewing one payment must not change another overlapping request.
  result = public.review_payment(receipt_id, 'approved', admin_id);
  IF result <> 'approved' THEN RAISE EXCEPTION 'Verified half payment should retain the existing approved payment state'; END IF;
  IF (SELECT count(*) FROM public.bookings WHERE id IN (identical_id, partial_id) AND status = 'pending_review' AND amount_paid = 0 AND remaining_balance = 1001) <> 2
    OR (SELECT count(*) FROM public.payment_submissions WHERE id IN (other_receipt_id, partial_receipt_id) AND review_status = 'pending') <> 2 THEN
    RAISE EXCEPTION 'Reviewing the first request must not change the other requests';
  END IF;
  PERFORM public.review_payment(other_receipt_id, 'rejected', admin_id, 'Unverified payment');
  PERFORM public.review_payment(partial_receipt_id, 'approved', admin_id);
  IF (SELECT status FROM public.bookings WHERE id = identical_id) <> 'awaiting_payment'
    OR (SELECT amount_paid FROM public.bookings WHERE id = identical_id) <> 0
    OR (SELECT status FROM public.bookings WHERE id = partial_id) <> 'approved'
    OR (SELECT amount_paid FROM public.bookings WHERE id = partial_id) <> 1001
    OR (SELECT amount_paid FROM public.bookings WHERE id = reservation_id) <> 501 THEN
    RAISE EXCEPTION 'Approval and rejection must stay independent for overlapping requests';
  END IF;
  RAISE NOTICE 'F: Independent admin approval and rejection retained';
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
