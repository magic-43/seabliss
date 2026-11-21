import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Header from '@/components/public/header'
import Footer from '@/components/public/footer'
import { getPublicResortData } from '@/lib/public/data'
import './public.css'
import './public-pages.css'

// Public prices and management contacts are read fresh for each request.
export const dynamic = 'force-dynamic'

const title = 'Seabliss Beach Resort | A Private Coastal Escape in Lian, Batangas'
const description = 'Find your place by the sea at Seabliss Beach Resort in Lian, Batangas. Explore beachfront villas and suites, and plan your stay with our management team.'
const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL
let origin: URL | undefined
try { if (configuredOrigin && /^https?:\/\//.test(configuredOrigin)) origin = new URL(configuredOrigin) } catch { /* No canonical URL without a valid configured origin. */ }

export const metadata: Metadata = {
  title, description,
  ...(origin ? { metadataBase: origin, alternates: { canonical: '/' } } : {}),
  openGraph: { title, description, type: 'website', siteName: 'Seabliss Beach Resort', locale: 'en_PH', ...(origin ? { url: '/', images: [{ url: '/images/rooms/villa-4/villa-4-1.jpg', width: 1280, height: 960, alt: 'Seabliss beachfront villas and pools' }] } : {}) },
  twitter: { card: 'summary_large_image', title, description },
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const { settings } = await getPublicResortData()
  return <div className="public-site" id="home">
    <a href="#public-content" className="public-skip-link">Skip to content</a>
    <Header reservationHref="/reserve" />
    {children}
    <Footer settings={settings} />
  </div>
}
