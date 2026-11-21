'use client'

import Image from 'next/image'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  Smartphone,
  Building2,
  Upload,
  CheckCircle2,
  X,
  RotateCcw,
  QrCode,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { resumeReservationAction, submitReservationPaymentAction } from '@/app/actions/reservation'
import {
  configuredPaymentMethods,
  receiptValidation,
  requestDisclaimer,
  safeQRSource,
  type PaymentDetails,
  type ReservationSnapshot,
} from '@/lib/public/reservation-model'
import { formatPeso } from '@/lib/format'
import { PricingBreakdown } from './booking-summary'

export default function PaymentStep({
  flowId,
  booking,
  payment,
  contactHref,
  requirePriceReview = false,
  onRecovered,
  onSubmitted,
  onStartNew,
}: {
  flowId: string
  booking: ReservationSnapshot
  payment: PaymentDetails
  contactHref: string
  requirePriceReview?: boolean
  onRecovered: (booking: ReservationSnapshot) => void
  onSubmitted: () => void
  onStartNew?: () => void
}) {
  const methods = configuredPaymentMethods(payment)
  const [method, setMethod] = useState<'gcash' | 'bank_transfer'>(
    methods.includes('gcash') ? 'gcash' : (methods[0] as 'gcash' | 'bank_transfer') || 'bank_transfer'
  )
  const [amount, setAmount] = useState(booking.pricing.amountDue)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [chargesAccepted, setChargesAccepted] = useState(!requirePriceReview)
  const [pending, setPending] = useState(false)
  const [needsStatusCheck, setNeedsStatusCheck] = useState(false)
  const [message, setMessage] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const busy = useRef(false)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  async function checkStatus() {
    if (busy.current) return
    busy.current = true
    setPending(true)
    try {
      const result = await resumeReservationAction(flowId)
      if (!result.success || !result.data) {
        setMessage(result.success ? 'Could not access this request. Contact management.' : result.error)
        return
      }
      if (result.data.submitted) {
        onSubmitted()
        return
      }
      onRecovered(result.data)
      setNeedsStatusCheck(false)
      setMessage('No pending or approved payment proof is recorded for this request. You may upload a receipt below.')
    } catch {
      setMessage('Could not check submission status. Please check again before retrying an upload.')
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy.current || needsStatusCheck) return
    const invalidFile = receiptValidation(file)
    if (invalidFile) {
      setMessage(invalidFile)
      return
    }
    if (!Number.isInteger(amount) || amount <= 0 || amount > booking.pricing.totalAmount) {
      setMessage('Enter the actual amount paid as a whole-peso amount, no greater than this request’s total.')
      return
    }
    busy.current = true
    setPending(true)
    setMessage('')
    try {
      const current = await resumeReservationAction(flowId)
      if (!current.success || !current.data) {
        setNeedsStatusCheck(true)
        setMessage(current.success ? 'Could not access the saved request. Contact management.' : current.error)
        return
      }
      if (current.data.submitted) {
        onSubmitted()
        return
      }
      if (current.data.pricing.totalAmount !== booking.pricing.totalAmount) {
        onRecovered(current.data)
        setMessage('The saved charges changed. Review the updated total before submitting.')
        return
      }
      const form = new FormData()
      form.set('file', file!)
      form.set('paymentMethod', method)
      form.set('amountClaimed', String(amount))
      form.set('acknowledgedTotal', String(booking.pricing.totalAmount))
      const result = await submitReservationPaymentAction(flowId, form)
      if (result.success) {
        onSubmitted()
      } else {
        setMessage(result.error)
        setNeedsStatusCheck(true)
      }
    } catch {
      setMessage('The response was interrupted. Check submission status before uploading again.')
      setNeedsStatusCheck(true)
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  const handleFileSelect = (selectedFile: File | null) => {
    const invalid = receiptValidation(selectedFile)
    if (invalid) {
      setMessage(invalid)
      setFile(null)
      setPreview(null)
      if (inputRef.current) inputRef.current.value = ''
      return
    }
    setFile(selectedFile)
    setMessage('')
    if (selectedFile && ['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      setPreview(URL.createObjectURL(selectedFile))
    } else {
      setPreview(null)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (preview) {
      URL.revokeObjectURL(preview)
      setPreview(null)
    }
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  if (booking.submitted) {
    return (
      <div className="public-cielo-step-form">
        <div className="public-cielo-status-card text-center">
          <div className="public-cielo-status-icon-wrap">
            <CheckCircle2 size={36} className="text-teal" aria-hidden="true" />
          </div>
          <span className="public-cielo-step-eyebrow">SUBMISSION RECORDED</span>
          <h3 className="public-cielo-step-title">Payment Proof Already Received</h3>
          <p className="public-cielo-step-subtitle">
            Payment proof for booking reference <strong>{booking.referenceNumber}</strong> has already been received. Please do not submit another duplicate payment.
          </p>
          <div className="public-cielo-actions-row justify-center mt-6">
            <button
              type="button"
              className="public-button public-button-teal"
              onClick={onSubmitted}
            >
              View Your Submission
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!booking.canSubmit) {
    return (
      <div className="public-cielo-step-form">
        <div className="public-cielo-status-card text-center">
          <span className="public-cielo-step-eyebrow">REQUEST CLOSED</span>
          <h3 className="public-cielo-step-title">Please Speak With Management</h3>
          <p className="public-cielo-step-subtitle">
            This booking request ({booking.referenceNumber}) is no longer accepting online payment submissions. Please contact management directly.
          </p>
          <div className="public-cielo-actions-row justify-center mt-6">
            <a href={contactHref} className="public-button public-button-teal">
              Contact Management
            </a>
          </div>
        </div>
      </div>
    )
  }

  if (!chargesAccepted) {
    return <div className="public-cielo-step-form">
      <div className="public-cielo-step-header">
        <span className="public-cielo-step-eyebrow">STEP 4 OF 4</span>
        <h2 className="public-cielo-step-title">Payment &amp; Proof of Transfer</h2>
        <p className="public-cielo-step-subtitle">Check the saved charges for request {booking.referenceNumber} before making a transfer. These are the recorded amounts for {booking.roomName}.</p>
      </div>
      <PricingBreakdown pricing={booking.pricing} />
      <p className="public-cielo-form-note">{requestDisclaimer}</p>
      <button type="button" className="public-button public-button-teal" onClick={() => setChargesAccepted(true)}>I Have Reviewed the Saved Charges</button>
    </div>
  }

  const qr = safeQRSource(method === 'gcash' ? payment.gcash_qr_url : payment.bank_qr_url)

  return (
    <div className="public-cielo-step-form">
      {/* Step Header */}
      <div className="public-cielo-step-header">
        <span className="public-cielo-step-eyebrow">STEP 4 OF 4</span>
        <h2 className="public-cielo-step-title">Payment &amp; Proof of Transfer</h2>
        <p className="public-cielo-step-subtitle">
          Transfer the requested amount via GCash or Bank Transfer, then upload your transaction receipt.
        </p>
      </div>

      {message && (
        <div className="public-cielo-alert-error" role="alert">
          <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </div>
      )}

      {/* Booking Reference Highlight Banner */}
      <div className="public-cielo-ref-banner">
        <div className="public-cielo-ref-meta">
          <span className="public-cielo-ref-eyebrow">BOOKING REFERENCE NUMBER</span>
          <strong className="public-cielo-ref-value">{booking.referenceNumber}</strong>
          <span className="public-cielo-ref-sub">
            {booking.roomName} · {booking.checkIn} — {booking.checkOut}
          </span>
        </div>
        <div className="public-cielo-ref-due">
          <span className="public-cielo-due-label">
            {booking.paymentOption === 'half' ? '50% Initial Deposit Due' : 'Full Stay Amount Due'}
          </span>
          <span className="public-cielo-due-amount">{formatPeso(booking.pricing.amountDue)}</span>
        </div>
      </div>

      {booking.rejectedProof && (
        <div className="public-cielo-alert-warning">
          <AlertCircle size={18} className="shrink-0 text-amber-700" aria-hidden="true" />
          <span>
            The previous receipt was not accepted by management. Please review your transfer or upload a replacement receipt below.
          </span>
        </div>
      )}

      {/* Payment Method Selector Tabs (Cielo style) */}
      <div className="public-cielo-method-tabs-group">
        <label className="public-cielo-field-label block mb-2">Select Payment Method</label>
        <div className="public-cielo-method-tabs">
          {methods.includes('gcash') && <button
            type="button"
            onClick={() => setMethod('gcash')}
            aria-pressed={method === 'gcash'}
            className={
              'public-cielo-method-tab' + (method === 'gcash' ? ' is-active' : '')
            }
          >
            <Smartphone size={20} aria-hidden="true" />
            <span className="font-bold text-sm">GCash</span>
          </button>}

          {methods.includes('bank_transfer') && <button
            type="button"
            onClick={() => setMethod('bank_transfer')}
            aria-pressed={method === 'bank_transfer'}
            className={
              'public-cielo-method-tab' + (method === 'bank_transfer' ? ' is-active' : '')
            }
          >
            <Building2 size={20} aria-hidden="true" />
            <span className="font-bold text-sm">
              {payment.bank_name ? `Bank (${payment.bank_name})` : 'Bank Transfer'}
            </span>
          </button>}
        </div>
      </div>

      {/* Account Details Box (Cielo style) */}
      <div className="public-cielo-account-box">
        <div className="public-cielo-account-box-title">
          {method === 'gcash' ? 'GCash Account Details' : 'Bank Transfer Details'}
        </div>

        {method === 'gcash' ? (
          <div className="public-cielo-account-details-list">
            <div className="public-cielo-account-row">
              <span className="public-cielo-account-label">Account Name:</span>
              <strong className="public-cielo-account-value font-mono">
                {payment.gcash_name || 'Seabliss Beach Resort'}
              </strong>
            </div>
            {payment.gcash_number && (
              <div className="public-cielo-account-row">
                <span className="public-cielo-account-label">Mobile Number:</span>
                <strong className="public-cielo-account-value font-mono text-base font-bold text-primary">
                  {payment.gcash_number}
                </strong>
              </div>
            )}
            <div className="public-cielo-account-row public-cielo-account-total-row">
              <span className="public-cielo-account-label font-bold">Amount to Send:</span>
              <strong className="public-cielo-account-amount">
                {formatPeso(booking.pricing.amountDue)}
              </strong>
            </div>
          </div>
        ) : (
          <div className="public-cielo-account-details-list">
            {payment.bank_name && (
              <div className="public-cielo-account-row">
                <span className="public-cielo-account-label">Bank Name:</span>
                <strong className="public-cielo-account-value">{payment.bank_name}</strong>
              </div>
            )}
            <div className="public-cielo-account-row">
              <span className="public-cielo-account-label">Account Name:</span>
              <strong className="public-cielo-account-value font-mono">
                {payment.bank_account_name || 'Seabliss Beach Resort'}
              </strong>
            </div>
            {payment.bank_account_number && (
              <div className="public-cielo-account-row">
                <span className="public-cielo-account-label">Account Number:</span>
                <strong className="public-cielo-account-value font-mono text-base font-bold text-primary">
                  {payment.bank_account_number}
                </strong>
              </div>
            )}
            <div className="public-cielo-account-row public-cielo-account-total-row">
              <span className="public-cielo-account-label font-bold">Amount to Send:</span>
              <strong className="public-cielo-account-amount">
                {formatPeso(booking.pricing.amountDue)}
              </strong>
            </div>
          </div>
        )}

        {/* QR Code if configured */}
        {qr && (
          <div className="public-cielo-qr-section">
            <div className="public-cielo-qr-card">
              <Image
                src={qr}
                alt="Management-configured payment QR code"
                width={200}
                height={200}
                unoptimized
                className="public-cielo-qr-image"
              />
              <span className="public-cielo-qr-caption">
                <QrCode size={14} className="inline mr-1" aria-hidden="true" />
                Scan to pay with {method === 'gcash' ? 'GCash' : 'your banking app'}
              </span>
            </div>
          </div>
        )}

        <p className="public-cielo-ref-reminder">
          Please include booking reference <strong>{booking.referenceNumber}</strong> in your payment remarks or transfer notes.
        </p>
      </div>

      {/* Upload Form */}
      <form noValidate onSubmit={submit} className="space-y-5">
        {/* Receipt Upload Dropzone (Cielo style) */}
        <div className="public-cielo-field-group">
          <label className="public-cielo-field-label">
            Upload Payment Receipt / Screenshot *
          </label>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
            className="hidden"
            id="cielo-receipt-input"
          />

          {!file ? (
            <label
              htmlFor="cielo-receipt-input"
              className="public-cielo-dropzone group"
            >
              <div className="public-cielo-dropzone-icon-wrap group-hover:scale-105 transition-transform">
                <Upload size={24} aria-hidden="true" />
              </div>
              <div>
                <span className="public-cielo-dropzone-title">
                  Tap or click to select receipt image
                </span>
                <span className="public-cielo-dropzone-desc">
                  Supports JPG, PNG, WebP or PDF up to 10MB
                </span>
              </div>
            </label>
          ) : (
            <div className="public-cielo-file-preview-card">
              <div className="public-cielo-file-preview-info">
                {preview ? (
                  <div className="public-cielo-preview-thumb">
                    <Image
                      src={preview}
                      alt="Receipt preview"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="public-cielo-preview-icon">
                    <FileText size={24} aria-hidden="true" />
                  </div>
                )}
                <div className="public-cielo-preview-text">
                  <strong className="public-cielo-preview-filename">{file.name}</strong>
                  <span className="public-cielo-preview-size">
                    {(file.size / 1024).toFixed(1)} KB · Ready for submission
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="public-cielo-remove-file-btn"
                title="Remove receipt"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Actual Amount Paid Field */}
        <div className="public-cielo-field-group">
          <label htmlFor="amountClaimed" className="public-cielo-field-label">
            Actual Amount Paid (PHP) *
          </label>
          <input
            id="amountClaimed"
            type="number"
            min={1}
            max={booking.pricing.totalAmount}
            step={1}
            inputMode="numeric"
            required
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="public-cielo-input"
          />
          <span className="public-cielo-field-hint">
            Confirm the exact whole-peso amount transferred in your receipt screenshot.
          </span>
        </div>

        {/* Action Buttons: Disabled until payment proof is uploaded, shorter button text on mobile */}
        <div className="public-cielo-actions-row">
          <button
            type="submit"
            disabled={pending || needsStatusCheck || !file}
            className="public-button public-button-teal public-cielo-submit-btn flex-1"
          >
            <span className="public-reservation-payment-action-full">
              {pending ? 'Submitting Payment Proof…' : 'Submit Reservation & Payment Proof'}
            </span>
            <span className="public-reservation-payment-action-short">
              {pending ? 'Submitting…' : 'Submit Payment Proof'}
            </span>
            <CheckCircle2 size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Secondary recovery links */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-outline/10 text-xs">
          <button
            type="button"
            onClick={checkStatus}
            disabled={pending}
            className="public-cielo-restart-link"
          >
            <span>Check Submission Status</span>
          </button>

          {onStartNew && (
            <button
              type="button"
              onClick={onStartNew}
              disabled={pending}
              className="public-cielo-restart-link"
            >
              <RotateCcw size={13} aria-hidden="true" />
              <span>Start a New Request</span>
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
