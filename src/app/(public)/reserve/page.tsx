import Image from 'next/image'
import ReservationWizard from '@/components/public/reservation/reservation-wizard'
import { getPublicResortData } from '@/lib/public/data'
import { getContactLinks } from '@/lib/public/content'
import { configuredPaymentMethods, parseUrlStayPreferences } from '@/lib/public/reservation-model'
import { getPaymentDetails } from '@/lib/public/reservation-data'
import { flowIdSchema } from '@/lib/public/reservation-session'
import { todayInManila } from '@/lib/booking/dates'
import { publicMetadata } from '@/lib/public/metadata'

export const metadata = {
  ...publicMetadata(
    'Request Your Stay',
    'Choose your Seabliss accommodation, review your stay charges, and submit payment proof for management review.',
    '/reserve'
  ),
  robots: { index: false, follow: true },
}

export default async function ReservePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const [params, { rooms, settings }, payment] = await Promise.all([
    searchParams,
    getPublicResortData(),
    getPaymentDetails(),
  ])

  if (!rooms || !settings) throw new Error('Could not load current booking information.')

  const links = getContactLinks(settings)
  const urlPreferences = parseUrlStayPreferences(params)
  const wanted = typeof params.room === 'string' ? params.room : (urlPreferences?.roomSlug || '')
  const selected = rooms.some((room) => room.slug === wanted) ? wanted : ''
  const requestedFlow = flowIdSchema.safeParse(params.request)
  const flow = requestedFlow.success ? requestedFlow.data : ''
  const isFresh = params.new === '1'

  const activeMethods = payment ? configuredPaymentMethods(payment) : []

  return (
    <main id="public-content" tabIndex={-1} className="public-reserve-page">
      {/* 1. Short photographic introduction */}
      <section className="public-page-hero public-hero-compact" aria-labelledby="reserve-hero-title">
        <Image
          src="/images/beach_aerial/seabliss_shoreline.jpg"
          alt="Seabliss shoreline and coastal setting"
          fill
          priority
          sizes="100vw"
          className="public-page-hero-image"
        />
        <div className="public-page-hero-shade" />
        <div className="public-container public-page-hero-content text-center">
          <span className="public-eyebrow public-hero-eyebrow">
            PLAN YOUR STAY · LIAN, BATANGAS
          </span>
          <h1 id="reserve-hero-title" className="public-page-hero-title">
            Your Seabliss Escape
          </h1>
          <p className="public-page-hero-subtitle">
            Choose your preferred stay, review the charges, and submit payment proof. Our team will contact you to finalize accommodation arrangements.
          </p>
        </div>
      </section>

      {activeMethods.length > 0 && payment ? (
        <>
          {wanted && !selected && (
            <div className="public-container">
              <p className="public-policy-note">
                That accommodation is not currently listed. Please choose from the active collection below.
              </p>
            </div>
          )}
          <ReservationWizard
            key={selected + flow + (isFresh ? '-new' : '')}
            rooms={rooms}
            settings={settings}
            payment={payment}
            preselectedRoom={selected}
            preselectedStay={urlPreferences}
            requestedFlow={flow}
            freshRequest={isFresh}
            contactHref={links.management}
            today={todayInManila()}
          />
        </>
      ) : (
        <section className="public-container public-page-section">
          <h2>Let’s Arrange Your Stay</h2>
          <p className="public-page-introduction">
            Online payment details are being updated. Please contact management for verified payment instructions before sending money.
          </p>
          <a href={links.management} className="public-button public-button-teal">
            Contact Management
          </a>
        </section>
      )}
    </main>
  )
}
