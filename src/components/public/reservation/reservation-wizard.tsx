'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, RotateCcw, CheckCircle2, ArrowRight } from 'lucide-react'
import { calculatePricing } from '@/lib/booking/pricing'
import {
  reviewReservationAction,
  createReviewedReservationAction,
  resumeReservationAction,
} from '@/app/actions/reservation'
import {
  guestDetailsSchema,
  parseStayDraft,
  stayDraftKey,
  staySchema,
  stayDetailsSchema,
  type PaymentDetails,
  type ReservationInput,
  type ReservationSnapshot,
  type ReviewedReservation,
  type UrlStayPreferences,
} from '@/lib/public/reservation-model'
import { type PublicRoomDetails, type PublicSettings, formatStayTime } from '@/lib/public/content'
import ReservationProgress from './reservation-progress'
import StayStep, { type StayInput } from './stay-step'
import GuestStep, { type GuestInput } from './guest-step'
import RoomStep from './room-step'
import PaymentStep from './payment-step'
import BookingSummary from './booking-summary'
import { issueFields } from './form-fields'

const blankGuest: GuestInput = { guestName: '', guestEmail: '', guestPhone: '', specialRequests: '' }

export default function ReservationWizard({
  rooms,
  settings,
  payment,
  preselectedRoom,
  preselectedStay,
  requestedFlow,
  freshRequest,
  contactHref,
  today,
}: {
  rooms: PublicRoomDetails[]
  settings: PublicSettings
  payment: PaymentDetails
  preselectedRoom: string
  preselectedStay?: UrlStayPreferences | null
  requestedFlow: string
  freshRequest: boolean
  contactHref: string
  today: string
}) {
  const router = useRouter()
  const initial = useRef({ rooms, preselectedRoom, preselectedStay, requestedFlow, freshRequest })
  const [ready, setReady] = useState(false)
  const [flowId, setFlowId] = useState('')
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [stay, setStay] = useState<StayInput>({
    roomSlug: preselectedRoom,
    checkIn: '',
    checkOut: '',
    adultGuests: 2,
    childGuests: 0,
  })
  const [guest, setGuest] = useState<GuestInput>(blankGuest)
  const [paymentOption, setPaymentOption] = useState<'full' | 'half'>('full')
  const [reviewed, setReviewed] = useState<ReviewedReservation | null>(null)
  const [booking, setBooking] = useState<ReservationSnapshot | null>(null)
  const [priceReviewRequired, setPriceReviewRequired] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)
  const [resumeBlocked, setResumeBlocked] = useState(false)
  const [existingBookingPrompt, setExistingBookingPrompt] = useState(false)
  const busy = useRef(false)
  const stepContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mounted = true
    async function initialize() {
      const config = initial.current
      let draft = null
      try {
        if (!config.freshRequest) {
          draft = parseStayDraft(sessionStorage.getItem(stayDraftKey))
        }
      } catch {
        /* Form works without browser storage. */
      }
      const id = config.requestedFlow || draft?.flowId || crypto.randomUUID()
      const roomSlug = config.preselectedStay?.roomSlug || config.preselectedRoom || draft?.roomSlug || ''
      const checkInVal = config.preselectedStay?.checkIn || draft?.checkIn || ''
      const checkOutVal = config.preselectedStay?.checkOut || draft?.checkOut || ''
      const adultVal = config.preselectedStay?.adultGuests || draft?.adultGuests || 2
      const childVal = config.preselectedStay?.childGuests ?? draft?.childGuests ?? 0
      if (!mounted) return
      setFlowId(id)
      setStay({
        roomSlug: config.rooms.some((room) => room.slug === roomSlug) ? roomSlug : '',
        checkIn: checkInVal,
        checkOut: checkOutVal,
        adultGuests: adultVal,
        childGuests: childVal,
      })
      setPaymentOption(draft?.paymentOption || 'full')

      if (config.requestedFlow || draft) {
        try {
          const result = await resumeReservationAction(id)
          if (!mounted) return
          if (!result.success) {
            setMessage(result.error)
            setResumeBlocked(true)
          } else if (result.data) {
            setBooking(result.data)
            setStep(4)
            setPriceReviewRequired(true)
            const targetRoom = config.preselectedStay?.roomSlug || config.preselectedRoom
            if (!config.requestedFlow || (targetRoom && targetRoom !== result.data.roomSlug)) {
              setExistingBookingPrompt(true)
            }
          }
        } catch {
          if (mounted) {
            setMessage('Could not check your previous request. Please retry before starting another.')
            setResumeBlocked(true)
          }
        }
      }
      if (mounted) setReady(true)
    }
    void initialize()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!ready || !flowId) return
    const savedStay = booking
      ? {
          roomSlug: booking.roomSlug,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          adultGuests: booking.adultGuests,
          childGuests: booking.childGuests,
        }
      : stay
    try {
      sessionStorage.setItem(
        stayDraftKey,
        JSON.stringify({
          version: 1,
          flowId,
          expiresAt: Date.now() + 86_400_000,
          ...savedStay,
          paymentOption: booking?.paymentOption || paymentOption,
        })
      )
    } catch {
      /* Storage can be disabled; form remains usable. */
    }
  }, [ready, flowId, stay, paymentOption, booking])

  useEffect(() => {
    if (ready && !existingBookingPrompt && !resumeBlocked) {
      const title = stepContainerRef.current?.querySelector<HTMLElement>('.public-cielo-step-title')
      title?.setAttribute('tabindex', '-1')
      title?.focus({ preventScroll: true })
    }
  }, [step, ready, existingBookingPrompt, resumeBlocked])

  const selected = rooms.find((room) => room.slug === (booking?.roomSlug || stay.roomSlug))
  const pricing = useMemo(() => {
    if (booking) return booking.pricing
    if (reviewed) return reviewed.pricing
    if (!selected || !staySchema.safeParse(stay).success) return null
    try {
      return calculatePricing({
        regularRate: selected.regular_rate,
        ...stay,
        roomMaxGuests: selected.max_guests,
        extraPersonFee: settings.extra_person_fee,
        securityDeposit: settings.security_deposit,
        paymentOption,
      })
    } catch {
      return null
    }
  }, [booking, reviewed, selected, stay, settings.extra_person_fee, settings.security_deposit, paymentOption])

  function scrollToWizard() {
    if (typeof window !== 'undefined') {
      const topOffset = stepContainerRef.current?.getBoundingClientRect().top
      if (topOffset !== undefined) {
        window.scrollBy({ top: topOffset - 100, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
      }
    }
  }

  function updateStay(patch: Partial<StayInput>) {
    setStay((current) => ({ ...current, ...patch }))
    setReviewed(null)
    setErrors({})
    setMessage('')
  }

  function startNewRequest() {
    if (pending) return
    try {
      sessionStorage.removeItem(stayDraftKey)
    } catch {}
    const newId = crypto.randomUUID()
    setFlowId(newId)
    setBooking(null)
    setReviewed(null)
    setPriceReviewRequired(false)
    setExistingBookingPrompt(false)
    setErrors({})
    setMessage('')
    setStep(1)
    setGuest(blankGuest)
    const targetRoom = preselectedStay?.roomSlug || preselectedRoom || ''
    setStay({
      roomSlug: rooms.some((r) => r.slug === targetRoom) ? targetRoom : '',
      checkIn: preselectedStay?.checkIn || '',
      checkOut: preselectedStay?.checkOut || '',
      adultGuests: preselectedStay?.adultGuests || 2,
      childGuests: preselectedStay?.childGuests || 0,
    })
    router.replace('/reserve' + (targetRoom ? '?room=' + encodeURIComponent(targetRoom) : ''))
    scrollToWizard()
  }

  function navigateStep(nextStep: 1 | 2 | 3) {
    // A recorded request is immutable here. Starting another request is explicit.
    if (pending || booking || nextStep >= step) return
    setStep(nextStep)
    setErrors({})
    setMessage('')
    setReviewed(null)
    scrollToWizard()
  }

  function validateStay(requireRoom: boolean) {
    const parsed = (requireRoom ? staySchema : stayDetailsSchema).safeParse(stay)
    if (!parsed.success) {
      setErrors(issueFields(parsed.error.issues))
      return false
    }
    if (stay.checkIn < today) {
      setErrors({ checkIn: 'Check-in date cannot be in the past.' })
      return false
    }
    return true
  }

  function submitStay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateStay(false)) return
    setErrors({})
    setStep(2)
    scrollToWizard()
  }

  function submitRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!validateStay(true)) return
    if (!selected) {
      setErrors({ roomSlug: 'Please select an accommodation to continue.' })
      return
    }
    setErrors({})
    setStep(3)
    scrollToWizard()
  }

  function submitGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending || booking || !validateStay(true)) return
    const parsed = guestDetailsSchema.safeParse(guest)
    if (!parsed.success) {
      setErrors(issueFields(parsed.error.issues))
      return
    }
    setGuest(parsed.data)
    setErrors({})
    void create({ ...stay, ...parsed.data, paymentOption })
  }

  function submitted() {
    router.replace('/reserve/confirmation?request=' + encodeURIComponent(flowId))
  }

  async function recover() {
    if (busy.current) return
    busy.current = true
    setPending(true)
    try {
      const result = await resumeReservationAction(flowId)
      if (!result.success) {
        setMessage(result.error)
        return
      }
      setResumeBlocked(false)
      if (result.data) {
        setBooking(result.data)
        setStep(4)
        setPriceReviewRequired(true)
        setExistingBookingPrompt(true)
      }
      setMessage('')
    } catch {
      setMessage('Could not check the request. Please try again before creating another one.')
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  async function create(validatedInput: ReservationInput) {
    if (busy.current || !pricing) return
    busy.current = true
    setPending(true)
    setMessage('')
    try {
      const prior = await resumeReservationAction(flowId)
      if (!prior.success) {
        setMessage(prior.error)
        return
      }
      if (prior.data) {
        setBooking(prior.data)
        setStep(4)
        setPriceReviewRequired(true)
        setGuest(blankGuest)
        return
      }
      const result = await reviewReservationAction(flowId, validatedInput)
      if (!result.success) {
        setMessage(result.error)
        return
      }
      setReviewed(result.data)
      if (JSON.stringify(result.data.pricing) !== JSON.stringify(pricing)) {
        setMessage(
          'Current prices have been refreshed. Please review the updated charges before continuing.'
        )
        return
      }
      const created = await createReviewedReservationAction(flowId, result.data.input)
      if (!created.success) {
        setMessage(created.error)
        return
      }
      setPriceReviewRequired(JSON.stringify(created.data.pricing) !== JSON.stringify(result.data.pricing))
      setBooking(created.data)
      setGuest(blankGuest)
      setStep(4)
      scrollToWizard()
    } catch {
      setMessage('The response was interrupted. Retry on this page to recover the same request safely.')
    } finally {
      busy.current = false
      setPending(false)
    }
  }

  if (!ready) {
    return (
      <section className="public-cielo-wizard-container public-cielo-loading-state" aria-busy="true">
        <div className="public-cielo-spinner" aria-hidden="true" />
        <p>Preparing your reservation preferences and checking for a saved request…</p>
      </section>
    )
  }

  // Returning visitor prompt card (Cielo style)
  if (existingBookingPrompt && booking) {
    return (
      <section className="public-cielo-wizard-container">
        <div className="public-cielo-existing-prompt-card">
          <div className="public-cielo-prompt-icon-wrap">
            <CheckCircle2 size={36} className="text-teal" aria-hidden="true" />
          </div>
          <span className="public-cielo-step-eyebrow">EXISTING REQUEST LOCATED</span>
          <h2 className="public-cielo-prompt-title">You Have a Saved Booking Request</h2>
          <p className="public-cielo-prompt-desc">
            Your saved request <strong>{booking.referenceNumber}</strong> is for{' '}
            <strong>{booking.roomName}</strong> ({booking.checkIn} — {booking.checkOut}).
          </p>
          <p className="public-cielo-prompt-subtext">
            You can resume submitting payment proof for this request, or begin an entirely separate new booking. Starting a new request does not delete your earlier record.
          </p>
          <div className="public-cielo-prompt-actions">
            <button
              type="button"
              className="public-button public-button-teal public-cielo-prompt-btn"
              onClick={() => {
                setExistingBookingPrompt(false)
                setStep(4)
              }}
            >
              <span>Resume Existing Request</span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="public-button-secondary public-cielo-prompt-btn"
              onClick={startNewRequest}
            >
              <RotateCcw size={15} aria-hidden="true" />
              <span>Begin a Separate Request</span>
            </button>
          </div>
        </div>
      </section>
    )
  }

  if (resumeBlocked) {
    return (
      <section className="public-cielo-wizard-container">
        <div className="public-cielo-alert-error" role="alert">
          <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </div>
        <div className="public-cielo-actions-row justify-center mt-6">
          <button
            type="button"
            className="public-button public-button-teal"
            disabled={pending}
            onClick={recover}
          >
            Check Saved Request Again
          </button>
          <a href={contactHref} className="public-button-secondary">
            Contact Management
          </a>
        </div>
      </section>
    )
  }

  return (
    <div className="public-cielo-wizard-wrapper" ref={stepContainerRef}>
      {/* ─────────────────────── CIELO-STYLE STEP PROGRESS BAR ─────────────────────── */}
      <ReservationProgress
        currentStep={step}
        disabled={pending || Boolean(booking)}
        onStepClick={(targetStep) => {
          if (targetStep !== 4) navigateStep(targetStep)
        }}
      />

      {/* ─────────────────────── MAIN 2-COLUMN WIZARD BODY ─────────────────────── */}
      <div className="public-cielo-wizard-container">
        <div className="public-cielo-layout-grid">
          {/* ─────────────────────── LEFT: ACTIVE STEP CARD ─────────────────────── */}
          <div className="public-cielo-main-col">
            {message && (
              <div className="public-cielo-alert-error" role="alert">
                <AlertCircle size={18} className="shrink-0" aria-hidden="true" />
                <span>{message}</span>
              </div>
            )}

            <div className="public-cielo-step-card">
              {step === 1 && (
                <StayStep
                  stay={stay}
                  today={today}
                  errors={errors}
                  settings={settings}
                  onChange={updateStay}
                  onSubmit={submitStay}
                />
              )}

              {step === 2 && (
                <RoomStep stay={stay} rooms={rooms} settings={settings} paymentOption={paymentOption} errors={errors}
                  onChange={updateStay} onBack={() => navigateStep(1)} onSubmit={submitRoom} />
              )}

              {step === 3 && (
                <GuestStep
                  guest={guest}
                  errors={errors}
                  pending={pending}
                  onChange={(patch) => {
                    setGuest((current) => ({ ...current, ...patch }))
                    setReviewed(null)
                    setErrors({})
                    setMessage('')
                  }}
                  onBack={() => navigateStep(2)}
                  onSubmit={submitGuest}
                />
              )}

              {step === 4 && booking && (
                <PaymentStep
                  key={booking.referenceNumber + booking.pricing.totalAmount}
                  flowId={flowId}
                  booking={booking}
                  payment={payment}
                  contactHref={contactHref}
                  requirePriceReview={priceReviewRequired}
                  onRecovered={recovered => {
                    if (JSON.stringify(recovered.pricing) !== JSON.stringify(booking.pricing)) setPriceReviewRequired(true)
                    setBooking(recovered)
                  }}
                  onSubmitted={submitted}
                  onStartNew={startNewRequest}
                />
              )}
            </div>
          </div>

          {/* ─────────────────────── RIGHT: LIVE STICKY BREAKDOWN CARD ─────────────────────── */}
          <div className="public-cielo-sidebar-col">
            <BookingSummary
              name={booking?.roomName || reviewed?.roomName || selected?.name}
              checkIn={booking?.checkIn || stay.checkIn}
              checkOut={booking?.checkOut || stay.checkOut}
              adults={booking?.adultGuests || stay.adultGuests}
              childrenCount={booking?.childGuests ?? stay.childGuests}
              pricing={pricing}
              checkInTime={(settings.check_in_time && formatStayTime(settings.check_in_time)) || '2:00 PM'}
              checkOutTime={(settings.check_out_time && formatStayTime(settings.check_out_time)) || '12:00 PM'}
              image={
                selected?.gallery[0] ||
                (booking
                  ? rooms.find((r) => r.slug === booking.roomSlug || r.name === booking.roomName)?.gallery[0]
                  : undefined)
              }
              onResetDraft={!booking && !pending ? startNewRequest : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
