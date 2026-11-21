import Link from 'next/link'
import { Users, BedDouble, Maximize2, WavesLadder, ArrowRight, Check } from 'lucide-react'
import { formatPeso } from '@/lib/format'
import type { PublicRoomDetails } from '@/lib/public/content'
import ResortImage from './resort-image'

export default function RoomCard({ room }: { room: PublicRoomDetails }) {
  const detailHref = '/rooms/' + encodeURIComponent(room.slug)
  const reserveHref = '/reserve?room=' + encodeURIComponent(room.slug)

  return (
    <article className="public-room-row" data-room-id={room.id}>
      <div className="public-room-row-media">
        <Link href={detailHref} className="public-room-media-link" aria-label={'Explore ' + room.name}>
          <ResortImage
            src={room.gallery[0]}
            alt={room.name + ' at Seabliss Beach Resort'}
            sizes="(min-width: 1440px) 580px, (min-width: 1024px) 46vw, 100vw"
          />
        </Link>
        <div className="public-room-badges">
          <span className="public-room-category-badge">{room.category}</span>
          {room.has_plunge_pool && (
            <span className="public-room-pool-badge">
              <WavesLadder size={13} aria-hidden="true" />
              <span>Private Plunge Pool</span>
            </span>
          )}
        </div>
      </div>

      <div className="public-room-row-body">
        <div className="public-room-row-top">
          <p className="public-eyebrow">{room.location || 'LIAN, BATANGAS'}</p>
          <h3 className="public-room-row-title">
            <Link href={detailHref}>{room.name}</Link>
          </h3>
          {room.tagline ? (
            <p className="public-room-row-tagline">{room.tagline}</p>
          ) : room.description ? (
            <p className="public-room-row-tagline">{room.description.slice(0, 160)}…</p>
          ) : null}

          <div className="public-room-specs-strip">
            <div className="public-room-spec-item">
              <Users size={16} aria-hidden="true" />
              <span>{room.max_guests} guests included</span>
            </div>
            {room.bed_type && (
              <div className="public-room-spec-item">
                <BedDouble size={16} aria-hidden="true" />
                <span>{room.bed_type}</span>
              </div>
            )}
            {room.size_sqm !== null && room.size_sqm !== undefined && (
              <div className="public-room-spec-item">
                <Maximize2 size={15} aria-hidden="true" />
                <span>{room.size_sqm} m²</span>
              </div>
            )}
          </div>

          {room.amenities.length > 0 && (
            <ul className="public-room-amenities-pills" aria-label="Room amenities">
              {room.amenities.slice(0, 4).map((amenity) => (
                <li key={amenity}>
                  <Check size={13} aria-hidden="true" />
                  <span>{amenity}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="public-room-row-bottom">
          <div className="public-room-rate-block">
            <span className="public-room-rate-label">FROM</span>
            <div className="public-room-rate-line">
              <span className="public-room-rate-amount">{formatPeso(room.regular_rate)}</span>
              <span className="public-room-rate-period">/ night</span>
            </div>
          </div>

          <div className="public-room-actions">
            <Link href={detailHref} className="public-button-secondary">
              View Details
            </Link>
            <Link href={reserveHref} className="public-button public-button-teal">
              <span>Reserve</span>
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
