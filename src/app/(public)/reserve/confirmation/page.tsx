import Link from 'next/link'
import { CheckCircle2, ShieldCheck, Phone, Home, RefreshCw } from 'lucide-react'
import { PricingBreakdown } from '@/components/public/reservation/booking-summary'
import { getOwnedReservation } from '@/lib/public/reservation-data'
import { getPublicResortData } from '@/lib/public/data'
import { getContactLinks } from '@/lib/public/content'
import { submissionMessage, requestDisclaimer } from '@/lib/public/reservation-model'
import { formatDate } from '@/lib/format'

export const metadata = {
  title: 'Your Submission | Seabliss Beach Resort',
  robots: { index: false, follow: false },
  alternates: { canonical: '/reserve/confirmation' },
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const flowId = typeof params.request === 'string' ? params.request : ''
  const { settings } = await getPublicResortData()
  const links = getContactLinks(settings)

  let booking
  try {
    booking = await getOwnedReservation(flowId)
  } catch {
    booking = null
  }

  if (!booking || !booking.submitted) {
    return (
      <main id="public-content" tabIndex={-1} className="public-confirmation-page">
        <div className="public-container">
          <div className="public-confirmation-receipt-card public-confirmation-empty text-center">
            <span className="public-eyebrow">YOUR REQUEST</span>
            <h1>
              {booking ? 'Payment Proof Is Still Needed' : 'Your Submission Details Are Private'}
            </h1>
            <p className="public-confirmation-message">
              {booking
                ? 'Your booking request is recorded, but no pending or approved payment proof is available. Continue in the original browser to submit or check your receipt.'
                : 'Open this page in the browser used for your request. Its private access expires after 24 hours. Contact management with your booking reference if you need help.'}
            </p>
            <div className="public-confirmation-actions">
              {booking && (
                <Link
                  href={'/reserve?request=' + encodeURIComponent(flowId)}
                  className="public-button public-button-teal"
                >
                  <RefreshCw size={15} aria-hidden="true" />
                  <span>Resume Payment</span>
                </Link>
              )}
              <a href={links.management} className="public-button public-button-outline">
                Contact Management
              </a>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const isApproved = booking.paymentReviewStatus === 'approved'

  return (
    <main id="public-content" tabIndex={-1} className="public-confirmation-page">
      <div className="public-container">
        <div className="public-confirmation-receipt-card">
          {/* Centered acknowledgement with checkmark */}
          <div className="public-confirmation-head text-center">
            <div className="public-confirmation-icon-wrap" aria-hidden="true">
              <CheckCircle2 size={36} />
            </div>
            <span className="public-eyebrow">RESERVATION &amp; PAYMENT RECEIVED</span>
            <h1 className="public-confirmation-title">Booking Request Submitted!</h1>
            <p className="public-confirmation-message">{submissionMessage}</p>
          </div>

          {/* Reference Card with selectable code */}
          <div className="public-confirmation-ref-box text-center">
            <span className="public-ref-label">YOUR BOOKING REFERENCE</span>
            <div className="public-ref-code" tabIndex={0} aria-label={`Booking reference ${booking.referenceNumber}`}>
              {booking.referenceNumber}
            </div>
            <p className="public-ref-hint">
              Please save this reference code for your records and check-in verification.
            </p>
          </div>

          {/* Payment Status Banner */}
          <div className="public-confirmation-status-banner">
            <div className="public-status-icon" aria-hidden="true">
              <ShieldCheck size={22} />
            </div>
            <div className="public-status-text">
              <h2>
                {isApproved
                  ? 'Payment Status: Verified by Management'
                  : 'Payment Status: Submitted — Awaiting Management Review'}
              </h2>
              <p>
                {isApproved
                  ? 'Your payment proof has been reviewed and verified by management.'
                  : 'Our management team will review your uploaded receipt against resort records shortly.'}
              </p>
            </div>
          </div>

          {/* Stay and Guest Summary */}
          <div className="public-confirmation-details-box">
            <h3 className="public-details-box-title">Stay Information</h3>
            <dl className="public-review-details">
              <div>
                <dt>Accommodation</dt>
                <dd><strong>{booking.roomName}</strong></dd>
              </div>
              <div>
                <dt>Stay Dates</dt>
                <dd>
                  {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
                </dd>
              </div>
              <div>
                <dt>Guests</dt>
                <dd>
                  {booking.adultGuests} adults · {booking.childGuests} children
                </dd>
              </div>
              <div>
                <dt>Payment Proof</dt>
                <dd>
                  {isApproved
                    ? 'Payment verified by management'
                    : 'Submitted — awaiting management review'}
                </dd>
              </div>
            </dl>

            <div className="public-confirmation-pricing-wrap">
              <PricingBreakdown pricing={booking.pricing} />
            </div>

            <p className="public-policy-note">
              {requestDisclaimer} Payment verification does not allocate accommodation automatically.
            </p>
          </div>

          {/* Follow-up Sequence: What Happens Next */}
          <div className="public-confirmation-steps-box">
            <h3 className="public-steps-box-title">What Happens Next</h3>
            <div className="public-next-steps-list">
              <div className="public-next-step-item">
                <div className="public-step-badge" aria-hidden="true">1</div>
                <div>
                  <h4>Management Verification</h4>
                  <p>Our team verifies your submitted payment proof against bank or GCash records.</p>
                </div>
              </div>

              <div className="public-next-step-item">
                <div className="public-step-badge" aria-hidden="true">2</div>
                <div>
                  <h4>Stay Coordination</h4>
                  <p>Management will contact you directly to finalize accommodation arrangements and confirm your stay details.</p>
                </div>
              </div>

              <div className="public-next-step-item">
                <div className="public-step-badge" aria-hidden="true">3</div>
                <div>
                  <h4>Arrival in Lian, Batangas</h4>
                  <p>Bring your booking reference and valid identification upon arrival for seamless check-in.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="public-confirmation-actions-row">
            <Link href="/" className="public-button public-button-teal">
              <Home size={16} aria-hidden="true" />
              <span>Return to Homepage</span>
            </Link>
            <a href={links.management} className="public-button public-button-outline">
              <Phone size={16} aria-hidden="true" />
              <span>Contact Concierge</span>
            </a>
          </div>

          <div className="public-confirmation-sub-action text-center">
            <Link href="/reserve?new=1" className="public-text-link">
              Start Another Request
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
