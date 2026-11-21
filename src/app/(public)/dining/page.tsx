import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, Info, ArrowRight, Coffee } from 'lucide-react'
import { getPublicResortData } from '@/lib/public/data'
import { getContactLinks } from '@/lib/public/content'
import { publicMetadata } from '@/lib/public/metadata'
import Reveal from '@/components/public/reveal'

export const metadata = publicMetadata(
  'Dining',
  'Explore verified dining arrangements, meal inclusions, and seaside dining features across Seabliss accommodations in Lian, Batangas.',
  '/dining'
)

export default async function DiningPage() {
  const { rooms, settings } = await getPublicResortData()
  const diningRooms = rooms?.filter((room) =>
    room.features.some((feature) => /breakfast|dinner|dining|meal/i.test(feature))
  ) || []

  const verifiedInclusions = [
    ...new Set(
      diningRooms.flatMap((room) =>
        room.features.filter((feature) => /breakfast|dinner|dining|meal/i.test(feature))
      )
    ),
  ]

  const contact = getContactLinks(settings)

  return (
    <main id="public-content" tabIndex={-1} className="public-dining-page">
      {/* 1. Photographic cover hero */}
      <section className="public-page-hero" aria-labelledby="dining-hero-title">
        <Image
          src="/images/rooms/villa-4/villa-4-6.jpg"
          alt="Villa dining and kitchen area at Seabliss Beach Resort"
          fill
          priority
          sizes="100vw"
          className="public-page-hero-image"
        />
        <div className="public-page-hero-shade" />
        <div className="public-container public-page-hero-content text-center">
          <Reveal>
            <span className="public-eyebrow public-hero-eyebrow">
              DINING AT SEABLISS · LIAN, BATANGAS
            </span>
            <h1 id="dining-hero-title" className="public-page-hero-title">
              Seaside Dining &amp; Shared Meals
            </h1>
            <p className="public-page-hero-subtitle">
              Relaxed dining by the water, where wholesome meals, generous tables, and coastal breezes bring your favorite people together.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="public-container public-dining-body">
        {/* 2. Concise introduction */}
        <section className="public-dining-intro-section text-center" aria-labelledby="dining-intro-heading">
          <Reveal>
            <span className="public-eyebrow">TIME AT THE TABLE</span>
            <h2 id="dining-intro-heading" className="public-section-title">
              Unhurried Meals by the Shore
            </h2>
            <p className="public-editorial-intro">
              At Seabliss, dining is rooted in ease and togetherness. Whether sharing breakfast on your veranda, enjoying dinner after swimming in the ocean, or gathering with family in a private villa dining space, our resort accommodations are designed to make meal times effortless and memorable.
            </p>
          </Reveal>
        </section>

        {/* 3. Substantial photograph-led dining/inclusion feature */}
        <section className="public-dining-feature-section" aria-labelledby="dining-feature-title">
          <Reveal>
            <div className="public-dining-feature-grid">
              <div className="public-dining-feature-media">
                <Image
                  src="/images/rooms/villa-4/villa-4-6.jpg"
                  alt="Seabliss private villa kitchen and spacious dining setup"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>

              <div className="public-dining-feature-copy">
                <span className="public-eyebrow">ACCOMMODATION INCLUSIONS</span>
                <h2 id="dining-feature-title" className="public-section-title">
                  Verified Dining Arrangements
                </h2>
                <p>
                  Select accommodations at Seabliss include verified dining arrangements as part of your stay. These inclusions are confirmed per room category:
                </p>

                {verifiedInclusions.length > 0 ? (
                  <ul className="public-dining-inclusions-list" aria-label="Dining inclusions">
                    {verifiedInclusions.map((item) => (
                      <li key={item}>
                        <CheckCircle size={18} className="public-inclusion-check" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="public-policy-note">
                    Please speak with management for current dining arrangements applicable to your stay.
                  </p>
                )}

                {diningRooms.length > 0 && (
                  <div className="public-dining-rooms-strip">
                    <span className="public-strip-label">Accommodations with dining features:</span>
                    <div className="public-dining-rooms-pills">
                      {diningRooms.map((room) => (
                        <Link
                          key={room.id}
                          href={'/rooms/' + encodeURIComponent(room.slug)}
                          className="public-dining-room-pill"
                        >
                          <Coffee size={13} aria-hidden="true" />
                          <span>{room.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </section>

        {/* 4. Clearly separated information panel */}
        <section className="public-dining-panel-section" aria-labelledby="dining-mgmt-title">
          <Reveal>
            <div className="public-dining-info-panel">
              <div className="public-panel-icon-wrap" aria-hidden="true">
                <Info size={24} />
              </div>
              <div className="public-panel-copy">
                <h3 id="dining-mgmt-title">Planning Your Meals with Management</h3>
                <p>
                  Specific meal schedules, seasonal dishes, dietary preferences, and group dining arrangements are confirmed directly with our resort management team. To ensure seamless coordination for your stay, please contact us with your group’s preferences prior to arrival.
                </p>
                <div className="public-panel-actions">
                  <a href={contact.management} className="public-button public-button-teal">
                    <span>Speak with Management</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                  <Link href="/contact" className="public-button public-button-outline">
                    Contact Information
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* 5. Supporting atmosphere photographs */}
        <section className="public-dining-atmosphere-section" aria-labelledby="atmosphere-title">
          <Reveal>
            <div className="public-section-head text-center">
              <span className="public-eyebrow">ATMOSPHERE</span>
              <h2 id="atmosphere-title" className="public-section-title">
                Moments by the Coast
              </h2>
              <p className="public-section-subhead">
                Authentic glimpses of dining and living spaces across our beachfront resort.
              </p>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="public-dining-atmosphere-grid">
              <div className="public-atmosphere-card">
                <div className="public-atmosphere-media">
                  <Image
                    src="/images/rooms/villa-1/villa-1-7.jpg"
                    alt="Villa interior and dining spaces"
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <span className="public-atmosphere-caption">Villa Dining Spaces</span>
              </div>

              <div className="public-atmosphere-card">
                <div className="public-atmosphere-media">
                  <Image
                    src="/images/rooms/villa-4/villa-4-2.jpg"
                    alt="Poolside terrace and lounge"
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <span className="public-atmosphere-caption">Poolside Lounging &amp; Verandas</span>
              </div>

              <div className="public-atmosphere-card">
                <div className="public-atmosphere-media">
                  <Image
                    src="/images/rooms/villa-4/villa-4-7.jpg"
                    alt="Sunset over the Lian coastline and pool terrace"
                    fill
                    sizes="(min-width: 1024px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <span className="public-atmosphere-caption">Seaside Sunset Backdrop</span>
              </div>
            </div>
          </Reveal>
        </section>

        {/* 6. Closing invitation */}
        <section className="public-dining-closing-card text-center" aria-labelledby="dining-close-title">
          <Reveal>
            <span className="public-eyebrow">YOUR STAY AT SEABLISS</span>
            <h2 id="dining-close-title" className="public-invite-heading">
              Find the Accommodation for Your Table
            </h2>
            <p className="public-invite-subhead">
              Explore our beachfront villas and suites to discover the perfect setting for your group.
            </p>
            <div className="public-invite-actions">
              <Link href="/rooms" className="public-button public-button-teal">
                <span>Explore Accommodations</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/reserve" className="public-button public-button-outline">
                Request a Stay
              </Link>
            </div>
          </Reveal>
        </section>
      </div>
    </main>
  )
}
