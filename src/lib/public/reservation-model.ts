import { z } from 'zod'
import { bookingCreationSchema } from '../validations/booking'
import { isValidStayDate } from '../booking/dates'
import type { BookingCreationInput } from '../validations/booking'
import type { PricingResult } from '../booking/pricing'
import type { PaymentMethod, ResortSettingsRow } from '../types/database.types'

export type ReservationInput = Omit<BookingCreationInput, 'clientRequestId' | 'guestAccessToken'>
export type PaymentDetails = Pick<ResortSettingsRow, 'bank_name' | 'bank_account_name' | 'bank_account_number' | 'bank_qr_url' | 'gcash_name' | 'gcash_number' | 'gcash_qr_url'>
export type ReviewedReservation = { input: ReservationInput; roomName: string; pricing: PricingResult }
export type ReservationSnapshot = {
  referenceNumber: string; roomName: string; roomSlug: string
  checkIn: string; checkOut: string; adultGuests: number; childGuests: number
  paymentOption: 'full' | 'half'; pricing: PricingResult
  submitted: boolean; paymentReviewStatus: 'pending' | 'approved' | null
  canSubmit: boolean; rejectedProof: boolean
}

export const requestDisclaimer = 'Submitting a booking request and payment proof does not automatically guarantee accommodation availability. Management will review your submission and contact you to finalize arrangements.'
export const submissionMessage = 'Your booking request and payment proof have been submitted successfully. Our management team will review your submission and contact you to finalize your stay.'

export const stayDetailsSchema = z.object({
  checkIn: bookingCreationSchema.shape.checkIn, checkOut: bookingCreationSchema.shape.checkOut,
  adultGuests: bookingCreationSchema.shape.adultGuests, childGuests: bookingCreationSchema.shape.childGuests,
}).refine(input => input.checkOut > input.checkIn, { path: ['checkOut'], message: 'Check-out must be after check-in.' })

export const staySchema = stayDetailsSchema.safeExtend({ roomSlug: bookingCreationSchema.shape.roomSlug })

export const guestDetailsSchema = z.object({
  guestName: bookingCreationSchema.shape.guestName, guestEmail: bookingCreationSchema.shape.guestEmail,
  guestPhone: bookingCreationSchema.shape.guestPhone, specialRequests: bookingCreationSchema.shape.specialRequests,
})

const preferenceDate = z.string().refine(value => value === '' || isValidStayDate(value))
export const stayDraftSchema = z.object({
  version: z.literal(1), flowId: z.string().uuid(), expiresAt: z.number().int(),
  roomSlug: z.string().max(100), checkIn: preferenceDate, checkOut: preferenceDate,
  adultGuests: bookingCreationSchema.shape.adultGuests, childGuests: bookingCreationSchema.shape.childGuests,
  paymentOption: bookingCreationSchema.shape.paymentOption,
})
export type StayDraft = z.infer<typeof stayDraftSchema>
export const stayDraftKey = 'seabliss.stay.v1'

export const urlStayPreferencesSchema = z.object({
  roomSlug: z.string().max(100).optional(),
  checkIn: z.string().refine(value => value === '' || isValidStayDate(value)).optional(),
  checkOut: z.string().refine(value => value === '' || isValidStayDate(value)).optional(),
  adultGuests: bookingCreationSchema.shape.adultGuests.optional(),
  childGuests: bookingCreationSchema.shape.childGuests.optional(),
}).refine(input => !input.checkIn || !input.checkOut || input.checkOut > input.checkIn, {
  path: ['checkOut'],
  message: 'Check-out must be after check-in.',
})

export type UrlStayPreferences = z.infer<typeof urlStayPreferencesSchema>

export function parseUrlStayPreferences(params: Record<string, string | string[] | undefined>): UrlStayPreferences | null {
  const room = typeof params.room === 'string' && params.room.trim() ? params.room.trim() : undefined
  const checkInRaw = typeof params.checkIn === 'string' ? params.checkIn.trim() : undefined
  const checkOutRaw = typeof params.checkOut === 'string' ? params.checkOut.trim() : undefined
  if (checkInRaw && !isValidStayDate(checkInRaw)) return null
  if (checkOutRaw && !isValidStayDate(checkOutRaw)) return null

  const adultsRaw = typeof params.adults === 'string' ? params.adults : typeof params.guests === 'string' ? params.guests : undefined
  let adultsVal: number | undefined
  if (adultsRaw !== undefined) {
    if (!/^\d+$/.test(adultsRaw.trim())) return null
    adultsVal = Number(adultsRaw.trim())
  }

  const childrenRaw = typeof params.children === 'string' ? params.children : undefined
  let childrenVal: number | undefined
  if (childrenRaw !== undefined) {
    if (!/^\d+$/.test(childrenRaw.trim())) return null
    childrenVal = Number(childrenRaw.trim())
  }

  const result = urlStayPreferencesSchema.safeParse({
    roomSlug: room,
    checkIn: checkInRaw,
    checkOut: checkOutRaw,
    adultGuests: adultsVal,
    childGuests: childrenVal,
  })
  return result.success ? result.data : null
}

export function parseStayDraft(value: string | null, now = Date.now()): StayDraft | null {
  try {
    const result = stayDraftSchema.safeParse(JSON.parse(value ?? 'null'))
    return result.success && result.data.expiresAt > now && result.data.expiresAt <= now + 86_400_000 ? result.data : null
  } catch { return null }
}

export function configuredPaymentMethods(settings: PaymentDetails | null): PaymentMethod[] {
  if (!settings) return []
  const methods: PaymentMethod[] = []
  if (settings.bank_name?.trim() && ((settings.bank_account_name?.trim() && settings.bank_account_number?.trim()) || safeQRSource(settings.bank_qr_url))) methods.push('bank_transfer')
  if ((settings.gcash_name?.trim() && settings.gcash_number?.trim()) || safeQRSource(settings.gcash_qr_url)) methods.push('gcash')
  return methods
}

export function safeQRSource(value: string | null | undefined): string | null {
  if (!value) return null
  if (/^\/(?!\/)/.test(value)) return value
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null } catch { return null }
}

export function receiptValidation(file: { size: number; type: string } | null): string | null {
  if (!file || file.size <= 0) return 'Choose a payment receipt.'
  if (file.size > 10 * 1024 * 1024) return 'The receipt must be no larger than 10 MB.'
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'].includes(file.type)) return 'Upload a JPEG, PNG, WebP, HEIC, or PDF receipt.'
  return null
}
