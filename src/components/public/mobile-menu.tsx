'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { CalendarDays, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { publicNavigation } from '@/lib/public/content'
import Brand from './brand'

export default function MobileMenu({ reservationHref }: { reservationHref: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousOverflow = useRef<string | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
    if (previousOverflow.current !== null) document.documentElement.style.overflow = previousOverflow.current
  }, [])

  function openMenu() {
    const element = dialog.current
    if (!element || element.open) return
    previousOverflow.current = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    element.showModal()
    element.classList.remove('is-closing')
    void element.offsetHeight
    element.classList.add('is-open')
    setOpen(true)
  }

  function restorePage() {
    if (previousOverflow.current !== null) document.documentElement.style.overflow = previousOverflow.current
    previousOverflow.current = null
    setOpen(false)
    trigger.current?.focus({ preventScroll: true })
  }

  function closeMenu() {
    const element = dialog.current
    if (!element?.open || element.classList.contains('is-closing')) return
    element.classList.remove('is-open')
    element.classList.add('is-closing')
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : parseFloat(getComputedStyle(element).getPropertyValue('--modal-close-dur')) || 150
    timer.current = setTimeout(() => {
      element.close()
      element.classList.remove('is-closing')
      timer.current = null
    }, duration)
  }

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return
    const elements = event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
    const first = elements[0]
    const last = elements[elements.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  return <>
    <button ref={trigger} type="button" className="public-menu-trigger" onClick={openMenu} aria-label="Open navigation menu" aria-expanded={open} aria-controls="public-mobile-menu"><Menu aria-hidden="true" size={25} strokeWidth={1.25} /></button>
    <dialog ref={dialog} id="public-mobile-menu" aria-labelledby="public-menu-title" className="public-menu t-modal" onKeyDown={trapFocus} onClose={restorePage} onCancel={(event) => { event.preventDefault(); closeMenu() }}>
      <div className="public-menu-top"><Brand onNavigate={closeMenu} /><button type="button" autoFocus onClick={closeMenu} className="public-menu-close" aria-label="Close navigation menu"><X aria-hidden="true" size={25} strokeWidth={1.25} /></button></div>
      <p id="public-menu-title" className="public-eyebrow">A PRIVATE COASTAL ESCAPE</p>
      <nav aria-label="Mobile navigation" className="public-menu-links">
        {publicNavigation.map(({ href, label }, index) => <Link key={href} href={href} onClick={closeMenu}><span className="public-menu-number" aria-hidden="true">0{index + 1}</span>{label}</Link>)}
      </nav>
      <a href={reservationHref} onClick={closeMenu} className="public-button"><CalendarDays aria-hidden="true" size={17} />Reserve Your Stay</a>
      <p className="public-menu-location">LIAN, BATANGAS · PHILIPPINES</p>
    </dialog>
  </>
}
