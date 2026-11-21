import Link from 'next/link'
import Image from 'next/image'
import { WavesLadder, Waves, HeartHandshake, ArrowRight } from 'lucide-react'
import { getPublicResortData } from '@/lib/public/data'
import { publicMetadata } from '@/lib/public/metadata'
import Reveal from '@/components/public/reveal'

export const metadata = publicMetadata(
  'Our Story',
  'Discover Seabliss Beach Resort — a tranquil beachfront haven in Lian, Batangas, designed for quiet escapes, family gatherings, and unhurried coastal living.',
  '/about'
)

export default async function AboutPage() {
  const { settings, rooms } = await getPublicResortData()
  const address = settings?.address?.trim() || 'Lian, Batangas, Philippines'

  return (
    <main id="public-content" tabIndex={-1} className="public-about-page">
      {/* 1. Photographic cover hero with clean authentic photograph */}
      <section className="public-page-hero" aria-labelledby="about-hero-title">
        <Image
          src="/images/rooms/villa-4/villa-4-1.jpg"
          alt="Beachfront villa and coastline at Seabliss Beach Resort in Lian, Batangas"
          fill
          priority
          sizes="100vw"
          className="public-page-hero-image"
        />
        <div className="public-page-hero-shade" />
        <div className="public-container public-page-hero-content text-center">
          <Reveal>
            <span className="public-eyebrow public-hero-eyebrow">
              OUR STORY · LIAN, BATANGAS
            </span>
            <h1 id="about-hero-title" className="public-page-hero-title">
              A Coastal Sanctuary by the Sea
            </h1>
            <p className="public-page-hero-subtitle">
              Where gentle ocean breezes, spacious villas, and warm Filipino hospitality come together for unhurried rest.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="public-container public-about-body">
        {/* 2. Story text beside a staggered two-image composition */}
        <section className="public-about-story-section" aria-labelledby="about-story-title">
          <Reveal>
            <div className="public-about-story-grid">
              <div className="public-about-story-copy">
                <span className="public-eyebrow">COASTAL HERITAGE</span>
                <h2 id="about-story-title" className="public-section-title">
                  A Place for Meaningful Escapes
                </h2>
                <div className="public-editorial-text">
                  <p>
                    Perched along the peaceful shores of <strong>{address}</strong>, Seabliss Beach Resort was created with a clear intention: to offer a private seaside haven where families, couples, and friends can leave the bustle behind and breathe fresh ocean air.
                  </p>
                  <p>
                    Surrounded by open waters and coastal skies, our property pairs comfortable living with authentic resort hospitality. From our private beachfront villas and scenic suites to select plunge pools and ocean-facing verandas, every corner of Seabliss is crafted to encourage rest, privacy, and connection.
                  </p>
                  {rooms && rooms.length > 0 && (
                    <p className="public-highlight-text">
                      Today, our collection includes {rooms.length} active accommodations, each featuring verified specifications and dedicated on-site support.
                    </p>
                  )}
                </div>
              </div>

              <div className="public-about-staggered-media">
                <div className="public-stagger-item public-stagger-primary">
                  <Image
                    src="/images/villas/villa_coastal_walkway.jpg"
                    alt="Coastal walkway lined with palm trees at Seabliss"
                    fill
                    sizes="(min-width: 1024px) 28vw, 45vw"
                    className="object-cover"
                  />
                </div>
                <div className="public-stagger-item public-stagger-secondary">
                  <Image
                    src="/images/beach_aerial/seabliss_shoreline.jpg"
                    alt="Gentle shoreline and coastline at Seabliss"
                    fill
                    sizes="(min-width: 1024px) 28vw, 45vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* 3. Three concise, factual property themes */}
        <section className="public-about-themes-section" aria-labelledby="about-themes-title">
          <Reveal>
            <div className="public-section-head text-center">
              <span className="public-eyebrow">THE SEABLISS EXPERIENCE</span>
              <h2 id="about-themes-title" className="public-section-title">
                What Shapes Your Stay
              </h2>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="public-themes-grid">
              <div className="public-theme-card">
                <div className="public-theme-icon-wrap" aria-hidden="true">
                  <Waves size={24} />
                </div>
                <h3>Beachfront Serenity</h3>
                <p>
                  Direct ocean access along the Lian coastline, providing soothing soundscapes, gentle coastal tides, and unhindered horizon views every day.
                </p>
              </div>

              <div className="public-theme-card">
                <div className="public-theme-icon-wrap" aria-hidden="true">
                  <WavesLadder size={24} />
                </div>
                <h3>Private Sanctuaries</h3>
                <p>
                  Generous villas and suites designed for groups, families, and couples, featuring private plunge pools, ensuite comfort, and uncrowded spaces.
                </p>
              </div>

              <div className="public-theme-card">
                <div className="public-theme-icon-wrap" aria-hidden="true">
                  <HeartHandshake size={24} />
                </div>
                <h3>Warm Seaside Hospitality</h3>
                <p>
                  Our on-site team provides thoughtful assistance, verified arrangements, and personalized care from your initial request through check-out.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* 4. Photographic "explore the resort" section */}
        <section className="public-explore-grounds-section" aria-labelledby="explore-grounds-title">
          <Reveal>
            <div className="public-explore-grounds-header">
              <div>
                <span className="public-eyebrow">EXPLORE THE GROUNDS</span>
                <h2 id="explore-grounds-title" className="public-section-title">
                  A Glimpse Into Coastal Living
                </h2>
              </div>
              <Link href="/rooms" className="public-text-link">
                <span>View Accommodations</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="public-grounds-grid">
              <Link href="/rooms" className="public-grounds-card" aria-label="Explore villas and suites">
                <div className="public-grounds-media">
                  <Image
                    src="/images/villas/villa_1_exterior.jpg"
                    alt="Beachfront villa exterior at Seabliss"
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                  />
                  <div className="public-grounds-overlay" />
                  <span className="public-grounds-title">Villas &amp; Coastal Suites</span>
                </div>
              </Link>

              <Link href="/experiences" className="public-grounds-card" aria-label="Explore beach and shoreline">
                <div className="public-grounds-media">
                  <Image
                    src="/images/beach_aerial/beach_direct_access.png"
                    alt="Direct beach access and coastline"
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                  />
                  <div className="public-grounds-overlay" />
                  <span className="public-grounds-title">Beach &amp; Coastline</span>
                </div>
              </Link>

              <Link href="/experiences" className="public-grounds-card" aria-label="Explore pools and relaxation">
                <div className="public-grounds-media">
                  <Image
                    src="/images/pools/plunge_pool_overlook.jpg"
                    alt="Private plunge pool overlooking the coast"
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                  />
                  <div className="public-grounds-overlay" />
                  <span className="public-grounds-title">Pools &amp; Relaxation</span>
                </div>
              </Link>
            </div>
          </Reveal>
        </section>

        {/* 5. Closing invitation linking to accommodations and contact */}
        <section className="public-about-invitation-card" aria-labelledby="about-invite-title">
          <Reveal>
            <div className="public-about-invite-content text-center">
              <span className="public-eyebrow">YOUR COASTAL RETREAT</span>
              <h2 id="about-invite-title" className="public-invite-heading">
                Ready to Experience Seabliss?
              </h2>
              <p className="public-invite-subhead">
                Whether for a quiet couple&apos;s getaway, a festive family gathering, or a private coastal retreat, our team is ready to welcome you.
              </p>
              <div className="public-invite-actions">
                <Link href="/rooms" className="public-button public-button-teal">
                  <span>Explore Accommodations</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <Link href="/contact" className="public-button public-button-outline">
                  Contact Concierge
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </main>
  )
}
