import Link from 'next/link'
import PageIntro from '@/components/public/page-intro'

export default function PublicNotFound() {
  return <main id="public-content" tabIndex={-1}><PageIntro eyebrow="SEABLISS BEACH RESORT" title="This Page Isn’t Available"><p>The accommodation or page may have changed. Explore our current collection or contact our team.</p><div className="public-page-actions"><Link href="/rooms" className="public-button public-button-teal">Explore Accommodations</Link><Link href="/contact" className="public-text-link">Contact the resort</Link></div></PageIntro></main>
}
