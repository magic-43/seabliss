'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { Home, Bed, Settings, ArrowLeft } from 'lucide-react'
import { getAdminPage, isAdminNavActive } from '@/lib/admin/navigation'

const navigation = [
  { label: 'Dashboard', href: '/admin', icon: Home },
  { label: 'Rooms', href: '/admin/rooms', icon: Bed },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebarNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Main navigation" className="flex-1 space-y-2 overflow-y-auto p-4">
      {navigation.map(({ label, href, icon: Icon }) => {
        const active = isAdminNavActive(pathname, href)
        return (
          <Link key={href} href={href} aria-current={active ? 'page' : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${active ? 'bg-admin-active text-admin-text' : 'text-admin-muted hover:bg-admin-hover hover:text-admin-text'}`}>
            <Icon aria-hidden="true" className={`size-5 ${active ? 'text-seabliss-sand' : ''}`} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

export function AdminHeader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const page = getAdminPage(pathname, searchParams.get('tab'))
  return (
    <header className="admin-mobile-header sticky top-0 z-30 border-b border-admin-border bg-admin-bg/95 backdrop-blur-md md:static md:border-0">
      <div className="mx-auto flex min-h-18 w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 md:gap-4 md:px-8 md:pb-6 md:pt-8">
        {page.backHref ? (
          <Link href={page.backHref} aria-label={`Back to ${page.backLabel}`} className={`admin-button-icon shrink-0 ${pathname === '/admin/settings' ? 'md:hidden' : ''}`}>
            <ArrowLeft aria-hidden="true" className="size-5" />
          </Link>
        ) : (
          <Image src="/images/branding/emblem.svg" alt="" width={36} height={36} className="size-9 shrink-0 md:hidden" />
        )}
        <div className="min-w-0">
          <h1 className="font-serif text-2xl leading-tight text-admin-text md:text-3xl">{page.title}</h1>
          <p className="mt-1 hidden text-sm leading-relaxed text-admin-muted md:block">{page.description}</p>
        </div>
      </div>
    </header>
  )
}

export function AdminBottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // Focused editing deliberately replaces navigation with one save action.
  if (getAdminPage(pathname, searchParams.get('tab')).focused) return null
  return (
    <nav aria-label="Mobile navigation" className="admin-bottom-nav fixed inset-x-0 bottom-0 z-40 border-t border-admin-border bg-admin-surface md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-3 gap-2 px-3 py-2">
        {navigation.map(({ label, href, icon: Icon }) => {
          const active = isAdminNavActive(pathname, href)
          return (
            <Link key={href} href={href} aria-current={active ? 'page' : undefined}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium ${active ? 'bg-admin-active text-seabliss-sand' : 'text-admin-muted hover:text-admin-text'}`}>
              <Icon aria-hidden="true" className="size-5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
