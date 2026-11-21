'use client'

import { useEffect } from 'react'

export { default as Reveal } from './reveal'

export default function Reveals() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return
    const elements = document.querySelectorAll<HTMLElement>('.public-site [data-reveal]')
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) }
    }), { threshold: 0.12 })
    elements.forEach((element) => { element.classList.add('public-reveal-ready'); observer.observe(element) })
    return () => { observer.disconnect(); elements.forEach((element) => element.classList.remove('public-reveal-ready')) }
  }, [])
  return null
}
