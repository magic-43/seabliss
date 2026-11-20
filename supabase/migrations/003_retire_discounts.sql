-- Room pricing now uses regular_rate only. Keep legacy columns and booked totals.
BEGIN;

DROP TRIGGER IF EXISTS apply_room_discount ON public.rooms;
DROP FUNCTION IF EXISTS public.apply_room_discount();
DROP FUNCTION IF EXISTS public.set_global_discount(integer);

COMMIT;
