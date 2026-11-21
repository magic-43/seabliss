-- Migration 006: Reorder rooms display sequence
-- Ordering: Couple Suites (1-2) -> Family Suites (3-4) -> Standalone Villas (5-8)

UPDATE public.rooms SET sort_order = 1, updated_at = NOW() WHERE slug = 'horizon-beachfront-suite';
UPDATE public.rooms SET sort_order = 2, updated_at = NOW() WHERE slug = 'poolside-veranda-suite';
UPDATE public.rooms SET sort_order = 3, updated_at = NOW() WHERE slug = 'azure-beachfront-suite';
UPDATE public.rooms SET sort_order = 4, updated_at = NOW() WHERE slug = 'sanctuary-family-suite';
UPDATE public.rooms SET sort_order = 5, updated_at = NOW() WHERE slug = 'villa-1';
UPDATE public.rooms SET sort_order = 6, updated_at = NOW() WHERE slug = 'villa-2';
UPDATE public.rooms SET sort_order = 7, updated_at = NOW() WHERE slug = 'villa-3';
UPDATE public.rooms SET sort_order = 8, updated_at = NOW() WHERE slug = 'villa-4';
