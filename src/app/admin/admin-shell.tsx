'use client'

import Image from 'next/image'
import { Suspense, type ReactNode } from 'react'
import { LogOut } from 'lucide-react'
import { adminLogoutAction } from '@/app/actions/admin'
import { AdminSidebarNav, AdminHeader, AdminBottomNav } from './admin-nav'

export default function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell min-h-dvh bg-admin-bg font-sans text-admin-text selection:bg-admin-active">
      <a href="#admin-content" className="sr-only z-50 rounded-lg bg-seabliss-sand p-3 text-admin-bg focus:fixed focus:left-4 focus:top-4 focus:not-sr-only">Skip to content</a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-admin-border bg-admin-surface md:flex print:hidden">
        <div className="flex items-center gap-3 border-b border-admin-border p-6">
          <Image src="/images/branding/emblem.svg" alt="" width={40} height={40} className="size-10" />
          <div>
            <p className="font-serif text-2xl tracking-wide">Seabliss</p>
            <p className="mt-0.5 text-xs text-seabliss-sand">Resort management</p>
          </div>
        </div>
        <AdminSidebarNav />
        <div className="border-t border-admin-border p-4">
          <form action={adminLogoutAction}>
            <button type="submit" className="flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-sm text-admin-muted hover:bg-admin-hover hover:text-admin-text">
              <LogOut aria-hidden="true" className="size-5" /> Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 md:pl-64">
        <Suspense fallback={<div className="h-18 border-b border-admin-border md:h-28" />}><AdminHeader /></Suspense>
        <main id="admin-content" tabIndex={-1} className="admin-content mx-auto w-full max-w-7xl px-4 pt-5 sm:px-6 md:px-8 md:pb-12 md:pt-0">
          {children}
        </main>
      </div>
      <Suspense fallback={null}><AdminBottomNav /></Suspense>
    </div>
  )
}
