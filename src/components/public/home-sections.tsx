import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, CalendarDays, ChevronDown, Shell, Utensils, Waves } from 'lucide-react'
import type { PublicRoom } from '@/lib/public/content'
import aerial from '../../../public/images/rooms/villa-4/villa-4-1.jpg'
import beachfrontPool from '../../../public/images/rooms/villa-1/villa-1-4.jpg'
import seaView from '../../../public/images/rooms/villa-4/villa-4-7.jpg'
import dining from '../../../public/images/rooms/villa-1/villa-1-7.jpg'
import gathering from '../../../public/images/rooms/villa-4/villa-4-2.jpg'

export function HeroSection({ reservationHref }: { reservationHref: string }) {
  const alt = 'The beachfront villas and private pools at Seabliss Beach Resort'
  return <section className="public-hero" aria-labelledby="hero-heading">
    <Image src={aerial} alt={alt} fill preload sizes="100vw" className="public-hero-image" />
    <div className="public-hero-shade" />
    <div className="public-container public-hero-content public-hero-enter">
      <p className="public-eyebrow">A PRIVATE COASTAL ESCAPE</p>
      <h1 id="hero-heading">Seabliss<br />Beach Resort</h1>
      <p className="public-hero-intro">A seaside retreat where spacious villas, serene suites, and warm coastal living come together for a truly relaxing escape.</p>
      <div className="public-hero-actions"><Link href="/rooms" className="public-button public-button-teal">Explore Accommodations <ArrowRight size={18} aria-hidden="true" /></Link><a href={reservationHref} className="public-button"><CalendarDays size={17} aria-hidden="true" />Reserve Your Stay</a></div>
    </div>
    <Link href="/#story" className="public-hero-scroll" aria-label="Discover the Seabliss story"><ChevronDown size={30} strokeWidth={1} aria-hidden="true" /></Link>
  </section>
}

export function ResortStory() {
  return <section id="story" className="public-story">
    <div className="public-container public-story-grid">
      <div className="public-story-image" data-reveal><Image src={seaView} alt="A Seabliss pool terrace looking out across the sea" fill placeholder="blur" sizes="(min-width: 1440px) 610px, (min-width: 768px) 48vw, 100vw" /></div>
      <div className="public-story-copy" data-reveal><p className="public-eyebrow">THE SEABLISS STORY</p><h2>A Beachfront Retreat<br />for Meaningful Escapes</h2><p>Seabliss Beach Resort brings together comfort, privacy, and coastal beauty — a place to unwind, reconnect, and create moments by the sea in Lian, Batangas.</p><Link href="/about" className="public-text-link">Discover Our Story <ArrowRight size={18} aria-hidden="true" /></Link></div>
    </div>
  </section>
}

export function ExperiencesSection({ rooms }: { rooms: PublicRoom[] | null }) {
  const diningFeature = rooms?.flatMap(room => room.features).find(feature => /breakfast|dinner|dining/i.test(feature))
  const privatePools = rooms?.some(room => room.has_plunge_pool)
  return <section id="experiences" className="public-experiences"><div className="public-container public-experiences-grid">
    <div className="public-experiences-intro" data-reveal><p className="public-eyebrow">EXPERIENCES</p><h2>More Than a Stay</h2><p>Time by the water. Space to reconnect. Discover the simple pleasures of a stay at Seabliss.</p></div>
    <div className="public-experience-cards">
      <figure data-reveal><Image src={seaView} alt="The sea beyond the Seabliss beachfront pool terrace" fill placeholder="blur" sizes="(min-width: 1440px) 290px, (min-width: 900px) 22vw, (min-width: 600px) 30vw, 85vw" /><figcaption><Shell size={24} strokeWidth={1} aria-hidden="true" /><h3>Beach & Sea</h3></figcaption><Link href="/experiences" className="public-experience-link" aria-label="Explore Beach and Sea" /></figure>
      {diningFeature && <figure className="public-dining-note" data-reveal><Image src={dining} alt="A dining table inside a Seabliss villa" fill placeholder="blur" sizes="(min-width: 1440px) 290px, (min-width: 900px) 22vw, (min-width: 600px) 30vw, 85vw" /><figcaption><Utensils size={24} strokeWidth={1} aria-hidden="true" /><h3>Dining</h3></figcaption><Link href="/dining" className="public-experience-link" aria-label="Explore Dining" /><p className="sr-only">{diningFeature}. Contact management for arrangements.</p></figure>}
      <figure data-reveal><Image src={beachfrontPool} alt="A private plunge pool beside the coast at Seabliss" fill placeholder="blur" sizes="(min-width: 1440px) 290px, (min-width: 900px) 22vw, (min-width: 600px) 30vw, 85vw" /><figcaption><Waves size={24} strokeWidth={1} aria-hidden="true" /><h3>{privatePools ? 'Private Pools' : 'Coastal Views'}</h3></figcaption><Link href="/experiences" className="public-experience-link" aria-label="Explore Pools and Coastal Views" /></figure>
    </div>
  </div></section>
}

export function PrivateGatherings({ reservationHref }: { reservationHref: string }) {
  return <section id="gatherings" className="public-gatherings">
    <div className="public-gatherings-image"><Image src={gathering} alt="A Seabliss villa lounge opening toward the pool and sea" fill placeholder="blur" sizes="(min-width: 768px) 50vw, 100vw" /></div>
    <div className="public-gatherings-copy" data-reveal><p className="public-eyebrow">PRIVATE GATHERINGS</p><h2>Your Own Coastal Estate</h2><p>Bring your favourite people together at Seabliss. Speak with our team about family reunions, private gatherings, and estate buyout possibilities by the sea.</p><a href={reservationHref} className="public-button">Inquire About a Private Buyout <ArrowRight size={18} aria-hidden="true" /></a></div>
  </section>
}

export function ReservationCTA({ reservationHref }: { reservationHref: string }) {
  return <section className="public-reservation" aria-labelledby="reservation-heading">
    <Image src={seaView} alt="The coastal waters beyond the Seabliss beachfront" fill placeholder="blur" sizes="100vw" />
    <div className="public-reservation-shade" />
    <div className="public-container public-reservation-copy" data-reveal><p className="public-eyebrow">READY FOR A COASTAL ESCAPE?</p><h2 id="reservation-heading">Reserve Your Stay at Seabliss</h2><p>Experience the comfort, privacy, and coastal beauty of Seabliss Beach Resort.</p><a href={reservationHref} className="public-button"><CalendarDays size={17} aria-hidden="true" />Reserve Your Stay</a><span>Management will contact you to finalize accommodation arrangements.</span></div>
  </section>
}
