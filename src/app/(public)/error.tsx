'use client'

import Link from 'next/link'

export default function PublicError({ reset }: { reset: () => void }) {
  return <main id="public-content" tabIndex={-1} className="public-container public-page-intro"><p className="public-eyebrow">SEABLISS BEACH RESORT</p><h1>A Little Interruption</h1><p className="public-page-introduction">We couldn’t load this information. Please try again or contact management for assistance.</p><div className="public-page-actions"><button type="button" className="public-button public-button-teal" onClick={reset}>Try Again</button><Link href="/contact" className="public-text-link">Contact the resort</Link></div></main>
}
