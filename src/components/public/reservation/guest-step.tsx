'use client'

import { type FormEvent } from 'react'
import { ArrowLeft, ArrowRight, User, Phone, Mail, FileText } from 'lucide-react'
import type { ReservationInput } from '@/lib/public/reservation-model'

export type GuestInput = Pick<
  ReservationInput,
  'guestName' | 'guestEmail' | 'guestPhone' | 'specialRequests'
>

export default function GuestStep({
  guest,
  errors,
  onChange,
  onBack,
  onSubmit,
  pending,
}: {
  guest: GuestInput
  pending: boolean
  errors: Record<string, string>
  onChange: (patch: Partial<GuestInput>) => void
  onBack: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <form noValidate onSubmit={onSubmit} className="public-cielo-step-form">
      {/* Step Header */}
      <div className="public-cielo-step-header">
        <span className="public-cielo-step-eyebrow">STEP 3 OF 4</span>
        <h2 className="public-cielo-step-title">Guest Information</h2>
        <p className="public-cielo-step-subtitle">
          Tell us who management should contact about this booking request.
        </p>
      </div>

      <fieldset disabled={pending} className="public-reservation-guest-fields">
        <legend className="sr-only">Guest contact details</legend>
        <div className="public-cielo-form-fields space-y-4">
          {/* Full Name */}
          <div className="public-cielo-field-group">
            <label htmlFor="guestName" className="public-cielo-field-label">
              <span className="public-cielo-label-inline">
                <User size={15} aria-hidden="true" />
                <span>Full Name *</span>
              </span>
            </label>
            <input
              id="guestName"
              type="text"
              required
              autoComplete="name"
              minLength={2}
              maxLength={100}
              placeholder="e.g. Maria Santos"
              value={guest.guestName}
              onChange={(e) => onChange({ guestName: e.target.value })}
              className={'public-cielo-input' + (errors.guestName ? ' is-invalid' : '')}
            />
            {errors.guestName && <p className="public-cielo-error-text">{errors.guestName}</p>}
          </div>

          {/* Phone & Email Grid (Responsive 1-col on mobile, 2-col on desktop) */}
          <div className="public-cielo-form-row">
            <div className="public-cielo-field-group">
              <label htmlFor="guestPhone" className="public-cielo-field-label">
                <span className="public-cielo-label-inline">
                  <Phone size={15} aria-hidden="true" />
                  <span>Mobile / Viber Phone *</span>
                </span>
              </label>
              <input
                id="guestPhone"
                type="tel"
                required
                autoComplete="tel"
                minLength={7}
                maxLength={20}
                placeholder="e.g. 0917 123 4567"
                value={guest.guestPhone}
                onChange={(e) => onChange({ guestPhone: e.target.value })}
                className={'public-cielo-input' + (errors.guestPhone ? ' is-invalid' : '')}
              />
              {errors.guestPhone && <p className="public-cielo-error-text">{errors.guestPhone}</p>}
            </div>

            <div className="public-cielo-field-group">
              <label htmlFor="guestEmail" className="public-cielo-field-label">
                <span className="public-cielo-label-inline">
                  <Mail size={15} aria-hidden="true" />
                  <span>Email Address *</span>
                </span>
              </label>
              <input
                id="guestEmail"
                type="email"
                required
                autoComplete="email"
                maxLength={254}
                placeholder="e.g. maria@example.com"
                value={guest.guestEmail}
                onChange={(e) => onChange({ guestEmail: e.target.value })}
                className={'public-cielo-input' + (errors.guestEmail ? ' is-invalid' : '')}
              />
              {errors.guestEmail && <p className="public-cielo-error-text">{errors.guestEmail}</p>}
            </div>
          </div>

          {/* Special Requests */}
          <div className="public-cielo-field-group">
            <label htmlFor="specialRequests" className="public-cielo-field-label">
              <span className="public-cielo-label-inline">
                <FileText size={15} aria-hidden="true" />
                <span>Special Requests / Notes (Optional)</span>
              </span>
            </label>
            <textarea
              id="specialRequests"
              rows={3}
              maxLength={1000}
              placeholder="e.g. Estimated arrival time, dietary considerations, celebrating special occasion..."
              value={guest.specialRequests || ''}
              onChange={(e) => onChange({ specialRequests: e.target.value })}
              className={'public-cielo-textarea' + (errors.specialRequests ? ' is-invalid' : '')}
            />
            <span className="public-cielo-field-hint">
              Please avoid submitting sensitive financial information in notes.
            </span>
            {errors.specialRequests && (
              <p className="public-cielo-error-text">{errors.specialRequests}</p>
            )}
          </div>
        </div>
      </fieldset>

      <p className="public-cielo-form-note">
        Guest details stay in this form while you move between steps. Once you submit, our team will review and contact you.
      </p>

      {/* Navigation Buttons (Responsive: full text on desktop, short text on mobile) */}
      <div className="public-cielo-actions-row">
        <button
          type="button"
          onClick={onBack}
          disabled={pending}
          className="public-button-secondary public-cielo-back-btn"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          <span className="public-reservation-guest-action-full">Back to Room Selection</span>
          <span className="public-reservation-guest-action-short">Back</span>
        </button>

        <button
          type="submit"
          disabled={pending}
          className="public-button public-button-teal public-cielo-submit-btn"
        >
          <span className="public-reservation-guest-action-full">
            {pending ? 'Preparing Payment Details…' : 'Continue to Payment'}
          </span>
          <span className="public-reservation-guest-action-short">
            {pending ? 'Preparing…' : 'Continue'}
          </span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}
