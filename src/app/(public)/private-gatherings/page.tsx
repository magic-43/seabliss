import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ArrowDown } from 'lucide-react'
import BuyoutInquiryForm from '@/components/public/buyout-inquiry-form'
import { getPublicResortData } from '@/lib/public/data'
import { getContactLinks } from '@/lib/public/content'
import { publicMetadata } from '@/lib/public/metadata'
import Reveal from '@/components/public/reveal'

export const metadata = publicMetadata(
  'Private Gatherings & Celebrations',
  'Plan private gatherings, intimate celebrations, family reunions, and coastal estate buyout possibilities at Seabliss Beach Resort in Lian, Batangas.',
  '/private-gatherings'
)

const GATHERING_TYPES = [
  {
    title: 'Family Reunions & Multi-Gen Escapes',
    tag: 'Large Family Groups',
    image: '/images/gatherings/family-reunion.jpg',
    description:
      'Multiple adjoining beachfront villas, private plunge pools, and spacious indoor-outdoor lounges give your family plenty of room to celebrate together while keeping personal space.',
  },
  {
    title: 'Intimate Celebrations & Milestones',
    tag: 'Birthdays & Anniversaries',
    image: '/images/gatherings/celebration-anniversary.jpg',
    description:
      'Mark special life chapters against the golden sunsets of Lian, Batangas. Oceanfront verandas and secluded grounds create an authentic, relaxed setting for unforgettable memories.',
  },
  {
    title: 'Exclusive Estate Buyouts & Retreats',
    tag: 'Exclusive Property Buyout',
    image: '/images/rooms/villa-4/villa-4-1.jpg',
    description:
      'Reserve the entire resort grounds exclusively for your group. Enjoy full privacy across all villas, private swimming pools, and direct beachfront access without outside guests.',
  },
]

export default async function PrivateGatheringsPage() {
  const { settings } = await getPublicResortData()
  const contact = getContactLinks(settings)

  return (
    <main id="public-content" tabIndex={-1} className="public-buyouts-page">
      {/* 1. Photographic hero and inquiry anchor */}
      <section className="public-page-hero" aria-labelledby="gatherings-hero-title">
        <Image
          src="/images/rooms/villa-4/villa-4-2.jpg"
          alt="Villa lounge opening to pool and ocean at Seabliss"
          fill
          priority
          sizes="100vw"
          className="public-page-hero-image"
        />
        <div className="public-page-hero-shade" />
        <div className="public-container public-page-hero-content text-center">
          <Reveal>
            <span className="public-eyebrow public-hero-eyebrow">
              EXCLUSIVE RETREATS · LIAN, BATANGAS
            </span>
            <h1 id="gatherings-hero-title" className="public-page-hero-title">
              Your Own Coastal Estate
            </h1>
            <p className="public-page-hero-subtitle">
              Private gatherings, family reunions, and exclusive buyout possibilities on the shores of Lian, Batangas.
            </p>
            <div className="public-hero-anchor-actions">
              <a href="#inquiry-form" className="public-button public-button-teal">
                <span>Inquire About Your Gathering</span>
                <ArrowDown size={16} aria-hidden="true" />
              </a>
              <a href="#process" className="public-button public-button-outline">
                How It Works
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      <div className="public-container public-buyouts-body">
        {/* 2. Editorial introduction */}
        <section className="public-buyouts-intro-section text-center" aria-labelledby="gatherings-intro-title">
          <Reveal>
            <span className="public-eyebrow">TIME AWAY, TOGETHER</span>
            <h2 id="gatherings-intro-title" className="public-section-title">
              Gather Close to the Coast
            </h2>
            <p className="public-editorial-intro">
              Seabliss Beach Resort provides an intimate, tranquil backdrop for life’s most meaningful occasions. With spacious private villas, direct beachfront access, and peaceful open grounds, our retreat allows your group to spend quality time together without outside distractions.
            </p>
          </Reveal>
        </section>

        {/* 3. Purposeful gathering types (replaces repetitive card layout) */}
        <section className="public-gatherings-types-section" aria-labelledby="types-title">
          <Reveal>
            <div className="public-section-head text-center">
              <span className="public-eyebrow">GATHERING INSPIRATION</span>
              <h2 id="types-title" className="public-section-title">
                Occasions Made for Seabliss
              </h2>
              <p className="public-section-subhead">
                Tailored accommodations and grounds suited for groups of varying sizes and occasions.
              </p>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="public-gathering-types-grid">
              {GATHERING_TYPES.map((type) => (
                <article key={type.title} className="public-gathering-type-card">
                  <div className="public-gathering-type-media">
                    <Image
                      src={type.image}
                      alt={type.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover"
                    />
                    <span className="public-gathering-type-badge">{type.tag}</span>
                  </div>
                  <div className="public-gathering-type-body">
                    <h3>{type.title}</h3>
                    <p>{type.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </section>

        {/* 4. Three clear inquiry/process points */}
        <section id="process" className="public-buyouts-process-section" aria-labelledby="process-title">
          <Reveal>
            <div className="public-section-head text-center">
              <span className="public-eyebrow">HOW GATHERINGS WORK</span>
              <h2 id="process-title" className="public-section-title">
                Our Inquiry &amp; Planning Process
              </h2>
              <p className="public-section-subhead">
                We coordinate each private gathering thoughtfully to ensure the resort fits your group.
              </p>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="public-process-steps-grid">
              <div className="public-process-step-card">
                <div className="public-step-number" aria-hidden="true">
                  1
                </div>
                <h3>Share Your Vision</h3>
                <p>
                  Submit the inquiry form below with your tentative dates, estimated guest count, and the type of gathering you have in mind.
                </p>
              </div>

              <div className="public-process-step-card">
                <div className="public-step-number" aria-hidden="true">
                  2
                </div>
                <h3>Management Consultation</h3>
                <p>
                  Our team reviews date suitability, accommodation combinations, and custom arrangements, then contacts you directly to discuss options.
                </p>
              </div>

              <div className="public-process-step-card">
                <div className="public-step-number" aria-hidden="true">
                  3
                </div>
                <h3>Finalize Arrangements</h3>
                <p>
                  Once mutually agreed, management finalizes your stay details, payment arrangements, and arrival logistics for your group.
                </p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* 5. Atmospheric photography and supporting explanation */}
        <section className="public-buyout-tailored-section" aria-labelledby="tailored-title">
          <Reveal>
            <div className="public-buyout-tailored-grid">
              <div className="public-buyout-tailored-media">
                <Image
                  src="/images/villas/villa_1_exterior.jpg"
                  alt="Beachfront villa exterior and private grounds at Seabliss"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              <div className="public-buyout-tailored-copy">
                <span className="public-eyebrow">CUSTOM ARRANGEMENTS</span>
                <h2 id="tailored-title" className="public-section-title">
                  Tailored Specifically to Your Group
                </h2>
                <p>
                  Every gathering has its own rhythm. Rather than imposing rigid, generic event packages, Seabliss works directly with you to understand your specific needs.
                </p>
                <p>
                  Whether you need multiple adjacent villas for an extended family stay or wish to discuss an exclusive resort buyout, management confirms suitability, room assignments, and applicable rates directly.
                </p>
                <div className="public-truthful-box">
                  <p>
                    <strong>Please Note:</strong> Submitting an inquiry does not guarantee exclusive-use arrangements, dates, or prices. All event and buyout arrangements are subject to management review and confirmation.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* 6. The functional inquiry form */}
        <section id="inquiry-form" className="public-buyout-form-section" aria-labelledby="inquiry-form-title">
          <Reveal>
            <div className="public-section-head text-center">
              <span className="public-eyebrow">START THE CONVERSATION</span>
              <h2 id="inquiry-form-title" className="public-section-title">
                Inquire About Your Gathering
              </h2>
              <p className="public-section-subhead">
                Fill in your details and our management team will reach out to discuss possibilities.
              </p>
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div className="public-buyout-form-wrapper">
              <BuyoutInquiryForm contactHref={contact.management} />
            </div>
          </Reveal>
        </section>

        {/* 7. Management contact and closing invitation */}
        <section className="public-buyouts-contact-card text-center" aria-labelledby="buyouts-direct-title">
          <Reveal>
            <span className="public-eyebrow">DIRECT INQUIRIES</span>
            <h2 id="buyouts-direct-title" className="public-invite-heading">
              Need Immediate Assistance?
            </h2>
            <p className="public-invite-subhead">
              If you are planning an upcoming gathering or have urgent questions, connect directly with our management team.
            </p>
            <div className="public-invite-actions">
              <a href={contact.management} className="public-button public-button-teal">
                <span>Contact Management Directly</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
              <Link href="/rooms" className="public-button public-button-outline">
                Explore Accommodations
              </Link>
            </div>
          </Reveal>
        </section>
      </div>
    </main>
  )
}