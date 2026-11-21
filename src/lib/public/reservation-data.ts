import 'server-only'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyGuestAccessToken } from '@/lib/booking/access-token'
import { calculatePricing } from '@/lib/booking/pricing'
import { readReservationSession } from './reservation-session'
import type { PaymentDetails, ReservationSnapshot } from './reservation-model'

export const getPaymentDetails = cache(async (): Promise<PaymentDetails | null> => {
  const { data, error } = await (await createClient()).from('resort_settings').select('bank_name,bank_account_name,bank_account_number,bank_qr_url,gcash_name,gcash_number,gcash_qr_url').eq('id', 1).maybeSingle()
  if (error) return null
  return data
})

// Never fetch a guest ledger without a matching sealed cookie, then token verification.
export async function getOwnedReservation(flowId: string): Promise<ReservationSnapshot | null> {
  const session = await readReservationSession(flowId)
  if (!session) return null
  const supabase = createAdminClient()
  const { data: booking, error } = await supabase.from('bookings').select('id,room_id,reference_number,guest_access_token_hash,check_in,check_out,adult_guests,child_guests,rate_per_night,extra_person_fee,extra_persons,security_deposit,total_amount,payment_option,status').eq('client_request_id', flowId).maybeSingle()
  if (error) throw new Error('Could not check the booking request. Please try again.')
  if (!booking) return null
  if (!verifyGuestAccessToken(session.token, booking.guest_access_token_hash)) throw new Error('This request cannot be recovered in this browser. Contact management with your reference.')
  const [{ data: room, error: roomError }, { data: submissions, error: paymentError }] = await Promise.all([
    supabase.from('rooms').select('name,slug').eq('id', booking.room_id).maybeSingle(),
    supabase.from('payment_submissions').select('review_status').eq('booking_id', booking.id).order('submitted_at', { ascending: false }),
  ])
  if (roomError || paymentError || !room) throw new Error('Could not check the saved request. Please retry.')
  // Reuse the pricing engine with the saved extra-person snapshot, never today's room price.
  const pricing = calculatePricing({
    regularRate: booking.rate_per_night, checkIn: booking.check_in, checkOut: booking.check_out,
    adultGuests: booking.adult_guests, childGuests: booking.child_guests,
    roomMaxGuests: booking.adult_guests + booking.child_guests - booking.extra_persons,
    extraPersonFee: booking.extra_person_fee, securityDeposit: booking.security_deposit, paymentOption: booking.payment_option,
  })
  if (pricing.totalAmount !== booking.total_amount) throw new Error('Please contact management to review this request’s charges.')
  const received = submissions?.find(item => item.review_status === 'pending' || item.review_status === 'approved')
  return {
    referenceNumber: booking.reference_number, roomName: room.name, roomSlug: room.slug,
    checkIn: booking.check_in, checkOut: booking.check_out, adultGuests: booking.adult_guests, childGuests: booking.child_guests,
    paymentOption: booking.payment_option, pricing, submitted: Boolean(received),
    paymentReviewStatus: received?.review_status === 'approved' ? 'approved' : received ? 'pending' : null,
    canSubmit: !received && !['cancelled', 'rejected', 'completed'].includes(booking.status),
    rejectedProof: !received && Boolean(submissions?.some(item => item.review_status === 'rejected')),
  }
}
