import Link from 'next/link'
import Image from 'next/image'
import {
  Phone,
  Mail,
  MessageSquare,
  MapPin,
  ExternalLink,
  Clock,
  Car,
  ArrowRight,
  Compass,
  CheckCircle2,
  Calendar,
} from 'lucide-react'
import FAQSection from '@/components/public/faq-section'
import Reveal from '@/components/public/reveal'
import { getPublicResortData } from '@/lib/public/data'
import { getContactLinks, getPublicFAQs, formatStayTime } from '@/lib/public/content'
import { publicMetadata } from '@/lib/public/metadata'

export const metadata = publicMetadata(
  'Contact & Location',
  'Contact Seabliss Beach Resort management in Lian, Batangas for accommodation requests, driving directions, dining arrangements, and private gatherings.',
  '/contact'
)

export default async function ContactPage() {
  const { settings, rooms } = await getPublicResortData()
  const links = getContactLinks(settings)
  const address = settings?.address?.trim() || 'Lian, Batangas, Philippines'
  const checkIn = settings ? formatStayTime(settings.check_in_time) : null
  const checkOut = settings ? formatStayTime(settings.check_out_time) : null
  const faqs = getPublicFAQs(settings, rooms)

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&output=embed`

  return (
    <main id="public-content" tabIndex={-1} className="public-contact-page">
      {/* 1. Photographic cover hero */}
      <section className="public-page-hero" aria-labelledby="contact-hero-title">
        <Image
          src="/images/beach_aerial/seabliss_shoreline.jpg"
          alt="Shoreline and beachfront at Seabliss Beach Resort in Lian, Batangas"
          fill
          priority
          sizes="100vw"
          className="public-page-hero-image"
        />
        <div className="public-page-hero-shade" />
        <div className="public-container public-page-hero-content text-center">
          <Reveal>
            <span className="public-eyebrow public-hero-eyebrow">
              CONTACT &amp; CONCIERGE · LIAN, BATANGAS
            </span>
            <h1 id="contact-hero-title" className="public-page-hero-title">
              We are here to help plan your stay.
            </h1>
            <p className="public-page-hero-subtitle">
              Reach the resort directly for reservations, driving directions, stay arrangements, or quick travel questions.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="public-container public-contact-body">
        {/* 2. Contact and Enquiry (2-column layout) */}
        <section className="public-contact-enquiry-section" aria-labelledby="get-in-touch-title">
          <Reveal>
            <div className="public-contact-enquiry-grid">
            {/* Left Column: Direct Resort Contact Channels */}
            <div className="public-contact-info-col">
              <span className="public-eyebrow">GET IN TOUCH</span>
              <h2 id="get-in-touch-title" className="public-section-title">
                Let us make your coastal escape seamless.
              </h2>
              <p className="public-editorial-intro">
                Contact the resort directly for stay inquiries, directions, resort policies, or assistance with family and group arrangements in Lian, Batangas.
              </p>

              <div className="public-contact-channel-list">
                <div className="public-contact-channel-item">
                  <div className="public-channel-icon-wrap" aria-hidden="true">
                    <Phone size={22} />
                  </div>
                  <div className="public-channel-content">
                    <h3>Call Us</h3>
                    <p>For reservations and direct concierge assistance</p>
                    {links.telephone ? (
                      <a href={links.telephone} className="public-channel-link">
                        {settings?.contact_phone}
                      </a>
                    ) : (
                      <span className="public-channel-unavailable">Available during daytime hours</span>
                    )}
                  </div>
                </div>

                <div className="public-contact-channel-item">
                  <div className="public-channel-icon-wrap" aria-hidden="true">
                    <MessageSquare size={22} />
                  </div>
                  <div className="public-channel-content">
                    <h3>Facebook Messenger</h3>
                    <p>Fast mobile inquiries and stay updates</p>
                    {links.facebook ? (
                      <a
                        href={links.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="public-channel-link"
                      >
                        <span>Open Facebook Page</span>
                        <ExternalLink size={14} aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="public-channel-unavailable">Seabliss Beach Resort</span>
                    )}
                  </div>
                </div>

                <div className="public-contact-channel-item">
                  <div className="public-channel-icon-wrap" aria-hidden="true">
                    <Mail size={22} />
                  </div>
                  <div className="public-channel-content">
                    <h3>Email Inquiries</h3>
                    <p>Written correspondence and reservation details</p>
                    {links.mail ? (
                      <a href={links.mail} className="public-channel-link">
                        {settings?.contact_email}
                      </a>
                    ) : (
                      <span className="public-channel-unavailable">Contact concierge online</span>
                    )}
                  </div>
                </div>

                <div className="public-contact-channel-item">
                  <div className="public-channel-icon-wrap" aria-hidden="true">
                    <MapPin size={22} />
                  </div>
                  <div className="public-channel-content">
                    <h3>Visit Us</h3>
                    <p>Lian, Batangas, Philippines</p>
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="public-channel-link"
                    >
                      <span>{address}</span>
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Direct Contact & Booking Options Card */}
            <div className="public-enquiry-card-col">
              <div className="public-direct-enquiry-card">
                <span className="public-eyebrow">RESERVATIONS &amp; INQUIRIES</span>
                <h3 className="public-enquiry-card-title">Direct Contact Channels</h3>
                <p className="public-enquiry-card-desc">
                  Our management team is readily available across all primary communication channels to assist with your dates, room options, and special requests.
                </p>

                <div className="public-enquiry-action-buttons">
                  <Link href="/reserve" className="public-button public-button-teal public-enquiry-btn">
                    <Calendar size={17} aria-hidden="true" />
                    <span>Request a Stay Online</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>

                  {links.facebook && (
                    <a
                      href={links.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="public-button public-button-light public-enquiry-btn"
                    >
                      <MessageSquare size={17} aria-hidden="true" />
                      <span>Message on Facebook</span>
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  )}

                  {links.telephone && (
                    <a href={links.telephone} className="public-button public-button-outline public-enquiry-btn">
                      <Phone size={17} aria-hidden="true" />
                      <span>Call Concierge ({settings?.contact_phone})</span>
                    </a>
                  )}

                  {links.mail && (
                    <a href={links.mail} className="public-button public-button-outline public-enquiry-btn">
                      <Mail size={17} aria-hidden="true" />
                      <span>Email Management</span>
                    </a>
                  )}
                </div>

                <div className="public-enquiry-card-footer">
                  <div className="public-enquiry-trust-item">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <span>Real-time online reservation request with bank &amp; GCash support</span>
                  </div>
                  <div className="public-enquiry-trust-item">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <span>Every booking request is reviewed directly by resort management</span>
                  </div>
                  <p className="public-enquiry-disclaimer">
                    Submission of a stay request does not automatically guarantee accommodation availability. Management will confirm your stay upon review.
                  </p>
                </div>
              </div>
            </div>
          </div>
          </Reveal>
        </section>

        {/* 3. Quick Contact Actions (4 cards in a row) */}
        <section className="public-quick-actions-section" aria-label="Quick contact channels">
          <Reveal>
            <div className="public-quick-actions-grid">
            <div className="public-quick-action-card">
              <Clock size={28} className="public-quick-icon" aria-hidden="true" />
              <h3>Reservations</h3>
              <p>Call or message directly</p>
              {links.telephone ? (
                <a href={links.telephone} className="public-quick-action-link">
                  {settings?.contact_phone}
                </a>
              ) : (
                <Link href="/reserve" className="public-quick-action-link">
                  Online Booking
                </Link>
              )}
            </div>

            <div className="public-quick-action-card">
              <MessageSquare size={28} className="public-quick-icon" aria-hidden="true" />
              <h3>Messenger</h3>
              <p>Fast mobile inquiries</p>
              {links.facebook ? (
                <a
                  href={links.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="public-quick-action-link"
                >
                  Message Page
                </a>
              ) : (
                <span className="public-quick-action-muted">Direct online</span>
              )}
            </div>

            <div className="public-quick-action-card">
              <Mail size={28} className="public-quick-icon" aria-hidden="true" />
              <h3>Email</h3>
              <p>Written correspondence</p>
              {links.mail ? (
                <a href={links.mail} className="public-quick-action-link">
                  Send Email
                </a>
              ) : (
                <span className="public-quick-action-muted">Direct online</span>
              )}
            </div>

            <div className="public-quick-action-card">
              <Compass size={28} className="public-quick-icon" aria-hidden="true" />
              <h3>Directions</h3>
              <p>Find us on Google Maps</p>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="public-quick-action-link"
              >
                Open Map
              </a>
            </div>
          </div>
          </Reveal>
        </section>

        {/* 4. Substantial location and arrival-information section */}
        <section className="public-location-section" aria-labelledby="location-title">
          <Reveal>
            <div className="public-location-grid">
              {/* Interactive Map Search Frame */}
              <div className="public-location-map-wrap">
                <iframe
                  src={mapEmbedUrl}
                  title="Seabliss Beach Resort Map Search"
                  className="public-location-iframe"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Address & Navigation Details */}
              <div className="public-location-info-panel">
                <div className="public-location-address-block">
                  <div className="public-location-icon-title">
                    <MapPin size={20} className="public-location-pin-icon" aria-hidden="true" />
                    <span className="public-eyebrow">RESORT LOCATION</span>
                  </div>
                  <h2 id="location-title" className="public-location-heading">
                    Find Us in Lian, Batangas
                  </h2>
                  <address className="public-location-address">
                    {address}
                  </address>
                  <p className="public-location-note">
                    Situated along the Batangas coast with secure on-site parking for all staying guests. Easily accessible by private vehicle from Metro Manila via Tagaytay or Cavite.
                  </p>
                </div>

                <div className="public-location-map-buttons">
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="public-button public-button-teal public-map-link-btn"
                  >
                    <MapPin size={16} aria-hidden="true" />
                    <span>Search on Google Maps</span>
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                  <a
                    href={wazeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="public-button public-button-outline public-map-link-btn"
                  >
                    <Car size={16} aria-hidden="true" />
                    <span>Search with Waze</span>
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                </div>

                {(checkIn || checkOut) && (
                  <div className="public-stay-hours-card">
                    <div className="public-stay-hours-head">
                      <Clock size={16} aria-hidden="true" />
                      <span>Resort Stay Schedule</span>
                    </div>
                    <div className="public-stay-hours-body">
                      {checkIn && (
                        <div className="public-hours-item">
                          <span>Check-in:</span>
                          <strong>{checkIn}</strong>
                        </div>
                      )}
                      {checkOut && (
                        <div className="public-hours-item">
                          <span>Check-out:</span>
                          <strong>{checkOut}</strong>
                        </div>
                      )}
                    </div>
                    <span className="public-hours-time-note">Philippine Standard Time</span>
                  </div>
                )}
              </div>
            </div>
          </Reveal>
        </section>

        {/* 5. Verified stay-information FAQ */}
        <div className="public-contact-faq-wrap">
          <Reveal>
            <FAQSection id="stay-information" items={faqs} />
          </Reveal>
        </div>

        {/* 6. Relevant closing navigation */}
        <section className="public-contact-closing-card text-center" aria-labelledby="contact-close-title">
          <Reveal>
            <span className="public-eyebrow">PLAN YOUR STAY</span>
            <h2 id="contact-close-title" className="public-invite-heading">
              Ready to Begin Your Coastal Escape?
            </h2>
            <p className="public-invite-subhead">
              Browse our accommodations or start your stay request with our management team today.
            </p>
            <div className="public-invite-actions">
              <Link href="/rooms" className="public-button public-button-teal">
                <span>View Accommodations</span>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/reserve" className="public-button public-button-outline">
                Request Your Stay
              </Link>
            </div>
          </Reveal>
        </section>
      </div>
    </main>
  )
}