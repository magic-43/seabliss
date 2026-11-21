import { HeroSection, ResortStory, ExperiencesSection, PrivateGatherings, ReservationCTA } from '@/components/public/home-sections'
import AccommodationShowcase from '@/components/public/accommodation-showcase'
import FAQSection from '@/components/public/faq-section'
import Reveals from '@/components/public/reveals'
import { getPublicResortData } from '@/lib/public/data'
import { getPublicFAQs } from '@/lib/public/content'

export default async function HomePage() {
  const { rooms, settings } = await getPublicResortData()
  const reservationHref = '/reserve'
  return <main id="public-content" tabIndex={-1}>
    <HeroSection reservationHref={reservationHref} />
    <ResortStory />
    <AccommodationShowcase rooms={rooms} />
    <ExperiencesSection rooms={rooms} />
    <PrivateGatherings reservationHref="/buyouts" />
    <FAQSection items={getPublicFAQs(settings, rooms).slice(0, 4)} />
    <ReservationCTA reservationHref={reservationHref} />
    <Reveals />
  </main>
}
