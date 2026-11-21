'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

export default function AccommodationRail({ children, count }: { children: ReactNode; count: number }) {
  const list = useRef<HTMLUListElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })
  useEffect(() => {
    const element = list.current
    if (!element) return
    function update() { if (element) setEdges({ start: element.scrollLeft <= 2, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 }) }
    const observer = new ResizeObserver(update)
    observer.observe(element)
    element.addEventListener('scroll', update, { passive: true })
    update()
    return () => { observer.disconnect(); element.removeEventListener('scroll', update) }
  }, [])
  function move(direction: number) {
    const element = list.current
    if (!element) return
    element.scrollBy({ left: direction * element.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  return <div className="public-accommodation-gallery"><div className="public-accommodation-stage">
    <div className="public-rail-controls"><button type="button" onClick={() => move(-1)} disabled={edges.start} aria-label="Previous accommodations" aria-controls="accommodation-list"><ChevronLeft size={24} strokeWidth={1} aria-hidden="true" /></button><button type="button" onClick={() => move(1)} disabled={edges.end} aria-label="Next accommodations" aria-controls="accommodation-list"><ChevronRight size={24} strokeWidth={1} aria-hidden="true" /></button></div>
    <ul ref={list} id="accommodation-list" className="public-room-list" aria-label={count + ' accommodations'}>{children}</ul>
  </div><Link href="/rooms" className="public-button public-button-teal public-view-all">View All Accommodations<ArrowRight size={18} aria-hidden="true" /></Link></div>
}
