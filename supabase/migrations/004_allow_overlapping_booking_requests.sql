-- Booking requests may share a room and dates. Management finalizes stays manually.
-- Keep date validation, unique references, request idempotency, and payment locks.
BEGIN;

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_no_overlapping_stays;

COMMIT;
