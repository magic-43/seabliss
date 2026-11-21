-- ============================================================
-- Migration 001: Seabliss Beach Resort Database Foundation
-- Standalone, production-grade schema for Seabliss Beach Resort
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Timestamp Trigger Function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. User Profiles Table (automatically populated for all users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_user_profiles
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Automatic Trigger to sync users from auth.users to user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users from auth.users immediately
INSERT INTO public.user_profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  'user'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Rooms & Villas Table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Villa', 'Couple Suite', 'Family Suite')),
  tagline TEXT,
  description TEXT,
  size_sqm INTEGER,
  max_guests INTEGER NOT NULL CHECK (max_guests >= 1),
  min_guests INTEGER NOT NULL DEFAULT 1 CHECK (min_guests >= 1),
  bed_type TEXT,
  location TEXT,
  regular_rate INTEGER NOT NULL CHECK (regular_rate >= 0),
  discounted_rate INTEGER CHECK (discounted_rate IS NULL OR discounted_rate >= 0),
  amenities TEXT[] NOT NULL DEFAULT '{}',
  features TEXT[] NOT NULL DEFAULT '{}',
  gallery TEXT[] NOT NULL DEFAULT '{}',
  has_plunge_pool BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_rooms
BEFORE UPDATE ON public.rooms
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 4. Resort Settings Table (Singleton)
CREATE TABLE IF NOT EXISTS public.resort_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  check_in_time TEXT NOT NULL DEFAULT '14:00',
  check_out_time TEXT NOT NULL DEFAULT '12:00',
  extra_person_fee INTEGER NOT NULL DEFAULT 500,
  security_deposit INTEGER NOT NULL DEFAULT 5000,
  global_discount_percentage INTEGER NOT NULL DEFAULT 50,

  -- Bank transfer
  bank_name TEXT DEFAULT 'BDO Unibank',
  bank_account_name TEXT DEFAULT 'Seabliss Beach Resort',
  bank_account_number TEXT DEFAULT '001234567890',
  bank_qr_url TEXT,

  -- GCash
  gcash_name TEXT DEFAULT 'Seabliss Beach Resort',
  gcash_number TEXT DEFAULT '09171996967',
  gcash_qr_url TEXT,

  -- Contact details
  contact_email TEXT DEFAULT 'reservations@seablissbeach-resort.com',
  contact_phone TEXT DEFAULT '+63 917 199 6967',
  contact_facebook_url TEXT DEFAULT 'https://www.facebook.com/seablissbeachresortmain',
  contact_instagram_url TEXT DEFAULT 'https://www.instagram.com/seablissbeachresort',
  address TEXT DEFAULT 'Lian, Batangas, Philippines',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_resort_settings
BEFORE UPDATE ON public.resort_settings
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 5. Bookings Ledger Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT UNIQUE NOT NULL,
  room_id UUID NOT NULL REFERENCES public.rooms(id),

  -- Guest details
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT NOT NULL,
  adult_guests INTEGER NOT NULL DEFAULT 1 CHECK (adult_guests >= 1),
  child_guests INTEGER NOT NULL DEFAULT 0 CHECK (child_guests >= 0),
  special_requests TEXT,

  -- Dates & Stay
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,

  -- Financial snapshot
  rate_per_night INTEGER NOT NULL,
  extra_person_fee INTEGER NOT NULL DEFAULT 0,
  extra_persons INTEGER NOT NULL DEFAULT 0,
  security_deposit INTEGER NOT NULL DEFAULT 0,
  subtotal INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  payment_option TEXT NOT NULL CHECK (payment_option IN ('full', 'half')),
  amount_paid INTEGER NOT NULL DEFAULT 0,
  remaining_balance INTEGER NOT NULL DEFAULT 0,

  -- Status & Security
  status TEXT NOT NULL DEFAULT 'awaiting_payment' CHECK (status IN ('awaiting_payment','pending_review','approved','rejected','cancelled','completed')),
  client_request_id UUID NOT NULL UNIQUE,
  guest_access_token_hash TEXT NOT NULL,

  -- Admin review & notes
  admin_notes TEXT,
  reviewed_by UUID REFERENCES public.user_profiles(id),
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT check_dates CHECK (check_out > check_in)
);

CREATE TRIGGER set_timestamp_bookings
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 6. Payment Submissions Table
CREATE TABLE IF NOT EXISTS public.payment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'gcash')),
  amount_claimed INTEGER NOT NULL CHECK (amount_claimed > 0),
  proof_storage_path TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES public.user_profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_payment_submissions
BEFORE UPDATE ON public.payment_submissions
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 7. Estate Buyout Inquiries Table
CREATE TABLE IF NOT EXISTS public.estate_buyout_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  event_type TEXT,
  preferred_dates TEXT,
  guest_count INTEGER,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'quoted', 'booked', 'declined')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_estate_buyout_inquiries
BEFORE UPDATE ON public.estate_buyout_inquiries
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- 8. Storage Bucket for Payment Proofs (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-proofs',
  'payment-proofs',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 9. Row Level Security Policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resort_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estate_buyout_inquiries ENABLE ROW LEVEL SECURITY;

-- User Profiles RLS (non-recursive)
CREATE POLICY "Allow authenticated read user_profiles"
ON public.user_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile name"
ON public.user_profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- Rooms RLS
CREATE POLICY "Rooms are publicly readable if active"
ON public.rooms FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can manage rooms"
ON public.rooms FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
));

-- Resort Settings RLS
CREATE POLICY "Settings are publicly readable"
ON public.resort_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage settings"
ON public.resort_settings FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
));

-- Bookings RLS
CREATE POLICY "Anyone can create a booking"
ON public.bookings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view and manage all bookings"
ON public.bookings FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
));

-- Payment Submissions RLS
CREATE POLICY "Anyone can submit payment proofs"
ON public.payment_submissions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view and manage payment submissions"
ON public.payment_submissions FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
));

-- Buyout Inquiries RLS
CREATE POLICY "Anyone can submit buyout inquiries"
ON public.estate_buyout_inquiries FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view and manage buyout inquiries"
ON public.estate_buyout_inquiries FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
));

-- Storage Policies
CREATE POLICY "Anyone can upload payment proof"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Admins can access payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs' AND EXISTS (
  SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
));

CREATE POLICY "Admins can delete payment proofs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'payment-proofs' AND EXISTS (
  SELECT 1 FROM public.user_profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
));

-- 10. Seed Initial Resort Settings
INSERT INTO public.resort_settings (
  id, check_in_time, check_out_time, extra_person_fee, security_deposit, global_discount_percentage,
  bank_name, bank_account_name, bank_account_number,
  gcash_name, gcash_number,
  contact_email, contact_phone, contact_facebook_url, contact_instagram_url, address
) VALUES (
  1, '14:00', '12:00', 500, 5000, 50,
  'BDO Unibank', 'Seabliss Beach Resort', '001234567890',
  'Seabliss Beach Resort', '09171996967',
  'reservations@seablissbeach-resort.com', '+63 917 199 6967',
  'https://www.facebook.com/seablissbeachresortmain',
  'https://www.instagram.com/seablissbeachresort',
  'Lian, Batangas, Philippines'
) ON CONFLICT (id) DO UPDATE SET updated_at = NOW();

-- 11. Seed 7 Verified Rooms (4 Villas + 2 Couple Suites + 1 Family Suite)
INSERT INTO public.rooms (
  slug, name, category, regular_rate, discounted_rate, max_guests, min_guests,
  has_plunge_pool, bed_type, size_sqm, location, tagline, description, sort_order,
  features, amenities, gallery
) VALUES
(
  'villa-4', 'Villa 4', 'Villa', 39000, 19500, 20, 18,
  true, '4 King Beds + 4 Double Beds with extra mattress', 90, 'Villa Row',
  'The pinnacle of beachside villa living',
  'Our flagship Villa 4 is the ultimate private beach villa experience at Seabliss Resort. Designed for large groups and special celebrations, it boasts generous living spaces, premium furnishings, multiple bedrooms, and a private outdoor retreat — all within earshot of the gentle waves of the sea.',
  1,
  ARRAY['Buffet Breakfast & Dinner', 'Welcome Drinks upon Arrival', 'Complimentary Wi-Fi', 'Daily Housekeeping & Resort Service', 'Free Use of Swimming Pools & Beach Facilities', 'Free Parking', 'Beach Access & Sun Lounger']::TEXT[],
  ARRAY['Private Plunge Pool', 'Buffet Breakfast Included', 'Complimentary High-speed Wi-Fi', 'Private En-suite Bathrooms', 'Air Conditioning', 'Beachfront Ocean Access', 'Free On-site Parking', 'Dedicated Resort Concierge']::TEXT[],
  ARRAY['/images/rooms/villa-4/villa-4-1.jpg', '/images/rooms/villa-4/villa-4-2.jpg', '/images/rooms/villa-4/villa-4-3.jpg', '/images/rooms/villa-4/villa-4-4.jpg', '/images/rooms/villa-4/villa-4-5.jpg', '/images/rooms/villa-4/villa-4-6.jpg', '/images/rooms/villa-4/villa-4-7.jpg']::TEXT[]
),
(
  'villa-3', 'Villa 3', 'Villa', 35600, 17800, 16, 13,
  true, '4 King Beds & 2 Double Beds', 75, 'Villa Row',
  'Space, style, and sea breeze — all yours',
  'Villa 3 is a spacious and elegantly appointed private villa ideal for larger families and group getaways. Featuring multiple sleeping areas, a sun-drenched outdoor terrace, and sophisticated tropical interiors, it delivers a premium resort experience with the privacy and freedom of a standalone villa.',
  2,
  ARRAY['Buffet Breakfast & Dinner', 'Welcome Drinks upon Arrival', 'Complimentary Wi-Fi', 'Daily Housekeeping & Resort Service', 'Free Use of Swimming Pools & Beach Facilities', 'Free Parking', 'Beach Access & Sun Lounger']::TEXT[],
  ARRAY['Private Plunge Pool', 'Buffet Breakfast Included', 'Complimentary High-speed Wi-Fi', 'Private En-suite Bathrooms', 'Air Conditioning', 'Beachfront Ocean Access', 'Free On-site Parking', 'Dedicated Resort Concierge']::TEXT[],
  ARRAY['/images/rooms/villa-3/villa-3-1.jpg', '/images/rooms/villa-3/villa-3-2.jpg', '/images/rooms/villa-3/villa-3-3.jpg', '/images/rooms/villa-3/villa-3-4.jpg', '/images/rooms/villa-3/villa-3-5.jpg', '/images/rooms/villa-3/villa-3-6.jpg', '/images/rooms/villa-3/villa-3-7.jpg', '/images/rooms/villa-3/villa-3-8.jpg', '/images/rooms/villa-3/villa-3-9.jpg']::TEXT[]
),
(
  'villa-2', 'Villa 2', 'Villa', 31000, 15500, 12, 5,
  true, '2 King Bed + 2 Single Beds extra mattress', 65, 'Villa Row',
  'Private comfort, limitless relaxation',
  'Villa 2 is a beautifully designed private villa that blends contemporary tropical style with the relaxed comfort of beachside living. Perfect for families and groups seeking tranquility, it features spacious interiors, a private outdoor area, and curated resort amenities that elevate your entire stay.',
  3,
  ARRAY['Buffet Breakfast & Dinner', 'Welcome Drinks upon Arrival', 'Complimentary Wi-Fi', 'Daily Housekeeping & Resort Service', 'Free Use of Swimming Pools & Beach Facilities', 'Free Parking', 'Beach Access & Sun Lounger']::TEXT[],
  ARRAY['Private Plunge Pool', 'Buffet Breakfast Included', 'Complimentary High-speed Wi-Fi', 'Private En-suite Bathrooms', 'Air Conditioning', 'Beachfront Ocean Access', 'Free On-site Parking', 'Dedicated Resort Concierge']::TEXT[],
  ARRAY['/images/rooms/villa-2/villa-2-cover.png', '/images/rooms/villa-2/villa-2-1.jpg', '/images/rooms/villa-2/villa-2-2.jpg', '/images/rooms/villa-2/villa-2-3.jpg', '/images/rooms/villa-2/villa-2-4.jpg', '/images/rooms/villa-2/villa-2-5.jpg', '/images/rooms/villa-2/villa-2-6.jpg', '/images/rooms/villa-2/villa-2-7.jpg']::TEXT[]
),
(
  'villa-1', 'Villa 1', 'Villa', 29000, 14500, 10, 4,
  true, '1 King Bed + 2 Single Beds', 60, 'Villa Row',
  'Your own private slice of paradise',
  'Villa 1 offers an intimate private villa experience crafted for couples and small families seeking exclusivity by the beach. With lush tropical landscaping, a private veranda, and elegantly appointed interiors, this villa provides a serene sanctuary where every moment feels like a special occasion.',
  4,
  ARRAY['Buffet Breakfast & Dinner', 'Welcome Drinks upon Arrival', 'Complimentary Wi-Fi', 'Daily Housekeeping & Resort Service', 'Free Use of Swimming Pools & Beach Facilities', 'Free Parking', 'Beach Access & Sun Lounger']::TEXT[],
  ARRAY['Private Plunge Pool', 'Buffet Breakfast Included', 'Complimentary High-speed Wi-Fi', 'Private En-suite Bathrooms', 'Air Conditioning', 'Beachfront Ocean Access', 'Free On-site Parking', 'Dedicated Resort Concierge']::TEXT[],
  ARRAY['/images/rooms/villa-1/villa-1-1.jpg', '/images/rooms/villa-1/villa-1-2.jpg', '/images/rooms/villa-1/villa-1-3.jpg', '/images/rooms/villa-1/villa-1-4.jpg', '/images/rooms/villa-1/villa-1-5.jpg', '/images/rooms/villa-1/villa-1-6.jpg', '/images/rooms/villa-1/villa-1-7.jpg']::TEXT[]
),
(
  'sanctuary-family-suite', 'The Sanctuary Family Suite', 'Family Suite', 23940, 11970, 6, 4,
  false, '2 Queen Beds + Daybed', 85, 'Family Wing',
  'An expansive coastal residence for cherished family moments',
  'The Sanctuary Family Suite is our premier family accommodation, comfortably hosting up to 6 guests. With bright open spaces, curated modern aesthetic, direct access to resort grounds, and generous lounging zones, it is designed for families to unwind together in barefoot luxury.',
  5,
  ARRAY['Buffet Breakfast & Dinner', 'Welcome Drinks upon Arrival', 'Complimentary Wi-Fi', 'Daily Housekeeping & Resort Service', 'Free Use of Swimming Pools & Beach Facilities', 'Free Parking', 'Beach Access & Sun Lounger']::TEXT[],
  ARRAY['Buffet Breakfast Included', 'Complimentary High-speed Wi-Fi', 'Spacious En-suite Bathroom', 'Air Conditioning', 'Direct Resort Grounds Access', 'Free On-site Parking', 'Resort Pool Access']::TEXT[],
  ARRAY['/images/rooms/sanctuary-family-suite/sanctuary-family-suite-6.jpg', '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-2.jpg', '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-1.jpg', '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-3.jpg', '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-4.jpg', '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-5.jpg', '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-7.jpg', '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-8.jpg', '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-9.jpg', '/images/rooms/sanctuary-family-suite/sanctuary-family-suite-10.jpg']::TEXT[]
),
(
  'poolside-veranda-suite', 'The Poolside Veranda Suite', 'Couple Suite', 13560, 6780, 2, 1,
  false, '1 King Bed', 48, 'Poolside Wing',
  'Steps from the crystal water, surrounded by tropical tranquility',
  'A tranquil poolside haven designed for romance and relaxation. Just steps away from the sparkling resort pool with a secluded sun deck, tropical garden enclave, and understated coastal elegance.',
  6,
  ARRAY['Buffet Breakfast & Dinner', 'Welcome Drinks upon Arrival', 'Complimentary Wi-Fi', 'Daily Housekeeping & Resort Service', 'Free Use of Swimming Pools & Beach Facilities', 'Free Parking', 'Beach Access & Sun Lounger']::TEXT[],
  ARRAY['Buffet Breakfast Included', 'Complimentary High-speed Wi-Fi', 'Private En-suite Bathroom', 'Air Conditioning', 'Poolside Veranda & Loungers', 'Free On-site Parking', 'Resort Pool Access']::TEXT[],
  ARRAY['/images/rooms/poolside-veranda-suite/poolside-veranda-suite-cover.png', '/images/rooms/poolside-veranda-suite/poolside-veranda-suite-4.jpg', '/images/rooms/poolside-veranda-suite/poolside-veranda-suite-1.jpg', '/images/rooms/poolside-veranda-suite/poolside-veranda-suite-2.jpg', '/images/rooms/poolside-veranda-suite/poolside-veranda-suite-3.jpg', '/images/rooms/poolside-veranda-suite/poolside-veranda-suite-5.jpg', '/images/rooms/poolside-veranda-suite/poolside-veranda-suite-6.jpg']::TEXT[]
),
(
  'horizon-beachfront-suite', 'The Horizon Beachfront Suite', 'Couple Suite', 10900, 5450, 2, 1,
  false, '1 King Bed', 35, 'Beachfront Wing',
  'Where ocean horizons meet barefoot luxury',
  'An intimate beachfront sanctuary curated for couples. Step directly from your private veranda onto the soft sands of Lian, Batangas. Features sweeping ocean views, plush king-size bedding, and calming sea breezes.',
  7,
  ARRAY['Buffet Breakfast & Dinner', 'Welcome Drinks upon Arrival', 'Complimentary Wi-Fi', 'Daily Housekeeping & Resort Service', 'Free Use of Swimming Pools & Beach Facilities', 'Free Parking', 'Beach Access & Sun Lounger']::TEXT[],
  ARRAY['Buffet Breakfast Included', 'Complimentary High-speed Wi-Fi', 'Private En-suite Bathroom', 'Air Conditioning', 'Beachfront Veranda', 'Free On-site Parking', 'Direct Beach Access']::TEXT[],
  ARRAY['/images/rooms/horizon-beachfront-suite/horizon-beachfront-suite-1.jpg', '/images/rooms/horizon-beachfront-suite/horizon-beachfront-suite-2.jpg', '/images/rooms/horizon-beachfront-suite/horizon-beachfront-suite-3.jpg', '/images/rooms/horizon-beachfront-suite/horizon-beachfront-suite-4.jpg', '/images/rooms/horizon-beachfront-suite/horizon-beachfront-suite-5.jpg', '/images/rooms/horizon-beachfront-suite/horizon-beachfront-suite-6.jpg', '/images/rooms/horizon-beachfront-suite/horizon-beachfront-suite-7.jpg', '/images/rooms/horizon-beachfront-suite/horizon-beachfront-suite-8.jpg']::TEXT[]
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  regular_rate = EXCLUDED.regular_rate,
  discounted_rate = EXCLUDED.discounted_rate,
  max_guests = EXCLUDED.max_guests,
  min_guests = EXCLUDED.min_guests,
  has_plunge_pool = EXCLUDED.has_plunge_pool,
  bed_type = EXCLUDED.bed_type,
  size_sqm = EXCLUDED.size_sqm,
  location = EXCLUDED.location,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  features = EXCLUDED.features,
  amenities = EXCLUDED.amenities,
  gallery = EXCLUDED.gallery,
  updated_at = NOW();
