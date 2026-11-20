import { z } from 'zod'
import { isValidStayDate } from '../booking/dates'

const stayDate = z.string().refine(isValidStayDate, 'Must be a valid date in YYYY-MM-DD format')
const guestToken = z.string().regex(/^[a-f0-9]{64}$/, 'Invalid guest access token')

export const bookingCreationSchema = z.object({
  roomSlug: z.string().trim().min(1).max(100),
  checkIn: stayDate,
  checkOut: stayDate,
  adultGuests: z.number().int().min(1).max(30),
  childGuests: z.number().int().min(0).max(20),
  guestName: z.string().trim().min(2).max(100),
  guestEmail: z.string().trim().email().max(254),
  guestPhone: z.string().trim().min(7).max(20),
  specialRequests: z.string().trim().max(1000).optional(),
  paymentOption: z.enum(['full', 'half']),
  clientRequestId: z.string().uuid(),
  // Keep this token with clientRequestId to recover the same reservation on retry.
  guestAccessToken: guestToken.optional(),
}).refine((input) => input.checkOut > input.checkIn, {
  path: ['checkOut'], message: 'Check-out must be after check-in',
})

export type BookingCreationInput = z.infer<typeof bookingCreationSchema>

export const paymentProofSchema = z.object({
  bookingReference: z.string().regex(/^SBL-\d{4}-\d{4}$/),
  guestAccessToken: guestToken,
  paymentMethod: z.enum(['bank_transfer', 'gcash']),
  amountClaimed: z.number().int().positive().max(2_147_483_647),
})

export const buyoutInquirySchema = z.object({
  contactName: z.string().trim().min(2).max(100),
  contactEmail: z.string().trim().email().max(254),
  contactPhone: z.string().trim().min(7).max(20),
  eventType: z.string().trim().max(100).optional(),
  preferredDates: z.string().trim().max(500).optional(),
  guestCount: z.number().int().positive().max(500).optional(),
  message: z.string().trim().max(2000).optional(),
})

export type BuyoutInquiryInput = z.infer<typeof buyoutInquirySchema>
