'use server'

import { randomUUID } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { bookingCreationSchema, buyoutInquirySchema, paymentProofSchema } from '@/lib/validations/booking'
import { calculatePricing } from '@/lib/booking/pricing'
import { todayInManila } from '@/lib/booking/dates'
import { generateReferenceNumber } from '@/lib/booking/reference'
import { generateGuestAccessToken, hashGuestAccessToken, verifyGuestAccessToken } from '@/lib/booking/access-token'
import type { ActionResult } from '@/lib/types/action-result'
import { revalidatePath } from 'next/cache'

function failure(error: unknown, message: string): { success: false; error: string } {
  console.error(message, error)
  return { success: false, error: message }
}

type BookingReceipt = { referenceNumber: string; guestAccessToken: string }

export async function createBookingAction(rawInput: unknown): Promise<ActionResult<BookingReceipt>> {
  const parsed = bookingCreationSchema.safeParse(rawInput)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  const input = parsed.data
  try {
    // Guests cannot read the booking ledger directly. Every read is scoped here.
    const supabase = createAdminClient()
    const findExisting = () => supabase.from('bookings')
      .select('reference_number, guest_access_token_hash')
      .eq('client_request_id', input.clientRequestId).maybeSingle()
    const recoverBooking = (booking: { reference_number: string; guest_access_token_hash: string }): ActionResult<BookingReceipt> => {
      if (input.guestAccessToken && verifyGuestAccessToken(input.guestAccessToken, booking.guest_access_token_hash)) {
        return { success: true, data: { referenceNumber: booking.reference_number, guestAccessToken: input.guestAccessToken } }
      }
      return { success: false, error: 'This request already has a reservation. Use its original access token or contact the resort.' }
    }
    const { data: existing, error: lookupError } = await findExisting()
    if (lookupError) return failure(lookupError, 'Could not check the reservation request.')
    if (existing) return recoverBooking(existing)
    if (input.checkIn < todayInManila()) {
      return { success: false, error: 'Check-in cannot be in the past.' }
    }

    const [{ data: room, error: roomError }, { data: settings, error: settingsError }] = await Promise.all([
      supabase.from('rooms').select('*').eq('slug', input.roomSlug).eq('is_active', true).maybeSingle(),
      supabase.from('resort_settings').select('extra_person_fee, security_deposit').eq('id', 1).single(),
    ])
    if (roomError) return failure(roomError, 'Could not load the accommodation.')
    if (!room) return { success: false, error: 'Selected accommodation is not available.' }
    if (settingsError || !settings) return failure(settingsError, 'Could not load booking prices. Please try again.')

    const pricing = calculatePricing({
      regularRate: room.regular_rate,
      checkIn: input.checkIn, checkOut: input.checkOut,
      adultGuests: input.adultGuests, childGuests: input.childGuests, roomMaxGuests: room.max_guests,
      extraPersonFee: settings.extra_person_fee, securityDeposit: settings.security_deposit,
      paymentOption: input.paymentOption,
    })
    if (!Number.isSafeInteger(pricing.totalAmount) || pricing.totalAmount > 2_147_483_647) {
      return { success: false, error: 'Please contact the resort to arrange this reservation.' }
    }
    const guestAccessToken = input.guestAccessToken ?? generateGuestAccessToken().token
    const tokenHash = hashGuestAccessToken(guestAccessToken)

    for (let attempt = 0; attempt < 5; attempt++) {
      const referenceNumber = generateReferenceNumber()
      const { error } = await supabase.from('bookings').insert({
        reference_number: referenceNumber, room_id: room.id,
        guest_name: input.guestName, guest_email: input.guestEmail, guest_phone: input.guestPhone,
        adult_guests: input.adultGuests, child_guests: input.childGuests,
        special_requests: input.specialRequests || null,
        check_in: input.checkIn, check_out: input.checkOut,
        rate_per_night: pricing.ratePerNight, extra_person_fee: pricing.extraPersonFee,
        extra_persons: pricing.extraPersons, security_deposit: pricing.securityDeposit,
        subtotal: pricing.subtotal, total_amount: pricing.totalAmount,
        payment_option: input.paymentOption, amount_paid: 0, remaining_balance: pricing.totalAmount,
        status: 'awaiting_payment', client_request_id: input.clientRequestId,
        guest_access_token_hash: tokenHash,
      })
      if (!error) {
        revalidatePath('/admin')
        return { success: true, data: { referenceNumber, guestAccessToken } }
      }
      // The database constraint also covers simultaneous booking requests.
      if (error.code === '23P01') {
        // A concurrent retry may have created this same reservation.
        const retry = await findExisting()
        if (retry.data) return recoverBooking(retry.data)
        return { success: false, error: 'The selected dates are no longer available. Please choose other dates.' }
      }
      if (error.code !== '23505') return failure(error, 'Could not finalize the reservation.')
      const retry = await findExisting()
      if (retry.error) return failure(retry.error, 'Could not check the reservation request.')
      if (retry.data) return recoverBooking(retry.data)
      // A reference collision is retried at insert time rather than with a racy preflight check.
    }
    return { success: false, error: 'Could not allocate a booking reference. Please try again.' }
  } catch (error) {
    return failure(error, 'Could not create the reservation. Please try again.')
  }
}

export async function submitPaymentProofAction(
  formData: FormData
): Promise<ActionResult<{ submissionId: string }>> {
  if (!(formData instanceof FormData)) return { success: false, error: 'Invalid payment submission.' }
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'A valid payment receipt file is required.' }
  }
  if (file.size > 10 * 1024 * 1024) {
    return { success: false, error: 'The receipt must be no larger than 10 MB.' }
  }
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'].includes(file.type)) {
    return { success: false, error: 'Upload a JPEG, PNG, WebP, HEIC, or PDF receipt.' }
  }
  const amount = formData.get('amountClaimed')
  const parsed = paymentProofSchema.safeParse({
    bookingReference: formData.get('bookingReference'), guestAccessToken: formData.get('guestAccessToken'),
    paymentMethod: formData.get('paymentMethod'), amountClaimed: typeof amount === 'string' ? Number(amount) : NaN,
  })
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  const input = parsed.data
  try {
    const supabase = createAdminClient()
    const { data: booking, error } = await supabase.from('bookings')
      .select('id, guest_access_token_hash, status').eq('reference_number', input.bookingReference).maybeSingle()
    if (error) return failure(error, 'Could not verify the reservation.')
    if (!booking || !verifyGuestAccessToken(input.guestAccessToken, booking.guest_access_token_hash)) {
      return { success: false, error: 'Invalid reservation reference or access token.' }
    }
    if (['cancelled', 'rejected', 'completed'].includes(booking.status)) {
      return { success: false, error: 'This reservation can no longer accept payment receipts.' }
    }
    const storagePath = `proofs/${booking.id}/${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(-100)}`
    const bucket = supabase.storage.from('payment-proofs')
    const { error: uploadError } = await bucket.upload(storagePath, file, { contentType: file.type, upsert: false })
    if (uploadError) return failure(uploadError, 'Could not upload the payment receipt.')

    // Record the receipt and update the booking together, rechecking its state under a lock.
    let submissionId: string
    try {
      const { data, error: submissionError } = await supabase.rpc('submit_payment_proof', {
        booking_id: booking.id, token_hash: hashGuestAccessToken(input.guestAccessToken),
        method: input.paymentMethod, amount: input.amountClaimed, storage_path: storagePath,
      })
      if (submissionError || !data) throw submissionError ?? new Error('Missing payment submission')
      submissionId = data
    } catch (submissionError) {
      const { error: cleanupError } = await bucket.remove([storagePath])
      if (cleanupError) console.error('Could not remove unrecorded payment receipt', cleanupError)
      return failure(submissionError, 'Could not record the receipt. Please try again.')
    }
    revalidatePath('/admin', 'layout')
    return { success: true, data: { submissionId } }
  } catch (error) {
    return failure(error, 'Could not submit the payment receipt. Please try again.')
  }
}

export async function submitBuyoutInquiryAction(rawInput: unknown): Promise<ActionResult<{ inquiryId: string }>> {
  const parsed = buyoutInquirySchema.safeParse(rawInput)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  const input = parsed.data
  try {
    const { data, error } = await createAdminClient().from('estate_buyout_inquiries').insert({
      contact_name: input.contactName, contact_email: input.contactEmail, contact_phone: input.contactPhone,
      event_type: input.eventType || null, preferred_dates: input.preferredDates || null,
      guest_count: input.guestCount ?? null, message: input.message || null, status: 'new',
    }).select('id').single()
    if (error || !data) return failure(error, 'Could not submit the inquiry.')
    revalidatePath('/admin/buyouts')
    return { success: true, data: { inquiryId: data.id } }
  } catch (error) {
    return failure(error, 'Could not submit the inquiry. Please try again.')
  }
}
