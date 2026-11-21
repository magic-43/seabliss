import Link from 'next/link'
import Image from 'next/image'
import { Waves, WavesLadder, Home, ShieldCheck, ArrowRight, Sun } from 'lucide-react'
import { getPublicResortData } from '@/lib/public/data'
import { publicMetadata } from '@/lib/public/metadata'
import Reveal from '@/components/public/reveal'

export const metadata = publicMetadata(
  'Experiences & Atmosphere',
  'Discover the beachfront atmosphere, private plunge pools, and verified resort amenities at Seabliss Beach Resort in Lian, Batangas.',
  '/experiences'
)

export default async function ExperiencesPage() {
  const { rooms } = await getPublicResortData()
  const privatePools = rooms?.some((room) => room.has_plunge_pool)

  return (
    <main id="public-content" tabIndex={-1} className="public-experiences-page">
      {/* 1. Photographic introduction hero with authentic clean photograph */}
      <section className="public-page-hero" aria-labelledby="experiences-hero-title">
        <Image
          src="/images/beach_aerial/seabliss_shoreline.jpg"
          alt="Shoreline and ocean waters at Seabliss Beach Resort in Lian, Batangas"
          fill
          priority
          sizes="100vw"
          className="public-page-hero-image"
        />
        <div className="public-page-hero-shade" />
        <div className="public-container public-page-hero-content text-center">
          <Reveal>
            <span className="public-eyebrow public-hero-eyebrow">
              COASTAL LIVING · LIAN, BATANGAS
            </span>
            <h1 id="experiences-hero-title" className="public-page-hero-title">
              Experiences &amp; Atmosphere
            </h1>
            <p className="public-page-hero-subtitle">
              Gentle ocean tides, private plunge pools, and unhurried days along the Batangas coast.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="public-container public-experiences-body">
        {/* 2. Short editorial overview */}
        <section className="public-experiences-intro-section text-center" aria-labelledby="exp-intro-title">
          <Reveal>
            <span className="public-eyebrow">A SLOWER PACE</span>
            <h2 id="exp-intro-title" className="public-section-title">
              Naturally Composed for Rest
            </h2>
            <p className="public-editorial-intro">
              At Seabliss, the guest experience is defined by the open beauty of the coastline and the privacy of your own retreat. Without crowds or rigid schedules, you are free to enjoy early morning walks on the sand, refreshing dips in the pool, and quiet evenings as the sun dips below the ocean horizon.
            </p>
          </Reveal>
        </section>

        {/* 3. Well-spaced, verified amenity groupings */}
        <section className="public-amenity-groups-section" aria-labelledby="amenities-title">
          <Reveal>
            <div className="public-section-head text-center">
              <span className="public-eyebrow">CURATED RESORT AMENITIES</span>
              <h2 id="amenities-title" className="public-section-title">
                Comfort Across Every Stay
              </h2>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="public-amenity-groups-grid">
              <div className="public-amenity-group-card">
                <div className="public-amenity-icon-box" aria-hidden="true">
                  <Waves size={24} />
                </div>
                <h3>Beachfront Ocean Access</h3>
                <p>
                  Direct steps to the Lian shoreline with soft sandy stretches and gentle tides. Perfect for quiet morning strolls, shoreline dipping, and listening to the waves.
                </p>
              </div>

              <div className="public-amenity-group-card">
                <div className="public-amenity-icon-box" aria-hidden="true">
                  <WavesLadder size={24} />
                </div>
                <h3>Swimming &amp; Plunge Pools</h3>
                <p>
                  Enjoy refreshing swims in the resort pool facilities{privatePools ? ', or choose one of our select villas featuring private plunge pools for exclusive use.' : '.'}
                </p>
              </div>

              <div className="public-amenity-group-card">
                <div className="public-amenity-icon-box" aria-hidden="true">
                  <Home size={24} />
                </div>
                <h3>Spacious Group Living</h3>
                <p>
                  Generous villa lounges, shaded ocean-view verandas, and expansive outdoor dining spots designed for relaxing together and enjoying quality company.
                </p>
              </div>

              <div className="public-amenity-group-card">
                <div className="public-amenity-icon-box" aria-hidden="true">
                  <ShieldCheck size={24} />
                </div>
                <h3>Resort Support &amp; Essentials</h3>
                <p>
                  Fully air-conditioned bedrooms, complimentary high-speed Wi-Fi throughout, secure on-site vehicle parking, and dedicated housekeeping care.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* 4. Substantial varied photo mosaic / bento grid */}
        <section className="public-bento-section" aria-labelledby="bento-title">
          <Reveal>
            <div className="public-section-head text-center">
              <span className="public-eyebrow">ATMOSPHERE &amp; GROUNDS</span>
              <h2 id="bento-title" className="public-section-title">
                Coastal Moments
              </h2>
              <p className="public-section-subhead">
                Authentic glimpses of the shoreline, villa grounds, and tranquil waters of Seabliss.
              </p>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="public-bento-grid">
            {/* Cell 1: Large feature pool overlook (span 2 cols, 2 rows on desktop) */}
            <div className="public-bento-item public-bento-large">
              <Image
                src="/images/pools/plunge_pool_overlook.jpg"
                alt="Plunge pool overlooking the ocean"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            {/* Cell 2: Beach direct access */}
            <div className="public-bento-item">
              <Image
                src="/images/beach_aerial/beach_direct_access.png"
                alt="Direct beach access from resort grounds"
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Cell 3: Coastal walkway */}
            <div className="public-bento-item">
              <Image
                src="/images/villas/villa_coastal_walkway.jpg"
                alt="Coastal walkway lined with coconut trees"
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Cell 4: Shoreline */}
            <div className="public-bento-item">
              <Image
                src="/images/beach_aerial/seabliss_shoreline.jpg"
                alt="Seabliss beach shoreline"
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Cell 5: Villa lounge living (span 2 cols) */}
            <div className="public-bento-item public-bento-wide">
              <Image
                src="/images/interiors/villa_lounge_living.jpg"
                alt="Spacious villa living room and lounge"
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            {/* Cell 6: Bedroom comfort */}
            <div className="public-bento-item">
              <Image
                src="/images/interiors/interior_suite_bedroom.jpg"
                alt="Comfortable air-conditioned suite bedroom"
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover"
              />
            </div>

            {/* Cell 7: Villa exterior view */}
            <div className="public-bento-item">
              <Image
                src="/images/villas/villa_3_view.png"
                alt="Scenic exterior view of Seabliss villas"
                fill
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
          </Reveal>
        </section>

        {/* 5. One focused photographic feature with authentic sunset photo */}
        <section className="public-focus-feature-section" aria-labelledby="focus-feature-title">
          <Reveal>
            <div className="public-focus-feature-grid">
              <div className="public-focus-feature-media">
                <Image
                  src="/images/rooms/villa-4/villa-4-7.jpg"
                  alt="Sunset view overlooking the pool terrace and ocean at Seabliss Beach Resort"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="public-focus-feature-copy">
                <div className="public-focus-icon-wrap" aria-hidden="true">
                  <Sun size={24} />
                </div>
                <span className="public-eyebrow">EVENING BY THE WATER</span>
                <h2 id="focus-feature-title" className="public-section-title">
                  Golden Hour on the Batangas Coast
                </h2>
                <p>
                  As late afternoon approaches, the western horizon over Lian lights up in brilliant amber and gold. Watch the sunset directly from your beachfront veranda, take an evening dip in the ocean, or gather by the poolside deck as night settles over the resort.
                </p>
                <div className="public-focus-actions">
                  <Link href="/rooms" className="public-button public-button-teal">
                    <span>Explore Accommodations</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                  <Link href="/dining" className="public-text-link">
                    Learn About Dining
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* 6. Closing invitation */}
        <section className="public-experiences-closing-card text-center" aria-labelledby="exp-closing-title">
          <Reveal>
            <span className="public-eyebrow">YOUR STAY AT SEABLISS</span>
            <h2 id="exp-closing-title" className="public-invite-heading">
              Experience Unhurried Coastal Living
            </h2>
            <p className="public-invite-subhead">
              Reserve your preferred dates online or speak with our concierge team about planning your stay.
            </p>
            <div className="public-invite-actions">
              <Link href="/reserve" className="public-button public-button-teal">
                <span>Reserve Your Stay</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/contact" className="public-button public-button-outline">
                Contact Concierge
              </Link>
            </div>
          </Reveal>
        </section>
      </div>
    </main>
  )
}
