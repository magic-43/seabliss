-- Migration regression test for a disposable database after migrations 001-003.
-- Applies 004, runs database.sql, and verifies existing data and security survive.
-- The sentinel booking/receipt remain only in this disposable database.
\set ON_ERROR_STOP on
DO $$ BEGIN
  IF current_database() NOT LIKE 'seabliss_phase1_%' OR EXISTS (SELECT 1 FROM public.bookings) OR EXISTS (SELECT 1 FROM public.payment_submissions) THEN RAISE EXCEPTION 'Use a disposable seabliss_phase1_* database with migrations 001-003 and empty booking/payment tables'; END IF;
END $$;

INSERT INTO public.rooms (id, name, slug, category, regular_rate, min_guests, max_guests)
VALUES ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Migration sentinel room', 'migration-sentinel', 'Villa', 1000, 1, 2);
INSERT INTO public.bookings (id, reference_number, room_id, guest_name, guest_email, guest_phone,
 check_in, check_out, rate_per_night, subtotal, total_amount, remaining_balance, payment_option, client_request_id, guest_access_token_hash)
VALUES ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'SBL-2099-9999', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
 'Migration sentinel guest', 'sentinel@example.com', '09171234567', '2099-12-10', '2099-12-12',
 1000, 2000, 7000, 7000, 'full', gen_random_uuid(), repeat('a', 64));
SELECT public.submit_payment_proof('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', repeat('a', 64), 'gcash', 7000,
 'proofs/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/sentinel.png');

DO $$ BEGIN
 BEGIN
  INSERT INTO public.bookings (reference_number, room_id, guest_name, guest_email, guest_phone,
   check_in, check_out, rate_per_night, subtotal, total_amount, remaining_balance, payment_option, client_request_id, guest_access_token_hash)
  SELECT 'SBL-2099-9998', room_id, guest_name, guest_email, guest_phone,
   check_in, check_out, rate_per_night, subtotal, total_amount, remaining_balance, payment_option, gen_random_uuid(), guest_access_token_hash
  FROM public.bookings WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  RAISE EXCEPTION 'The pre-004 exclusion constraint should reject overlap';
 EXCEPTION WHEN exclusion_violation THEN RAISE NOTICE 'Baseline overlap rejection reproduced before migration 004';
 END;
END $$;

CREATE TEMP TABLE before_bookings AS SELECT * FROM public.bookings;
CREATE TEMP TABLE before_receipts AS SELECT * FROM public.payment_submissions;
CREATE TEMP TABLE before_tables AS SELECT oid, relrowsecurity, relacl FROM pg_class
 WHERE oid IN ('public.bookings'::regclass, 'public.payment_submissions'::regclass, 'public.user_profiles'::regclass, 'public.rooms'::regclass, 'public.resort_settings'::regclass);
CREATE TEMP TABLE before_constraints AS SELECT conname, pg_get_constraintdef(oid) AS definition FROM pg_constraint
 WHERE conrelid = 'public.bookings'::regclass AND conname <> 'bookings_no_overlapping_stays';
CREATE TEMP TABLE before_policies AS SELECT * FROM pg_policies WHERE schemaname = 'public';
CREATE TEMP TABLE before_functions AS SELECT oid, prosrc, proacl, prosecdef, proconfig FROM pg_proc
 WHERE oid IN ('public.submit_payment_proof(uuid,text,text,integer,text)'::regprocedure, 'public.review_payment(uuid,text,uuid,text)'::regprocedure);

\ir ../supabase/migrations/004_allow_overlapping_booking_requests.sql
\ir ../supabase/migrations/004_allow_overlapping_booking_requests.sql
\ir database.sql

DO $$ BEGIN
 IF EXISTS (SELECT * FROM before_bookings EXCEPT SELECT * FROM public.bookings)
   OR EXISTS (SELECT * FROM public.bookings EXCEPT SELECT * FROM before_bookings)
   OR EXISTS (SELECT * FROM before_receipts EXCEPT SELECT * FROM public.payment_submissions)
   OR EXISTS (SELECT * FROM public.payment_submissions EXCEPT SELECT * FROM before_receipts) THEN
  RAISE EXCEPTION 'Existing booking/payment records changed or regression fixtures were not rolled back';
 END IF;
 IF EXISTS (SELECT * FROM before_tables EXCEPT SELECT oid, relrowsecurity, relacl FROM pg_class)
   OR EXISTS (SELECT * FROM before_policies EXCEPT SELECT * FROM pg_policies)
   OR EXISTS (SELECT * FROM before_functions EXCEPT SELECT oid, prosrc, proacl, prosecdef, proconfig FROM pg_proc) THEN
  RAISE EXCEPTION 'Table permissions, RLS, policies, or payment functions changed';
 END IF;
 IF EXISTS (SELECT * FROM before_constraints EXCEPT SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.bookings'::regclass) THEN
  RAISE EXCEPTION 'An unrelated booking constraint changed';
 END IF;
 RAISE NOTICE 'Migration preservation verified: booking/payment rows, unrelated constraints, RLS, permissions, and payment RPCs unchanged';
END $$;

