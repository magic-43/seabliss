-- Migration 007: Update cover images for Poolside Veranda Suite, Sanctuary Family Suite, and Villa 2
-- Ensures every room has a distinct, authentic, and non-duplicate cover photograph.

UPDATE public.rooms
SET gallery = ARRAY[
  '/images/rooms/poolside-veranda-suite/poolside-veranda-suite-cover.png',
  '/images/rooms/poolside-veranda-suite/poolside-veranda-suite-4.jpg',
  '/images/rooms/poolside-veranda-suite/poolside-veranda-suite-1.jpg',
  '/images/rooms/poolside-veranda-suite/poolside-veranda-suite-2.jpg',
  '/images/rooms/poolside-veranda-suite/poolside-veranda-suite-3.jpg',
  '/images/rooms/poolside-veranda-suite/poolside-veranda-suite-5.jpg',
  '/images/rooms/poolside-veranda-suite/poolside-veranda-suite-6.jpg'
]::TEXT[],
updated_at = NOW()
WHERE slug = 'poolside-veranda-suite';

UPDATE public.rooms
SET gallery = ARRAY[
  '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-6.jpg',
  '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-2.jpg',
  '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-1.jpg',
  '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-3.jpg',
  '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-4.jpg',
  '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-5.jpg',
  '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-7.jpg',
  '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-8.jpg',
  '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-9.jpg',
  '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-10.jpg'
]::TEXT[],
updated_at = NOW()
WHERE slug = 'sanctuary-family-suite';

UPDATE public.rooms
SET gallery = ARRAY[
  '/images/rooms/villa-2/villa-2-cover.png',
  '/images/rooms/villa-2/villa-2-1.jpg',
  '/images/rooms/villa-2/villa-2-2.jpg',
  '/images/rooms/villa-2/villa-2-3.jpg',
  '/images/rooms/villa-2/villa-2-4.jpg',
  '/images/rooms/villa-2/villa-2-5.jpg',
  '/images/rooms/villa-2/villa-2-6.jpg',
  '/images/rooms/villa-2/villa-2-7.jpg'
]::TEXT[],
updated_at = NOW()
WHERE slug = 'villa-2';
