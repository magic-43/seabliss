'use client'

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Users,
  BedDouble,
  Maximize2,
  WavesLadder,
  Check,
  Expand,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
  Images,
} from 'lucide-react'
import { formatPeso } from '@/lib/format'
import type { PublicRoomDetails, PublicSettings } from '@/lib/public/content'
import ResortImage from './resort-image'

export default function RoomDetailClient({
  room,
  settings,
  checkIn,
  checkOut,
  relatedRooms,
  contactHref,
}: {
  room: PublicRoomDetails
  settings: PublicSettings | null
  checkIn: string | null
  checkOut: string | null
  relatedRooms: PublicRoomDetails[]
  contactHref: string
}) {
  const [activePhoto, setActivePhoto] = useState(0)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const lastOpenerRef = useRef<HTMLElement | null>(null)
  const pointerStart = useRef<number | null>(null)
  const previousOverflow = useRef<string | null>(null)
  const images = room.gallery || []

  // Ensure scroll lock is restored on unmount
  useEffect(() => {
    return () => {
      if (previousOverflow.current !== null) {
        document.documentElement.style.overflow = previousOverflow.current
      }
    }
  }, [])

  const movePhoto = useCallback(
    (direction: number) => {
      if (!images.length) return
      setActivePhoto((prev) => (prev + direction + images.length) % images.length)
    },
    [images.length]
  )

  const openLightbox = (index: number, openerEl?: HTMLElement | null) => {
    if (!images.length) return
    lastOpenerRef.current = openerEl || document.activeElement as HTMLElement
    setActivePhoto(index)
    previousOverflow.current = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    dialogRef.current?.showModal()
  }

  const closeLightbox = () => {
    dialogRef.current?.close()
  }

  const handleLightboxClose = () => {
    if (previousOverflow.current !== null) {
      document.documentElement.style.overflow = previousOverflow.current
      previousOverflow.current = null
    }
    lastOpenerRef.current?.focus({ preventScroll: true })
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      movePhoto(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      movePhoto(1)
    } else if (e.key === 'Tab') {
      const focusable = e.currentTarget.querySelectorAll<HTMLButtonElement>('button')
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStart.current = e.clientX
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (pointerStart.current !== null) {
      const diff = e.clientX - pointerStart.current
      if (Math.abs(diff) > 45) {
        movePhoto(diff < 0 ? 1 : -1)
      }
      pointerStart.current = null
    }
  }

  const reserveHref = '/reserve?room=' + encodeURIComponent(room.slug)

  return (
    <div className="public-room-detail-container">
      {/* 1. Breadcrumb navigation */}
      <div className="public-breadcrumb-bar">
        <Link href="/rooms" className="public-breadcrumb-link">
          <ArrowLeft size={16} aria-hidden="true" />
          <span>Back to all accommodations</span>
        </Link>
      </div>

      {/* 2. Large photographic mosaic before the main title */}
      <section className="public-detail-mosaic-section" aria-label="Accommodation photographs">
        {images.length === 0 ? (
          <div className="public-mosaic-fallback">
            <ResortImage alt={room.name} sizes="100vw" />
          </div>
        ) : images.length === 1 ? (
          <div className="public-mosaic-single">
            <button
              type="button"
              className="public-mosaic-item public-mosaic-dominant"
              onClick={(e) => openLightbox(0, e.currentTarget)}
              aria-label={`View photo of ${room.name} full screen`}
            >
              <ResortImage
                src={images[0]}
                alt={`${room.name} primary photograph`}
                sizes="(min-width: 1440px) 1440px, 100vw"
                preload
              />
              <div className="public-mosaic-badges">
                <span className="public-room-category-badge">{room.category}</span>
                {room.has_plunge_pool && (
                  <span className="public-room-pool-badge">
                    <WavesLadder size={13} aria-hidden="true" />
                    <span>Private Plunge Pool</span>
                  </span>
                )}
              </div>
              <span className="public-mosaic-expand-btn">
                <Expand size={16} aria-hidden="true" />
                <span>View photo</span>
              </span>
            </button>
          </div>
        ) : images.length === 2 ? (
          <div className="public-mosaic-pair">
            <button
              type="button"
              className="public-mosaic-item public-mosaic-pair-item"
              onClick={(e) => openLightbox(0, e.currentTarget)}
              aria-label={`View first photo of ${room.name}`}
            >
              <ResortImage
                src={images[0]}
                alt={`${room.name} exterior view`}
                sizes="(min-width: 1024px) 50vw, 100vw"
                preload
              />
              <div className="public-mosaic-badges">
                <span className="public-room-category-badge">{room.category}</span>
              </div>
            </button>
            <button
              type="button"
              className="public-mosaic-item public-mosaic-pair-item"
              onClick={(e) => openLightbox(1, e.currentTarget)}
              aria-label={`View second photo of ${room.name}`}
            >
              <ResortImage
                src={images[1]}
                alt={`${room.name} interior view`}
                sizes="(min-width: 1024px) 50vw, 100vw"
              />
              <span className="public-mosaic-expand-btn">
                <Images size={16} aria-hidden="true" />
                <span>View all 2 photos</span>
              </span>
            </button>
          </div>
        ) : (
          <div className="public-mosaic-grid">
            {/* Dominant image (span 8 on desktop) */}
            <button
              type="button"
              className="public-mosaic-item public-mosaic-dominant"
              onClick={(e) => openLightbox(0, e.currentTarget)}
              aria-label={`View photo 1 of ${room.name} full screen`}
            >
              <ResortImage
                src={images[0]}
                alt={`${room.name} dominant photograph`}
                sizes="(min-width: 1024px) 66vw, 100vw"
                preload
              />
              <div className="public-mosaic-badges">
                <span className="public-room-category-badge">{room.category}</span>
                {room.has_plunge_pool && (
                  <span className="public-room-pool-badge">
                    <WavesLadder size={13} aria-hidden="true" />
                    <span>Private Plunge Pool</span>
                  </span>
                )}
              </div>
              <span className="public-mosaic-expand-btn">
                <Images size={16} aria-hidden="true" />
                <span>View all {images.length} photos</span>
              </span>
            </button>

            {/* Supporting 2 images stacked (span 4 on desktop, hidden on mobile) */}
            <div className="public-mosaic-side-stack">
              <button
                type="button"
                className="public-mosaic-item public-mosaic-sub"
                onClick={(e) => openLightbox(1, e.currentTarget)}
                aria-label={`View photo 2 of ${room.name}`}
              >
                <ResortImage
                  src={images[1]}
                  alt={`${room.name} photo 2`}
                  sizes="(min-width: 1024px) 33vw, 50vw"
                />
              </button>
              <button
                type="button"
                className="public-mosaic-item public-mosaic-sub"
                onClick={(e) => openLightbox(2, e.currentTarget)}
                aria-label={`View photo 3 of ${room.name}`}
              >
                <ResortImage
                  src={images[2]}
                  alt={`${room.name} photo 3`}
                  sizes="(min-width: 1024px) 33vw, 50vw"
                />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 3. Main content and desktop sticky booking-information panel */}
      <section className="public-detail-main-layout">
        {/* Left Column: Room info, specs, description, amenities, stay rules, inline gallery */}
        <div className="public-detail-content-col">
          <header className="public-detail-title-block">
            <span className="public-eyebrow">
              {room.category} · {room.location || 'LIAN, BATANGAS'}
            </span>
            <h1 className="public-detail-title">{room.name}</h1>
            {room.tagline && <p className="public-detail-tagline">{room.tagline}</p>}

            <div className="public-detail-spec-chips">
              <span className="public-spec-chip">
                <Users size={16} aria-hidden="true" />
                <span>{room.max_guests} Guests included</span>
              </span>
              {room.size_sqm !== null && room.size_sqm !== undefined && (
                <span className="public-spec-chip">
                  <Maximize2 size={15} aria-hidden="true" />
                  <span>{room.size_sqm} m²</span>
                </span>
              )}
              {room.bed_type && (
                <span className="public-spec-chip">
                  <BedDouble size={16} aria-hidden="true" />
                  <span>{room.bed_type}</span>
                </span>
              )}
              {room.has_plunge_pool && (
                <span className="public-spec-chip public-spec-pool">
                  <WavesLadder size={15} aria-hidden="true" />
                  <span>Private Plunge Pool</span>
                </span>
              )}
            </div>
          </header>

          <div className="public-detail-section">
            <h2>Your Space by the Sea</h2>
            <div className="public-detail-description">
              {room.description ? (
                <p>{room.description}</p>
              ) : (
                <p>Speak with our team for more information about this accommodation.</p>
              )}
            </div>
          </div>

          {room.amenities.length > 0 && (
            <div className="public-detail-section">
              <h2>Inclusions & Highlights</h2>
              <div className="public-amenities-card-grid">
                {room.amenities.map((amenity) => (
                  <div key={amenity} className="public-amenity-card-item">
                    <div className="public-amenity-card-icon" aria-hidden="true">
                      <Check size={16} />
                    </div>
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {room.features.length > 0 && (
            <div className="public-detail-section">
              <h2>During Your Stay</h2>
              <ul className="public-features-bullet-list">
                {room.features.map((feature) => (
                  <li key={feature}>
                    <Check size={15} aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 5. Verified stay information: Things to Note */}
          <div className="public-detail-section">
            <div className="public-notes-card">
              <div className="public-notes-head">
                <Info size={20} className="public-notes-icon" aria-hidden="true" />
                <h3>Things to Note</h3>
              </div>
              <ul className="public-notes-list">
                {checkIn && checkOut && (
                  <li>
                    <strong>Check-in:</strong> {checkIn} · <strong>Check-out:</strong> {checkOut} (Philippine standard time)
                  </li>
                )}
                {settings?.extra_person_fee !== undefined && (
                  <li>
                    <strong>Extra Guests:</strong>{' '}
                    {settings.extra_person_fee === 0
                      ? 'No extra guest fee applies.'
                      : `${formatPeso(settings.extra_person_fee)} per extra guest, per night.`}
                  </li>
                )}
                {settings?.security_deposit !== undefined && settings.security_deposit > 0 && (
                  <li>
                    <strong>Security Deposit:</strong> {formatPeso(settings.security_deposit)} per stay (refundable subject to property inspection).
                  </li>
                )}
                <li>
                  <strong>Cashless Payment:</strong> We accept bank transfers and GCash with verified transaction reference.
                </li>
                <li>
                  <strong>Booking Verification:</strong> Booking requests and receipts are reviewed by management. Submission does not automatically guarantee availability.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Desktop Sticky Booking-Information Panel */}
        <aside className="public-detail-sidebar-col">
          <div className="public-sticky-booking-panel">
            <span className="public-booking-panel-eyebrow">PLAN YOUR STAY</span>
            <div className="public-booking-panel-rate">
              <span className="public-booking-panel-rate-label">Starting Rate</span>
              <div className="public-booking-panel-rate-line">
                <span className="public-booking-rate-val">{formatPeso(room.regular_rate)}</span>
                <span className="public-booking-rate-unit">/ night</span>
              </div>
            </div>

            <div className="public-booking-panel-specs">
              <div className="public-panel-spec-row">
                <span>Included Allowance</span>
                <strong>{room.max_guests} Guests</strong>
              </div>
              {settings?.extra_person_fee !== undefined && (
                <div className="public-panel-spec-row">
                  <span>Extra Guest Fee</span>
                  <strong>
                    {settings.extra_person_fee === 0 ? 'Included' : `${formatPeso(settings.extra_person_fee)} / night`}
                  </strong>
                </div>
              )}
              {settings?.security_deposit !== undefined && settings.security_deposit > 0 && (
                <div className="public-panel-spec-row">
                  <span>Security Deposit</span>
                  <strong>{formatPeso(settings.security_deposit)}</strong>
                </div>
              )}
              {checkIn && checkOut && (
                <div className="public-panel-spec-row">
                  <span>Stay Hours</span>
                  <strong>
                    {checkIn} – {checkOut}
                  </strong>
                </div>
              )}
            </div>

            <Link href={reserveHref} className="public-button public-button-teal public-panel-cta">
              <span>Reserve This Accommodation</span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>

            <a href={contactHref} className="public-panel-contact-link">
              Speak with Management
            </a>

            <p className="public-panel-disclaimer">
              Your request and payment proof will be reviewed by management. Submission does not automatically guarantee accommodation availability.
            </p>
          </div>
        </aside>
      </section>

      {/* 7. Related active accommodations & closing invitation */}
      {relatedRooms.length > 0 && (
        <section className="public-related-rooms-section" aria-labelledby="related-heading">
          <div className="public-container">
            <div className="public-section-head text-center">
              <p className="public-eyebrow">EXPLORE MORE RETREATS</p>
              <h2 id="related-heading">Other Accommodations You May Like</h2>
            </div>

            <div className="public-related-grid">
              {relatedRooms.map((related) => (
                <article key={related.id} className="public-related-card">
                  <Link
                    href={'/rooms/' + encodeURIComponent(related.slug)}
                    className="public-related-media"
                    aria-label={'Explore ' + related.name}
                  >
                    <ResortImage
                      src={related.gallery[0]}
                      alt={related.name}
                      sizes="(min-width: 1024px) 33vw, 100vw"
                    />
                    <span className="public-related-category">{related.category}</span>
                  </Link>
                  <div className="public-related-body">
                    <h3>
                      <Link href={'/rooms/' + encodeURIComponent(related.slug)}>
                        {related.name}
                      </Link>
                    </h3>
                    <p className="public-related-specs">
                      {related.max_guests} guests · {related.bed_type || 'Coastal stay'}
                    </p>
                    <div className="public-related-footer">
                      <span className="public-related-rate">
                        {formatPeso(related.regular_rate)} <span>/ night</span>
                      </span>
                      <Link
                        href={'/rooms/' + encodeURIComponent(related.slug)}
                        className="public-related-link"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="public-related-actions text-center">
              <Link href="/rooms" className="public-button public-button-outline">
                Browse All Accommodations
              </Link>
            </div>
          </div>
        </section>
      )}

      <aside className="public-room-mobile-reserve" aria-label={'Reserve ' + room.name}>
        <div className="public-room-mobile-rate">
          <span>Nightly rate</span>
          <strong>{formatPeso(room.regular_rate)} <small>/ night</small></strong>
        </div>
        <Link href={reserveHref} className="public-button public-button-teal" aria-label={'Reserve ' + room.name}>Reserve Now</Link>
      </aside>

      {/* Fullscreen Accessible Lightbox Dialog */}
      <dialog
        ref={dialogRef}
        className="public-lightbox"
        aria-label={`${room.name} photo gallery`}
        onKeyDown={handleKeyDown}
        onClose={handleLightboxClose}
      >
        <div className="public-lightbox-top">
          <div className="public-lightbox-info">
            <span className="public-lightbox-room-name">{room.name}</span>
            <span className="public-lightbox-counter">
              Photograph {activePhoto + 1} of {images.length}
            </span>
          </div>
          <button
            type="button"
            autoFocus
            onClick={closeLightbox}
            className="public-lightbox-close"
            aria-label="Close photo gallery"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div
          className="public-lightbox-viewport"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <div className="public-lightbox-photo">
            <ResortImage
              src={images[activePhoto]}
              alt={`${room.name} photograph ${activePhoto + 1}`}
              sizes="100vw"
            />
          </div>

          <button
            type="button"
            onClick={() => movePhoto(-1)}
            className="public-lightbox-arrow public-arrow-prev"
            aria-label="Previous photograph"
          >
            <ChevronLeft size={28} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => movePhoto(1)}
            className="public-lightbox-arrow public-arrow-next"
            aria-label="Next photograph"
          >
            <ChevronRight size={28} aria-hidden="true" />
          </button>
        </div>

        <div className="public-lightbox-thumbs-bar" aria-label="Select photograph">
          {images.map((src, idx) => (
            <button
              key={src + idx}
              type="button"
              className={'public-lightbox-mini-thumb' + (activePhoto === idx ? ' is-active' : '')}
              aria-label={`Jump to photo ${idx + 1}`}
              aria-pressed={activePhoto === idx}
              onClick={() => setActivePhoto(idx)}
            >
              <ResortImage src={src} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      </dialog>
    </div>
  )
}
