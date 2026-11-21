'use client'

import type { FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import type { PublicSettings } from '@/lib/public/content'
import type { ReservationInput } from '@/lib/public/reservation-model'
import { calculateNights } from '@/lib/booking/dates'
import { formatStayTime } from '@/lib/public/content'

export type StayInput = Pick<ReservationInput, 'roomSlug' | 'checkIn' | 'checkOut' | 'adultGuests' | 'childGuests'>

export default function StayStep({ stay, today, errors, settings, onChange, onSubmit }: {
  stay: StayInput
  today: string
  errors: Record<string, string>
  settings: PublicSettings
  onChange: (patch: Partial<StayInput>) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  let nights = 0
  try { nights = calculateNights(stay.checkIn, stay.checkOut) } catch { /* Dates are validated on continue. */ }

  return <form noValidate onSubmit={onSubmit} className="public-cielo-step-form">
    <div className="public-cielo-step-header">
      <span className="public-cielo-step-eyebrow">STEP 1 OF 4</span>
      <h2 className="public-cielo-step-title">When will you be staying?</h2>
      <p className="public-cielo-step-subtitle">Choose your dates and guest count. You will select an accommodation next.</p>
    </div>
    <div className="public-cielo-dates-grid">
      <div className="public-cielo-field-group">
        <label htmlFor="checkIn" className="public-cielo-field-label">Check-in Date *</label>
        <input id="checkIn" type="date" min={today} required value={stay.checkIn}
          aria-invalid={Boolean(errors.checkIn)} aria-describedby={'checkIn-hint' + (errors.checkIn ? ' checkIn-error' : '')}
          onChange={e => onChange({ checkIn: e.target.value })} className={'public-cielo-input' + (errors.checkIn ? ' is-invalid' : '')} />
        <span id="checkIn-hint" className="public-cielo-field-hint">Check-in: {formatStayTime(settings.check_in_time)}</span>
        {errors.checkIn && <p id="checkIn-error" className="public-cielo-error-text" role="alert">{errors.checkIn}</p>}
      </div>
      <div className="public-cielo-field-group">
        <label htmlFor="checkOut" className="public-cielo-field-label">Check-out Date *</label>
        <input id="checkOut" type="date" min={stay.checkIn || today} required value={stay.checkOut}
          aria-invalid={Boolean(errors.checkOut)} aria-describedby={'checkOut-hint' + (errors.checkOut ? ' checkOut-error' : '')}
          onChange={e => onChange({ checkOut: e.target.value })} className={'public-cielo-input' + (errors.checkOut ? ' is-invalid' : '')} />
        <span id="checkOut-hint" className="public-cielo-field-hint">Check-out: {formatStayTime(settings.check_out_time)}{nights > 0 ? ' (' + nights + (nights === 1 ? ' night)' : ' nights)') : ''}</span>
        {errors.checkOut && <p id="checkOut-error" className="public-cielo-error-text" role="alert">{errors.checkOut}</p>}
      </div>
    </div>
    <div className="public-cielo-guests-card">
      {([{ key: 'adultGuests', label: 'Adult Guests', min: 1, max: 30 }, { key: 'childGuests', label: 'Children', min: 0, max: 20 }] as const).map(({ key, label, min, max }) => <div key={key}>
        <div className="public-cielo-counter-row" role="group" aria-label={label}>
          <span className="public-cielo-counter-title">{label}</span>
          <div className="public-cielo-counter-controls">
            <button type="button" aria-label={'Decrease ' + label.toLowerCase()} className="public-cielo-counter-btn" disabled={stay[key] <= min} onClick={() => onChange({ [key]: Math.max(min, stay[key] - 1) })}>−</button>
            <output className="public-cielo-counter-value" aria-live="polite" aria-label={label + ' count'}>{stay[key]}</output>
            <button type="button" aria-label={'Increase ' + label.toLowerCase()} className="public-cielo-counter-btn" disabled={stay[key] >= max} onClick={() => onChange({ [key]: Math.min(max, stay[key] + 1) })}>+</button>
          </div>
        </div>
        {errors[key] && <p className="public-cielo-error-text" role="alert">{errors[key]}</p>}
        {key === 'adultGuests' && <div className="public-cielo-counter-divider" />}
      </div>)}
    </div>
    <p className="public-cielo-form-note">The included guest allowance and any extra-guest charges are shown with your accommodation selection. Children count toward the guest total.</p>
    <div className="public-cielo-actions-row">
      <button type="submit" className="public-button public-button-teal public-cielo-submit-btn"><span>Continue to Room Selection</span><ArrowRight size={16} aria-hidden="true" /></button>
    </div>
  </form>
}
