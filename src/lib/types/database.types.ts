

export type BookingStatus =
  | 'awaiting_payment'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'

export type PaymentOption = 'full' | 'half'

export type PaymentMethod = 'bank_transfer' | 'gcash'

export type PaymentReviewStatus = 'pending' | 'approved' | 'rejected'

export type RoomCategory = 'Villa' | 'Couple Suite' | 'Family Suite'

export type UserRole = 'user' | 'admin' | 'superadmin'

export type AdminRole = 'admin' | 'superadmin'

export type BuyoutStatus = 'new' | 'contacted' | 'quoted' | 'booked' | 'declined'

export type UserProfileRow = {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export type UserProfileInsert = {
  id: string
  email?: string | null
  full_name?: string | null
  role?: UserRole
  created_at?: string
  updated_at?: string
}

export type UserProfileUpdate = Partial<UserProfileInsert>

export type RoomRow = {
  id: string
  name: string
  slug: string
  category: RoomCategory
  tagline: string | null
  description: string | null
  size_sqm: number | null
  max_guests: number
  min_guests: number
  bed_type: string | null
  location: string | null
  regular_rate: number
  discounted_rate: number | null
  amenities: string[]
  features: string[]
  gallery: string[]
  has_plunge_pool: boolean
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type RoomInsert = {
  id?: string
  name: string
  slug: string
  category: RoomCategory
  tagline?: string | null
  description?: string | null
  size_sqm?: number | null
  max_guests: number
  min_guests?: number
  bed_type?: string | null
  location?: string | null
  regular_rate: number
  discounted_rate?: number | null
  amenities?: string[]
  features?: string[]
  gallery?: string[]
  has_plunge_pool?: boolean
  sort_order?: number
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

export type RoomUpdate = Partial<RoomInsert>

export type ResortSettingsRow = {
  id: number
  check_in_time: string
  check_out_time: string
  extra_person_fee: number
  security_deposit: number
  global_discount_percentage: number
  bank_name: string | null
  bank_account_name: string | null
  bank_account_number: string | null
  bank_qr_url: string | null
  gcash_name: string | null
  gcash_number: string | null
  gcash_qr_url: string | null
  contact_email: string | null
  contact_phone: string | null
  contact_facebook_url: string | null
  contact_instagram_url: string | null
  address: string | null
  created_at: string
  updated_at: string
}

export type ResortSettingsInsert = {
  id?: number
  check_in_time?: string
  check_out_time?: string
  extra_person_fee?: number
  security_deposit?: number
  global_discount_percentage?: number
  bank_name?: string | null
  bank_account_name?: string | null
  bank_account_number?: string | null
  bank_qr_url?: string | null
  gcash_name?: string | null
  gcash_number?: string | null
  gcash_qr_url?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  contact_facebook_url?: string | null
  contact_instagram_url?: string | null
  address?: string | null
  created_at?: string
  updated_at?: string
}

export type ResortSettingsUpdate = Partial<ResortSettingsInsert>

export type BookingRow = {
  id: string
  reference_number: string
  room_id: string
  guest_name: string
  guest_email: string
  guest_phone: string
  adult_guests: number
  child_guests: number
  special_requests: string | null
  check_in: string
  check_out: string
  nights: number  // generated always as (check_out - check_in) stored
  rate_per_night: number
  extra_person_fee: number
  extra_persons: number
  security_deposit: number
  subtotal: number
  total_amount: number
  payment_option: PaymentOption
  amount_paid: number
  remaining_balance: number
  status: BookingStatus
  client_request_id: string
  guest_access_token_hash: string
  admin_notes: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type BookingInsert = {
  id?: string
  reference_number: string
  room_id: string
  guest_name: string
  guest_email: string
  guest_phone: string
  adult_guests?: number
  child_guests?: number
  special_requests?: string | null
  check_in: string
  check_out: string
  rate_per_night: number
  extra_person_fee?: number
  extra_persons?: number
  security_deposit?: number
  subtotal: number
  total_amount: number
  payment_option: PaymentOption
  amount_paid?: number
  remaining_balance?: number
  status?: BookingStatus
  client_request_id: string
  guest_access_token_hash: string
  admin_notes?: string | null
  reviewed_by?: string | null
  reviewed_at?: string | null
  created_at?: string
  updated_at?: string
}

export type BookingUpdate = Partial<BookingInsert>

export type PaymentSubmissionRow = {
  id: string
  booking_id: string
  payment_method: PaymentMethod
  amount_claimed: number
  proof_storage_path: string
  submitted_at: string
  reviewed_by: string | null
  reviewed_at: string | null
  review_status: PaymentReviewStatus
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

export type PaymentSubmissionInsert = {
  id?: string
  booking_id: string
  payment_method: PaymentMethod
  amount_claimed: number
  proof_storage_path: string
  submitted_at?: string
  reviewed_by?: string | null
  reviewed_at?: string | null
  review_status?: PaymentReviewStatus
  rejection_reason?: string | null
  created_at?: string
  updated_at?: string
}

export type PaymentSubmissionUpdate = Partial<PaymentSubmissionInsert>

export type EstateBuyoutInquiryRow = {
  id: string
  contact_name: string
  contact_email: string
  contact_phone: string
  event_type: string | null
  preferred_dates: string | null
  guest_count: number | null
  message: string | null
  status: BuyoutStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export type EstateBuyoutInquiryInsert = {
  id?: string
  contact_name: string
  contact_email: string
  contact_phone: string
  event_type?: string | null
  preferred_dates?: string | null
  guest_count?: number | null
  message?: string | null
  status?: BuyoutStatus
  admin_notes?: string | null
  created_at?: string
  updated_at?: string
}

export type EstateBuyoutInquiryUpdate = Partial<EstateBuyoutInquiryInsert>

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfileRow
        Insert: UserProfileInsert
        Update: UserProfileUpdate
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      rooms: {
        Row: RoomRow
        Insert: RoomInsert
        Update: RoomUpdate
        Relationships: []
      }
      resort_settings: {
        Row: ResortSettingsRow
        Insert: ResortSettingsInsert
        Update: ResortSettingsUpdate
        Relationships: []
      }
      bookings: {
        Row: BookingRow
        Insert: BookingInsert
        Update: BookingUpdate
        Relationships: [
          {
            foreignKeyName: "bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      payment_submissions: {
        Row: PaymentSubmissionRow
        Insert: PaymentSubmissionInsert
        Update: PaymentSubmissionUpdate
        Relationships: [
          {
            foreignKeyName: "payment_submissions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          }
        ]
      }
      estate_buyout_inquiries: {
        Row: EstateBuyoutInquiryRow
        Insert: EstateBuyoutInquiryInsert
        Update: EstateBuyoutInquiryUpdate
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      review_payment: {
        Args: { submission_id: string; decision: string; reviewer_id: string; rejection_reason?: string }
        Returns: BookingStatus
      }
      submit_payment_proof: {
        Args: { booking_id: string; token_hash: string; method: string; amount: number; storage_path: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
