import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Wifi, Snowflake, Waves, Coffee, ShieldCheck, ArrowRight, WavesLadder } from 'lucide-react'
import { getPublicResortData } from '@/lib/public/data'
import { publicMetadata } from '@/lib/public/metadata'
import RoomsDirectory from '@/components/public/rooms-directory'
import RoomsSkeleton from '@/components/public/rooms-skeleton'
import Reveal from '@/components/public/reveal'

export const metadata = publicMetadata(
  'Our Accommodations',
  'Browse beachfront villas and serene coastal suites at Seabliss Beach Resort in Lian, Batangas. Real room details, current rates, and verified inclusions.',
  '/rooms'
)

async function RoomsDirectoryStream() {
  const { rooms } = await getPublicResortData()
  if (!rooms) throw new Error('Accommodation information is temporarily unavailable.')
  return <RoomsDirectory rooms={rooms} />
}

export default function RoomsPage() {
  return (
    <main id="public-content" tabIndex={-1} className="public-rooms-page">
      {/* 1. Photographic hero with restrained centered copy */}
      <section className="public-page-hero" aria-labelledby="rooms-hero-title">
        <Image
          src="/images/beach_aerial/beach_direct_access.png"
          alt="Direct beach access and coastline at Seabliss Beach Resort"
          fill
          priority
          sizes="100vw"
          className="public-page-hero-image"
        />
        <div className="public-page-hero-shade" />
        <div className="public-container public-page-hero-content text-center">
          <Reveal>
            <span className="public-eyebrow public-hero-eyebrow">
              STAY BY THE COAST · LIAN, BATANGAS
            </span>
            <h1 id="rooms-hero-title" className="public-page-hero-title">
              Find a space made for slowing down.
            </h1>
            <p className="public-page-hero-subtitle">
              Choose from real resort accommodations designed for couples, families, and group stays on the shores of Batangas.
            </p>
          </Reveal>
        </div>
      </section>

      {/* 2. Editorial introduction beside verified shared inclusions (no redundant stats) */}
      <section className="public-rooms-intro-section" aria-labelledby="rooms-intro-title">
        <div className="public-container public-rooms-intro-grid">
          <Reveal className="public-rooms-intro-editorial">
            <div className="public-intro-eyebrow-line">
              <span className="public-intro-line" aria-hidden="true" />
              <span className="public-eyebrow">COASTAL SANCTUARIES · LIAN, BATANGAS</span>
            </div>
            <h2 id="rooms-intro-title" className="public-intro-heading">
              Thoughtfully composed spaces <br />
              <span className="public-heading-italic">at the edge of the sea.</span>
            </h2>
            <div className="public-intro-body">
              <p>
                Every stay at Seabliss brings together generous rooms or villas, beachfront ocean access, dedicated resort support, and a quieter pace by the water in Lian, Batangas.
              </p>
              <p>
                From beachfront suites to spacious private villas, each accommodation features included guest allowances, verified bed configurations, and private ensuite comforts.
              </p>
            </div>
            <div className="public-intro-amenity-row">
              <div className="public-intro-amenity-tag">
                <Wifi size={16} aria-hidden="true" />
                <span>Complimentary Wi-Fi</span>
              </div>
              <div className="public-intro-amenity-tag">
                <Snowflake size={16} aria-hidden="true" />
                <span>Air-Conditioned</span>
              </div>
              <div className="public-intro-amenity-tag">
                <WavesLadder size={16} aria-hidden="true" />
                <span>Beach & Pool Access</span>
              </div>
              <div className="public-intro-amenity-tag">
                <ShieldCheck size={16} aria-hidden="true" />
                <span>Resort Concierge</span>
              </div>
            </div>
          </Reveal>

          <Reveal delay={150} className="public-rooms-inclusions-mosaic">
            <div className="public-inclusions-card-grid">
              <div className="public-inclusion-card">
                <Waves className="public-inclusion-icon" aria-hidden="true" />
                <h3>Beachfront Access</h3>
                <p>Direct shoreline access, gentle tides, and panoramic ocean vistas right outside.</p>
              </div>
              <div className="public-inclusion-card">
                <WavesLadder className="public-inclusion-icon" aria-hidden="true" />
                <h3>Swimming & Plunge Pools</h3>
                <p>Use of resort swimming pools and select private villa plunge pools.</p>
              </div>
              <div className="public-inclusion-card">
                <Wifi className="public-inclusion-icon" aria-hidden="true" />
                <h3>High-Speed Wi-Fi</h3>
                <p>Complimentary wireless internet available across all rooms and grounds.</p>
              </div>
              <div className="public-inclusion-card">
                <Coffee className="public-inclusion-icon" aria-hidden="true" />
                <h3>Dining Inclusions</h3>
                <p>Breakfast and dining features included on select featured stays.</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. Vertical room directory with large photography (Option B: Left-aligned with subtle tabs) */}
      <section className="public-rooms-directory-section" aria-label="Accommodation directory">
        <div className="public-container">
          <Reveal>
            <div className="public-rooms-directory-head">
              <div className="public-intro-eyebrow-line">
                <span className="public-intro-line" aria-hidden="true" />
                <span className="public-eyebrow">CHOOSE YOUR ACCOMMODATION</span>
              </div>
              <h2 className="public-rooms-directory-title">All Rooms & Villas</h2>
              <p className="public-rooms-directory-subhead">
                Compare capacities, beds, and nightly rates for each individual accommodation.
              </p>
            </div>
          </Reveal>
          <Suspense fallback={<RoomsSkeleton />}>
            <RoomsDirectoryStream />
          </Suspense>
        </div>
      </section>

      {/* 4. Private-group inquiry invitation (Split banner) */}
      <section className="public-group-inquiry-section" aria-labelledby="group-inquiry-title">
        <Reveal>
          <div className="public-group-inquiry-split">
            <div className="public-group-inquiry-media">
              <Image
                src="/images/rooms/villa-4/villa-4-2.jpg"
                alt="Villa lounge and poolside terrace for group gatherings at Seabliss"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
            <div className="public-group-inquiry-copy">
              <span className="public-eyebrow">SPECIAL ARRANGEMENTS</span>
              <h2 id="group-inquiry-title">Planning a larger gathering or private escape?</h2>
              <p>
                Family reunions, celebrations, and corporate retreats fit naturally at Seabliss. With multiple large villas, private plunge pools, and estate buyout possibilities, our team helps customize your stay.
              </p>
              <Link href="/private-gatherings" className="public-button public-button-light">
                <span>Explore Private Gatherings</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 5. Closing reservation/contact invitation */}
      <section className="public-rooms-cta-section text-center" aria-labelledby="rooms-cta-title">
        <div className="public-container">
          <Reveal>
            <h2 id="rooms-cta-title">Your room by the coast is waiting.</h2>
            <p className="public-cta-subhead">
              Reserve your preferred dates online or speak with our concierge team.
            </p>
            <div className="public-cta-actions">
              <Link href="/reserve" className="public-button public-button-gold">
                <span>Reserve Your Stay</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/contact" className="public-button public-button-outline">
                Speak With Our Team
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  )
}
