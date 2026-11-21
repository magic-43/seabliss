import ResortImage from './resort-image'
import { UsersRound, Waves, Sparkles } from 'lucide-react'
import type { PublicRoom } from '@/lib/public/content'
import { formatPeso } from '@/lib/format'
import AccommodationRail from './accommodation-rail'

export default function AccommodationShowcase({ rooms }: { rooms: PublicRoom[] | null }) {
  return <section id="accommodations" className="public-accommodations">
    <div className="public-container">
      <div className="public-accommodation-heading" data-reveal><p className="public-eyebrow">ACCOMMODATIONS</p><h2>Discover Your Stay</h2><p>Choose from our collection of private villas and spacious suites, each designed<br className="public-desktop-break" /> for comfort, togetherness, and a closer connection to the sea.</p></div>
      {rooms?.length ? <AccommodationRail count={rooms.length}>{rooms.map(room => <li className="public-room" data-room-id={room.id} key={room.id}>
        <div className="public-room-image">{room.gallery[0] ? <ResortImage src={room.gallery[0]} alt={`${room.name} at Seabliss Beach Resort`} sizes="(min-width: 1440px) 390px, (min-width: 1000px) 28vw, (min-width: 600px) 43vw, 85vw" /> : <div className="public-room-no-photo">Room photography is being updated.</div>}</div>
        <div className="public-room-copy"><h3><a href={'/rooms/' + encodeURIComponent(room.slug)} aria-label={`Explore ${room.name}`}>{room.name}</a></h3><div className="public-room-facts"><div><p className="public-room-guests"><UsersRound size={15} strokeWidth={1.4} aria-hidden="true" />{room.max_guests} guests included</p><p className="public-room-amenity">{room.has_plunge_pool ? <Waves size={15} strokeWidth={1.4} aria-hidden="true" /> : <Sparkles size={15} strokeWidth={1.4} aria-hidden="true" />}<span>{room.has_plunge_pool ? 'Private Plunge Pool' : room.amenities[0] || room.category}</span></p></div><p className="public-room-price">{formatPeso(room.regular_rate)}<span>/ night</span></p></div></div>
      </li>)}</AccommodationRail> : <div className="public-accommodations-unavailable"><h3>{rooms ? 'A stay worth planning.' : 'Let’s find your coastal stay.'}</h3><p>{rooms ? 'Speak with our management team for current accommodation information.' : 'Our accommodation details are temporarily unavailable. Please contact our team for current room information and rates.'}</p><a href="/contact" className="public-button public-button-teal">Contact the resort</a></div>}
      <p className="public-rate-note">Nightly room rates shown. Extra guest fees and the security deposit are additional. Requests do not guarantee availability; management finalizes accommodation arrangements.</p>
    </div>
  </section>
}
