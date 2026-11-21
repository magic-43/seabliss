'use client'

import { useState, useEffect } from 'react'
import { CalendarDays } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { publicNavigation } from '@/lib/public/content'
import Brand from './brand'
import MobileMenu from './mobile-menu'

export default function Header({ reservationHref }: { reservationHref: string }) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Inner pages without photographic heroes (/rooms/[slug], /reserve/confirmation)
  // start with a light cream background, requiring the solid header even at scroll top.
  // Pages with heroes (/, /rooms, /dining, /experiences, /about, /private-gatherings, /contact, /reserve)
  // start transparent over the hero and smoothly transition to solid on scroll.
  const isPageWithoutHero =
    pathname.startsWith('/rooms/') || pathname.startsWith('/reserve/confirmation')
  const isSolid = isPageWithoutHero || scrolled

  return (
    <header className={'public-header' + (isSolid ? ' public-header-solid' : '')}>
      <div className="public-container public-header-inner">
        <Brand />
        <nav className="public-desktop-nav" aria-label="Main navigation">
          {publicNavigation.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              aria-current={
                pathname === href || (href !== '/' && pathname.startsWith(href + '/'))
                  ? 'page'
                  : undefined
              }
            >
              {label}
            </Link>
          ))}
        </nav>
        <a href={reservationHref} className="public-button public-header-reserve">
          <CalendarDays size={15} aria-hidden="true" />
          Reserve Your Stay
        </a>
        <MobileMenu reservationHref={reservationHref} />
      </div>
    </header>
  )
}
