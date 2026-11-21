'use client'

import type { FormEvent } from 'react'
import { ArrowLeft, ArrowRight, BedDouble, Check, Maximize2, Users, WavesLadder } from 'lucide-react'
import ResortImage from '../resort-image'
import { calculatePricing } from '@/lib/booking/pricing'
import { formatPeso } from '@/lib/format'
import type { PublicRoomDetails, PublicSettings } from '@/lib/public/content'
import type { ReservationInput } from '@/lib/public/reservation-model'
import type { StayInput } from './stay-step'

export default function RoomStep({ stay, rooms, settings, paymentOption, errors, onChange, onBack, onSubmit }: {
  stay: StayInput
  rooms: PublicRoomDetails[]
  settings: PublicSettings
  paymentOption: ReservationInput['paymentOption']
  errors: Record<string, string>
  onChange: (patch: Partial<StayInput>) => void
  onBack: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return <form noValidate onSubmit={onSubmit} className="public-cielo-step-form">
    <div className="public-cielo-step-header">
      <span className="public-cielo-step-eyebrow">STEP 2 OF 4</span>
      <h2 className="public-cielo-step-title">Choose Your Accommodation</h2>
      <p className="public-cielo-step-subtitle">Explore the collection for your preferred stay. Requests are reviewed by management; selecting a room does not guarantee availability.</p>
    </div>
    <fieldset className="public-reservation-room-options" aria-describedby={errors.roomSlug ? 'room-selection-error' : undefined}>
      <legend className="sr-only">Accommodation</legend>
      {errors.roomSlug && <p id="room-selection-error" className="public-cielo-error-text" role="alert">{errors.roomSlug}</p>}
      <div className="public-cielo-room-cards-stack">
        {rooms.map(room => {
          const isSelected = stay.roomSlug === room.slug
          const pricing = calculatePricing({ ...stay, regularRate: room.regular_rate, roomMaxGuests: room.max_guests, extraPersonFee: settings.extra_person_fee, securityDeposit: settings.security_deposit, paymentOption })
          return <label key={room.id} className={'public-cielo-room-card public-reservation-room-option' + (isSelected ? ' is-selected' : '')}>
            <input type="radio" name="roomSlug" value={room.slug} checked={isSelected} onChange={() => onChange({ roomSlug: room.slug })} aria-label={room.name} className="sr-only public-reservation-room-radio" />
            <span className="public-cielo-card-media-col"><span className="public-cielo-card-thumbnail"><ResortImage src={room.gallery[0]} alt={room.name} sizes="(min-width: 768px) 104px, 100vw" /></span></span>
            <span className="public-cielo-card-content-col">
              <span className="public-cielo-card-header-row"><strong className="public-cielo-card-name">{room.name}</strong>
              <span className="public-cielo-card-badges">
                <span className="public-cielo-badge-category">{room.category}</span>
                {room.has_plunge_pool && <span className="public-cielo-badge-pool"><WavesLadder size={12} aria-hidden="true" />Plunge Pool</span>}
                {isSelected && <span className="public-cielo-badge-selected"><Check size={12} aria-hidden="true" />Selected</span>}
              </span>
              </span>
              <span className="public-cielo-card-specs">
                <span className="public-cielo-spec-item"><Users size={14} aria-hidden="true" />{room.max_guests} guests included</span>
                {room.size_sqm && <span className="public-cielo-spec-item"><Maximize2 size={13} aria-hidden="true" />{room.size_sqm} m²</span>}
                {room.bed_type && <span className="public-cielo-spec-item"><BedDouble size={14} aria-hidden="true" />{room.bed_type}</span>}
              </span>
            </span>
            <span className="public-cielo-card-pricing-col">
              <strong className="public-cielo-card-rate-amount">{formatPeso(pricing.baseAmount)}</strong>
              <span className="public-cielo-card-rate-period">for {pricing.nights} {pricing.nights === 1 ? 'night' : 'nights'}</span>
            </span>
          </label>
        })}
      </div>
    </fieldset>
    <p className="public-cielo-form-note">Guests above the included allowance are charged {formatPeso(settings.extra_person_fee)} per guest, per night. Your summary shows the full breakdown for the selected room.</p>
    <div className={'public-cielo-actions-row public-reservation-room-actions' + (stay.roomSlug ? ' has-selection' : '')}>
      <button type="button" onClick={onBack} aria-label="Back to Your Stay" className="public-button-secondary public-cielo-back-btn"><ArrowLeft size={16} aria-hidden="true" /><span className="public-reservation-room-action-full">Back to Your Stay</span><span className="public-reservation-room-action-short">Back</span></button>
      <button type="submit" aria-label="Continue to Guest Details" className="public-button public-button-teal public-cielo-submit-btn"><span className="public-reservation-room-action-full">Continue to Guest Details</span><span className="public-reservation-room-action-short">Continue</span><ArrowRight size={16} aria-hidden="true" /></button>
    </div>
  </form>
}
