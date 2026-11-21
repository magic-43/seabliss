import Image from 'next/image'
import { MapPin, RotateCcw, ShieldCheck, Check } from 'lucide-react'
import type { PricingResult } from '@/lib/booking/pricing'
import { formatDate, formatPeso } from '@/lib/format'

export function PricingBreakdown({ pricing }: { pricing: PricingResult }) {
  return (
    <div className="public-cielo-summary-pricing-list">
      <div className="public-cielo-summary-line">
        <span className="public-cielo-summary-item-label">
          Accommodation ({pricing.nights} {pricing.nights === 1 ? 'night' : 'nights'} × {formatPeso(pricing.ratePerNight)})
        </span>
        <span className="public-cielo-summary-item-val font-semibold">
          {formatPeso(pricing.baseAmount)}
        </span>
      </div>

      {pricing.extraPersonTotal > 0 && (
        <div className="public-cielo-summary-line">
          <span className="public-cielo-summary-item-label">
            Extra Guests ({pricing.extraPersons} pax × {pricing.nights}n)
          </span>
          <span className="public-cielo-summary-item-val text-primary font-semibold">
            +{formatPeso(pricing.extraPersonTotal)}
          </span>
        </div>
      )}

      {pricing.securityDeposit > 0 && (
        <div className="public-cielo-summary-line">
          <span className="public-cielo-summary-item-label">
            Security Deposit (Refundable)
          </span>
          <span className="public-cielo-summary-item-val">
            {formatPeso(pricing.securityDeposit)}
          </span>
        </div>
      )}

      <div className="public-cielo-summary-line text-emerald-800">
        <span className="public-cielo-summary-item-label flex items-center gap-1">
          <Check size={13} className="inline text-emerald-700" />
          <span>Beach &amp; Pool Access</span>
        </span>
        <span className="public-cielo-summary-item-val font-bold uppercase text-xs text-emerald-700">
          Included
        </span>
      </div>

      <div className="public-cielo-summary-divider" />

      <div className="public-cielo-summary-total-block">
        <div className="flex justify-between items-baseline">
          <span className="public-cielo-total-label">Total Stay Amount</span>
          <span className="public-cielo-total-amount font-serif">
            {formatPeso(pricing.totalAmount)}
          </span>
        </div>

        {pricing.amountDue < pricing.totalAmount ? (
          <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-dashed border-outline/15">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Amount Due Today (50%)
            </span>
            <span className="font-serif text-xl font-bold text-primary">
              {formatPeso(pricing.amountDue)}
            </span>
          </div>
        ) : null}

        {pricing.remainingBalance > 0 ? (
          <div className="flex justify-between items-baseline text-xs text-on-surface-variant mt-1">
            <span>Balance due at check-in</span>
            <span className="font-medium">{formatPeso(pricing.remainingBalance)}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function BookingSummary({
  name,
  checkIn,
  checkOut,
  adults,
  childrenCount,
  pricing,
  image,
  checkInTime = '2:00 PM',
  checkOutTime = '12:00 PM',
  onResetDraft,
}: {
  name?: string
  checkIn: string
  checkOut: string
  adults: number
  childrenCount: number
  pricing: PricingResult | null
  image?: string
  checkInTime?: string
  checkOutTime?: string
  onResetDraft?: () => void
}) {
  return (
    <aside className="public-cielo-sticky-summary">
      {/* Decorative Room Header (Cielo style preview with location badge) */}
      <div className="public-cielo-summary-media-hero">
        <Image
          src={image || '/images/beach_aerial/seabliss_shoreline.jpg'}
          alt={name || 'Seabliss Beach Resort'}
          fill
          sizes="(min-width: 1024px) 380px, 100vw"
          className="object-cover"
        />
        <div className="public-cielo-summary-hero-overlay" />
        <div className="public-cielo-summary-hero-content">
          <span className="public-cielo-summary-hero-title font-serif">
            {name || 'Select an Accommodation'}
          </span>
          <span className="public-cielo-summary-hero-location">
            <MapPin size={12} aria-hidden="true" />
            <span>Lian, Batangas · Direct Beachfront</span>
          </span>
        </div>
      </div>

      {/* Summary Card Details */}
      <div className="public-cielo-summary-card">
        <div className="public-cielo-summary-head">
          <h3 className="public-cielo-summary-title">Reservation Summary</h3>
          <span className="public-cielo-summary-guests-badge">
            {adults} {adults === 1 ? 'Adult' : 'Adults'}
            {childrenCount > 0 ? ` · ${childrenCount} ${childrenCount === 1 ? 'Child' : 'Children'}` : ''}
          </span>
        </div>

        {pricing ? (
          <PricingBreakdown pricing={pricing} />
        ) : (
          <div className="public-cielo-summary-placeholder">
            <p>Select your dates and accommodation to calculate your stay total.</p>
          </div>
        )}

        {/* Schedule Badge (Cielo style check-in/out box) */}
        <div className="public-cielo-schedule-box">
          <div className="public-cielo-schedule-row">
            <span className="public-cielo-schedule-label">Check-in:</span>
            <strong className="public-cielo-schedule-val">
              {checkIn ? `${formatDate(checkIn)} (${checkInTime})` : 'Not selected'}
            </strong>
          </div>
          <div className="public-cielo-schedule-row">
            <span className="public-cielo-schedule-label">Check-out:</span>
            <strong className="public-cielo-schedule-val">
              {checkOut ? `${formatDate(checkOut)} (${checkOutTime})` : 'Not selected'}
            </strong>
          </div>
        </div>

        {/* Start Over Action (Cielo style) */}
        {onResetDraft && (
          <div className="public-cielo-summary-reset-wrap">
            <button
              type="button"
              onClick={onResetDraft}
              className="public-cielo-summary-reset-btn"
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>Clear draft &amp; start over</span>
            </button>
          </div>
        )}

        <div className="public-cielo-summary-trust-notice">
          <ShieldCheck size={14} className="inline mr-1 text-primary shrink-0" aria-hidden="true" />
          <span>
            Direct booking with verified inclusions, zero booking fees, and safe cashless payments.
          </span>
        </div>
      </div>
    </aside>
  )
}
