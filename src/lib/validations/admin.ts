import { z } from 'zod'

const money = z.number().int().min(0).max(2_147_483_647)
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use a valid 24-hour time')
const optionalText = (max: number) => z.string().trim().max(max).optional()
const optionalUrl = z.union([z.literal(''), z.url({ protocol: /^https?$/ })]).optional()

export const paymentSettingsSchema = z.object({
  bank_name: optionalText(100), bank_account_name: optionalText(100),
  bank_account_number: optionalText(50), gcash_name: optionalText(100),
  gcash_number: optionalText(20),
})

export const bookingSettingsSchema = z.object({
  extra_person_fee: money, security_deposit: money,
  check_in_time: time, check_out_time: time,
})

export const siteDetailsSchema = z.object({
  contact_email: z.union([z.literal(''), z.string().trim().email().max(254)]),
  contact_phone: z.string().trim().max(20),
  contact_facebook_url: optionalUrl, contact_instagram_url: optionalUrl,
  address: z.string().trim().max(300),
})


export const roomUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(100),
  category: z.enum(['Villa', 'Couple Suite', 'Family Suite']),
  tagline: z.string().trim().max(300), description: z.string().trim().max(5000),
  size_sqm: z.number().int().min(0).max(100_000).nullable(),
  max_guests: z.number().int().min(1).max(500), min_guests: z.number().int().min(1).max(500),
  bed_type: z.string().trim().max(200), location: z.string().trim().max(200),
  regular_rate: money,
  amenities: z.array(z.string().trim().min(1).max(200)).max(100),
  features: z.array(z.string().trim().min(1).max(200)).max(100),
  gallery: z.array(z.string().trim().max(2048).refine((value) =>
    /^\/(?!\/)/.test(value) || z.url({ protocol: /^https?$/ }).safeParse(value).success,
  'Use an image path or HTTP(S) URL')).max(100),
  has_plunge_pool: z.boolean(), is_active: z.boolean(),
}).refine((room) => room.min_guests <= room.max_guests, {
  path: ['min_guests'], message: 'Minimum guests cannot exceed maximum guests',
})

export const paymentReviewSchema = z.object({
  paymentSubmissionId: z.string().uuid(), decision: z.enum(['approved', 'rejected']),
  rejectionReason: optionalText(1000),
})

export const buyoutUpdateSchema = z.object({
  inquiryId: z.string().uuid(),
  status: z.enum(['new', 'contacted', 'quoted', 'booked', 'declined']),
  adminNotes: optionalText(2000),
})

export const userRoleSchema = z.object({
  userId: z.string().uuid(), role: z.enum(['user', 'admin', 'superadmin']),
})
