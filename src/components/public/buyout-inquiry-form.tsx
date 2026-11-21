'use client'

import { useRef, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { submitBuyoutInquiryAction } from '@/app/actions/booking'
import { buyoutInquirySchema } from '@/lib/validations/booking'
import { InputField, TextareaField, issueFields } from './reservation/form-fields'

export default function BuyoutInquiryForm({ contactHref }: { contactHref: string }) {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const [uncertain, setUncertain] = useState(false)
  const [message, setMessage] = useState('')
  const [inquiryId, setInquiryId] = useState('')
  const busy = useRef(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || uncertain) return
    const fields = Object.fromEntries(new FormData(event.currentTarget))
    const parsed = buyoutInquirySchema.safeParse({ ...fields, guestCount: fields.guestCount ? Number(fields.guestCount) : undefined })
    if (!parsed.success) { setErrors(issueFields(parsed.error.issues)); return }
    setErrors({}); setMessage(''); busy.current = true; setPending(true)
    try {
      const result = await submitBuyoutInquiryAction(parsed.data)
      if (result.success) setInquiryId(result.data.inquiryId)
      else setMessage(result.error)
    } catch { setUncertain(true); setMessage('The response was interrupted. Please contact management before submitting another inquiry, so your request is not duplicated.') }
    finally { busy.current = false; setPending(false) }
  }
  if (inquiryId) return <div className="public-availability-note" role="status"><h2>Your Inquiry Is Recorded</h2><p>Thank you. Contact our management team to discuss the possibilities for your group.</p><p className="public-inquiry-reference">Inquiry reference: {inquiryId}</p><p>A submitted inquiry does not confirm an event, estate buyout, or accommodation availability.</p><div className="public-page-actions"><a href={contactHref} className="public-button public-button-teal">Contact Management</a><Link href="/" className="public-text-link">Return to Seabliss</Link></div></div>
  return <form onSubmit={submit} noValidate className="public-reservation-form" aria-label="Private gathering inquiry" aria-busy={pending}><fieldset disabled={pending || uncertain} className="public-receipt-fields">
    <InputField id="contactName" name="contactName" label="Full name" autoComplete="name" required minLength={2} maxLength={100} error={errors.contactName} />
    <div className="public-form-grid"><InputField id="contactEmail" name="contactEmail" label="Email address" type="email" autoComplete="email" required maxLength={254} error={errors.contactEmail} /><InputField id="contactPhone" name="contactPhone" label="Phone number" type="tel" autoComplete="tel" required minLength={7} maxLength={20} error={errors.contactPhone} /></div>
    <InputField id="eventType" name="eventType" label="Type of gathering (optional)" maxLength={100} error={errors.eventType} />
    <div className="public-form-grid"><InputField id="preferredDates" name="preferredDates" label="Preferred dates (optional)" maxLength={500} error={errors.preferredDates} hint="Let us know your dates or how flexible you can be." /><InputField id="guestCount" name="guestCount" label="Estimated guests (optional)" type="number" inputMode="numeric" min={1} max={500} error={errors.guestCount} hint="An inquiry estimate; management confirms suitability and capacity." /></div>
    <TextareaField id="message" name="message" label="Tell us about your plans (optional)" rows={5} maxLength={2000} error={errors.message} />
    <p className="public-policy-note">These details are recorded for management to review and follow up. Packages, pricing, capacity, and arrangements will be discussed directly.</p><button type="submit" className="public-button public-button-teal">{pending ? 'Recording Your Inquiry…' : 'Send Your Inquiry'}</button>
  </fieldset>{message && <p className="public-form-error" role="alert">{message}</p>}{uncertain && <a href={contactHref} className="public-text-link">Contact Management</a>}</form>
}
