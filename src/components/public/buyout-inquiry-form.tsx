'use client'

import { useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { User, Mail, Phone, PartyPopper, Calendar, Users, MessageSquare, Send, AlertCircle, CheckCircle2 } from 'lucide-react'
import { submitBuyoutInquiryAction } from '@/app/actions/booking'
import { buyoutInquirySchema } from '@/lib/validations/booking'
import { issueFields } from './reservation/form-fields'

export default function BuyoutInquiryForm({ contactHref }: { contactHref: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const [uncertain, setUncertain] = useState(false)
  const [message, setMessage] = useState('')
  const [inquiryId, setInquiryId] = useState('')
  const [eventType, setEventType] = useState('')
  const [customEventType, setCustomEventType] = useState('')
  const busy = useRef(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || uncertain) return
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    const finalEventType = eventType === 'Other' ? (customEventType.trim() || 'Other') : eventType
    const parsed = buyoutInquirySchema.safeParse({
      ...fields,
      eventType: finalEventType || undefined,
      guestCount: fields.guestCount ? Number(fields.guestCount) : undefined,
    })
    if (!parsed.success) {
      setErrors(issueFields(parsed.error.issues))
      return
    }
    setErrors({})
    setMessage('')
    busy.current = true
    setPending(true)
    try {
      const result = await submitBuyoutInquiryAction(parsed.data)
      if (result.success) setInquiryId(result.data.inquiryId)
      else setMessage(result.error)
    } catch {
      setUncertain(true)
      setMessage(
        'The response was interrupted. Please contact management before submitting another inquiry, so your request is not duplicated.'
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  if (inquiryId) {
    return (
      <div className="public-cielo-step-card text-center p-8 max-w-2xl mx-auto" role="status">
        <div className="public-confirmation-icon-wrap mx-auto mb-4" aria-hidden="true">
          <CheckCircle2 size={36} className="text-emerald-700" />
        </div>
        <h2 className="font-serif text-2xl text-seabliss-teal mb-2">Your Inquiry Has Been Recorded</h2>
        <p className="text-sm text-seabliss-charcoal/80 mb-4">
          Thank you for reaching out. Our management team will review your requirements and reach out to discuss possibilities for your group.
        </p>
        <div className="public-confirmation-ref-box my-6 p-4 rounded-xl border border-outline/20 bg-surface-container/30">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">
            Inquiry Reference
          </span>
          <span className="font-mono text-lg font-bold text-primary">{inquiryId}</span>
        </div>
        <p className="text-xs text-muted-foreground mb-6">
          A submitted inquiry does not confirm an event, estate buyout, or accommodation availability until finalized with management.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <a href={contactHref} className="public-button public-button-teal">
            Contact Management
          </a>
          <Link href="/" className="public-button-secondary">
            Return to Seabliss
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="public-inquiry-form-wrapper">
      <form onSubmit={submit} noValidate className="public-cielo-step-form" aria-label="Private gathering inquiry" aria-busy={pending}>
        <fieldset disabled={pending || uncertain} className="public-cielo-form-fields space-y-6">
          <legend className="sr-only">Contact and gathering information</legend>

          {/* Full Name */}
          <div className="public-cielo-field-group">
            <label htmlFor="contactName" className="public-cielo-field-label">
              <span className="public-cielo-label-inline">
                <User size={15} aria-hidden="true" />
                <span>Full Name *</span>
              </span>
            </label>
            <input
              id="contactName"
              name="contactName"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              placeholder="e.g. Sofia Dimayuga"
              className={'public-cielo-input' + (errors.contactName ? ' is-invalid' : '')}
            />
            {errors.contactName && <p className="public-cielo-error-text">{errors.contactName}</p>}
          </div>

          {/* Email & Phone Grid */}
          <div className="public-cielo-form-row">
            <div className="public-cielo-field-group">
              <label htmlFor="contactEmail" className="public-cielo-field-label">
                <span className="public-cielo-label-inline">
                  <Mail size={15} aria-hidden="true" />
                  <span>Email Address *</span>
                </span>
              </label>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="e.g. sofia@example.com"
                className={'public-cielo-input' + (errors.contactEmail ? ' is-invalid' : '')}
              />
              {errors.contactEmail && <p className="public-cielo-error-text">{errors.contactEmail}</p>}
            </div>

            <div className="public-cielo-field-group">
              <label htmlFor="contactPhone" className="public-cielo-field-label">
                <span className="public-cielo-label-inline">
                  <Phone size={15} aria-hidden="true" />
                  <span>Phone / Viber Number *</span>
                </span>
              </label>
              <input
                id="contactPhone"
                name="contactPhone"
                type="tel"
                autoComplete="tel"
                required
                minLength={7}
                maxLength={20}
                placeholder="e.g. 0917 123 4567"
                className={'public-cielo-input' + (errors.contactPhone ? ' is-invalid' : '')}
              />
              {errors.contactPhone && <p className="public-cielo-error-text">{errors.contactPhone}</p>}
            </div>
          </div>

          {/* Type of Gathering Dropdown */}
          <div className="public-cielo-field-group">
            <label htmlFor="eventTypeSelect" className="public-cielo-field-label">
              <span className="public-cielo-label-inline">
                <PartyPopper size={15} aria-hidden="true" />
                <span>Type of Gathering (Optional)</span>
              </span>
            </label>
            <select
              id="eventTypeSelect"
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className={'public-cielo-input bg-white cursor-pointer' + (errors.eventType ? ' is-invalid' : '')}
            >
              <option value="">Select gathering type...</option>
              <option value="Family Reunion & Gathering">Family Reunion & Gathering</option>
              <option value="Birthday Celebration">Birthday Celebration</option>
              <option value="Anniversary & Milestone">Anniversary & Milestone</option>
              <option value="Intimate Wedding / Ceremony">Intimate Wedding / Ceremony</option>
              <option value="Corporate Retreat / Team Offsite">Corporate Retreat / Team Offsite</option>
              <option value="Exclusive Estate Buyout">Exclusive Estate Buyout</option>
              <option value="Other">Other (Please specify)</option>
            </select>
            {eventType === 'Other' && (
              <div className="mt-2.5">
                <input
                  id="customEventType"
                  type="text"
                  maxLength={100}
                  placeholder="Please specify your type of gathering..."
                  value={customEventType}
                  onChange={(e) => setCustomEventType(e.target.value)}
                  className="public-cielo-input"
                  autoFocus
                />
              </div>
            )}
            {errors.eventType && <p className="public-cielo-error-text">{errors.eventType}</p>}
          </div>

          {/* Preferred Dates & Guest Count Grid */}
          <div className="public-cielo-form-row">
            <div className="public-cielo-field-group">
              <label htmlFor="preferredDates" className="public-cielo-field-label">
                <span className="public-cielo-label-inline">
                  <Calendar size={15} aria-hidden="true" />
                  <span>Target Dates / Flexibility (Optional)</span>
                </span>
              </label>
              <input
                id="preferredDates"
                name="preferredDates"
                type="text"
                maxLength={500}
                placeholder="e.g. Mid-November weekend, or Dec 15–18"
                className={'public-cielo-input' + (errors.preferredDates ? ' is-invalid' : '')}
              />
              <span className="public-cielo-field-hint">Let us know target dates or flexibility.</span>
              {errors.preferredDates && <p className="public-cielo-error-text">{errors.preferredDates}</p>}
            </div>

            <div className="public-cielo-field-group">
              <label htmlFor="guestCount" className="public-cielo-field-label">
                <span className="public-cielo-label-inline">
                  <Users size={15} aria-hidden="true" />
                  <span>Estimated Total Guests (Optional)</span>
                </span>
              </label>
              <input
                id="guestCount"
                name="guestCount"
                type="number"
                inputMode="numeric"
                min={1}
                max={500}
                placeholder="e.g. 25"
                className={'public-cielo-input' + (errors.guestCount ? ' is-invalid' : '')}
              />
              <span className="public-cielo-field-hint">Management will confirm suitability &amp; capacity.</span>
              {errors.guestCount && <p className="public-cielo-error-text">{errors.guestCount}</p>}
            </div>
          </div>

          {/* Details & Message */}
          <div className="public-cielo-field-group">
            <label htmlFor="message" className="public-cielo-field-label">
              <span className="public-cielo-label-inline">
                <MessageSquare size={15} aria-hidden="true" />
                <span>Tell Us About Your Plans &amp; Special Requests (Optional)</span>
              </span>
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              maxLength={2000}
              placeholder="Tell us what you have in mind: catering needs, specific villas, event schedule, or audio setup..."
              className={'public-cielo-textarea' + (errors.message ? ' is-invalid' : '')}
            />
            {errors.message && <p className="public-cielo-error-text">{errors.message}</p>}
          </div>

          <p className="public-cielo-form-note">
            These details are submitted to management for review. Packages, pricing, villa combinations, and arrangements will be discussed directly.
          </p>

          <div className="pt-2">
            <button
              type="submit"
              disabled={pending || uncertain}
              className="public-button public-button-teal public-cielo-submit-btn w-full sm:w-auto"
            >
              <span>{pending ? 'Recording Your Inquiry…' : 'Send Your Inquiry'}</span>
              <Send size={16} aria-hidden="true" />
            </button>
          </div>
        </fieldset>

        {message && (
          <div className="public-cielo-alert-error mt-4" role="alert">
            <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
            <span>{message}</span>
          </div>
        )}
        {uncertain && (
          <div className="mt-3 text-center">
            <a href={contactHref} className="public-text-link">
              Contact Management
            </a>
          </div>
        )}
      </form>
    </div>
  )
}
