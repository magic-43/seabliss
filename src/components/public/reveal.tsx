'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'none'
  className?: string
  threshold?: number
}

export default function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  threshold = 0.1,
}: RevealProps) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const currentRef = ref.current
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (prefersReducedMotion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (currentRef) observer.unobserve(currentRef)
        }
      },
      { root: null, rootMargin: '0px', threshold }
    )

    if (currentRef) observer.observe(currentRef)
    return () => {
      if (currentRef) observer.unobserve(currentRef)
    }
  }, [threshold])

  const getDirectionClasses = () => {
    if (isVisible) return 'public-reveal-visible'
    switch (direction) {
      case 'up':
        return 'public-reveal-up'
      case 'down':
        return 'public-reveal-down'
      case 'left':
        return 'public-reveal-left'
      case 'right':
        return 'public-reveal-right'
      case 'none':
        return 'public-reveal-none'
      default:
        return 'public-reveal-up'
    }
  }

  return (
    <div
      ref={ref}
      className={`public-reveal-wrap ${getDirectionClasses()} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export { Reveal }
