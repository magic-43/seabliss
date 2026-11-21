'use server'

import { bookingCreationSchema, paymentProofSchema } from '@/lib/validations/booking'
import { calculatePricing } from '@/lib/booking/pricing'
import { todayInManila } from '@/lib/booking/dates'
import { createAdminClient } from '@/lib/supabase/admin'
import { createBookingAction, submitPaymentProofAction } from './booking'
import { getPublicResortData } from '@/lib/public/data'
import { configuredPaymentMethods } from '@/lib/public/reservation-model'
import { getOwnedReservation, getPaymentDetails } from '@/lib/public/reservation-data'
import { fingerprint, flowIdSchema, newReservationSession, readReservationSession, saveReservationSession } from '@/lib/public/reservation-session'
import type { ReviewedReservation, ReservationSnapshot } from '@/lib/public/reservation-model'
import type { ActionResult } from '@/lib/types/action-result'

function fail(message: string): { success: false; error: string } { return { success: false, error: message } }
class ReservationInputError extends Error {}

async function quote(flowId: string, raw: unknown): Promise<ReviewedReservation> {
  if (!flowIdSchema.safeParse(flowId).success) throw new ReservationInputError('Invalid request identifier. Start a new request.')
  const parsed = bookingCreationSchema.safeParse({ ...(typeof raw === 'object' && raw ? raw : {}), clientRequestId: flowId, guestAccessToken: undefined })
  if (!parsed.success) throw new ReservationInputError(parsed.error.issues[0].message)
  const { clientRequestId: _id, guestAccessToken: _token, ...input } = parsed.data
  void _id; void _token
  if (input.checkIn < todayInManila()) throw new ReservationInputError('Check-in cannot be in the past.')
  const [{ rooms, settings }, payment] = await Promise.all([getPublicResortData(), getPaymentDetails()])
  const room = rooms?.find(room => room.slug === input.roomSlug)
  if (!room || !settings) throw new ReservationInputError('Could not load current accommodation prices. Please try again.')
  if (!configuredPaymentMethods(payment).length) throw new ReservationInputError('Online payment details are being updated. Contact management before sending payment.')
  const pricing = calculatePricing({
    regularRate: room.regular_rate, checkIn: input.checkIn, checkOut: input.checkOut,
    adultGuests: input.adultGuests, childGuests: input.childGuests, roomMaxGuests: room.max_guests,
    extraPersonFee: settings.extra_person_fee, securityDeposit: settings.security_deposit, paymentOption: input.paymentOption,
  })
  if (!Number.isSafeInteger(pricing.totalAmount) || pricing.totalAmount > 2_147_483_647 || pricing.amountDue <= 0) throw new ReservationInputError('Please contact management to arrange this stay.')
  return { input, roomName: room.name, pricing }
}

function publicError(error: unknown, fallback: string) {
  return fail(error instanceof ReservationInputError ? error.message : fallback)
}

export async function reviewReservationAction(flowId: string, raw: unknown): Promise<ActionResult<ReviewedReservation>> {
  try {
    const reviewed = await quote(flowId, raw)
    let session = await readReservationSession(flowId)
    if (!session) {
      // A lost/expired credential must never be silently replaced for an existing request.
      const { data, error } = await createAdminClient().from('bookings').select('id').eq('client_request_id', flowId).maybeSingle()
      if (error) return fail('Could not prepare a secure request. Please try again.')
      if (data) return fail('This request already exists, but its browser access has expired. Contact management; do not submit another payment.')
      session = newReservationSession(flowId)
    } else if (await getOwnedReservation(flowId)) return fail('This request is already recorded. Resume its payment step or contact management to change it.')
    await saveReservationSession({ ...session, quoteHash: fingerprint(reviewed), reviewedAt: Date.now() })
    // No booking exists yet: the browser receives its HttpOnly credential before creation.
    return { success: true, data: reviewed }
  } catch (error) {
    console.error('Could not prepare public reservation')
    return publicError(error, 'Could not prepare your request. Please retry.')
  }
}

export async function createReviewedReservationAction(flowId: string, raw: unknown): Promise<ActionResult<ReservationSnapshot>> {
  try {
    const session = await readReservationSession(flowId)
    if (!session) return fail('Your secure review has expired. Review the details again before continuing.')
    const existing = await getOwnedReservation(flowId)
    if (existing) return { success: true, data: existing }
    const reviewed = await quote(flowId, raw)
    if (!session.reviewedAt || Date.now() - session.reviewedAt > 15 * 60_000 || session.quoteHash !== fingerprint(reviewed)) return fail('Your details or prices have changed. Return to the review step and check the current charges.')
    const result = await createBookingAction({ ...reviewed.input, clientRequestId: flowId, guestAccessToken: session.token })
    if (!result.success) return result
    const saved = await getOwnedReservation(flowId)
    if (!saved) return fail('The request may have been recorded. Please retry safely using this page.')
    return { success: true, data: saved }
  } catch {
    return fail('We could not confirm whether the request was recorded. Retry on this page; the same request identifier will be reused.')
  }
}

export async function resumeReservationAction(flowId: string): Promise<ActionResult<ReservationSnapshot | null>> {
  try { return { success: true, data: await getOwnedReservation(flowId) } }
  catch { return fail('Could not check your saved request. Please retry before creating another request or sending payment.') }
}

export async function submitReservationPaymentAction(flowId: string, form: FormData): Promise<ActionResult<{ referenceNumber: string }>> {
  try {
    const session = await readReservationSession(flowId)
    const booking = await getOwnedReservation(flowId)
    if (!session || !booking) return fail('This browser cannot access the request. Contact management before sending another payment.')
    if (booking.submitted) return { success: true, data: { referenceNumber: booking.referenceNumber } }
    if (!booking.canSubmit) return fail('This request can no longer accept payment proof. Please contact management.')
    if (!(form instanceof FormData)) return fail('Invalid payment submission.')
    if (form.get('acknowledgedTotal') !== String(booking.pricing.totalAmount)) return fail('Review the saved charges and availability notice before submitting payment proof.')
    const methods = configuredPaymentMethods(await getPaymentDetails())
    const parsed = paymentProofSchema.safeParse({ bookingReference: booking.referenceNumber, guestAccessToken: session.token, paymentMethod: form.get('paymentMethod'), amountClaimed: Number(form.get('amountClaimed')) })
    if (!parsed.success) return fail(parsed.error.issues[0].message)
    if (!methods.includes(parsed.data.paymentMethod)) return fail('Select a currently configured payment method, or contact management.')
    if (parsed.data.amountClaimed > booking.pricing.totalAmount) return fail('The claimed payment exceeds this request’s total.')
    const payload = new FormData()
    const file = form.get('file')
    if (file instanceof File) payload.set('file', file)
    payload.set('bookingReference', booking.referenceNumber)
    payload.set('guestAccessToken', session.token)
    payload.set('paymentMethod', parsed.data.paymentMethod)
    payload.set('amountClaimed', String(parsed.data.amountClaimed))
    const result = await submitPaymentProofAction(payload)
    if (!result.success) return result
    return { success: true, data: { referenceNumber: booking.referenceNumber } }
  } catch { return fail('Could not confirm the receipt submission. Use “Check Submission Status” before retrying the upload.') }
}
