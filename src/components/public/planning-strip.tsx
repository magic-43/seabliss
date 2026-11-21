'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, ArrowRight } from 'lucide-react'

export default function PlanningStrip({
  today,
  totalRooms,
  onFilterChange,
  activeFilter = 'all',
}: {
  today: string
  totalRooms?: number
  onFilterChange?: (category: string) => void
  activeFilter?: string
}) {
  const router = useRouter()
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('2')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    if (guests) params.set('guests', guests)
    const query = params.toString()
    router.push('/reserve' + (query ? `?${query}` : ''))
  }

  return (
    <div className="public-planning-strip-wrapper">
      <div className="public-planning-strip">
        <form onSubmit={handleSubmit} className="public-strip-form" aria-label="Stay dates and guest planner">
          <div className="public-strip-field">
            <label htmlFor="strip-check-in">
              <Calendar size={15} aria-hidden="true" />
              <span>Check-in</span>
            </label>
            <input
              id="strip-check-in"
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value)
                if (checkOut && e.target.value >= checkOut) {
                  setCheckOut('')
                }
              }}
              aria-label="Check-in date"
              suppressHydrationWarning
            />
          </div>

          <div className="public-strip-divider" aria-hidden="true" />

          <div className="public-strip-field">
            <label htmlFor="strip-check-out">
              <Calendar size={15} aria-hidden="true" />
              <span>Check-out</span>
            </label>
            <input
              id="strip-check-out"
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              aria-label="Check-out date"
              suppressHydrationWarning
            />
          </div>

          <div className="public-strip-divider" aria-hidden="true" />

          <div className="public-strip-field">
            <label htmlFor="strip-guests">
              <Users size={15} aria-hidden="true" />
              <span>Guests</span>
            </label>
            <select
              id="strip-guests"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              aria-label="Number of guests"
              suppressHydrationWarning
            >
              <option value="1">1 Guest</option>
              <option value="2">2 Guests</option>
              <option value="4">4 Guests</option>
              <option value="6">6 Guests</option>
              <option value="8">8 Guests</option>
              <option value="12">12 Guests</option>
              <option value="16">16 Guests</option>
              <option value="20">20 Guests</option>
            </select>
          </div>

          <button type="submit" className="public-button public-button-teal public-strip-submit">
            <span>Plan Your Stay</span>
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </form>

        {onFilterChange && (
          <div className="public-strip-filters" role="tablist" aria-label="Filter accommodations">
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'all'}
              className={'public-filter-pill' + (activeFilter === 'all' ? ' is-active' : '')}
              onClick={() => onFilterChange('all')}
            >
              All Accommodations {totalRooms !== undefined ? `(${totalRooms})` : ''}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'villa'}
              className={'public-filter-pill' + (activeFilter === 'villa' ? ' is-active' : '')}
              onClick={() => onFilterChange('villa')}
            >
              Private Villas
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'suite'}
              className={'public-filter-pill' + (activeFilter === 'suite' ? ' is-active' : '')}
              onClick={() => onFilterChange('suite')}
            >
              Suites
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'pool'}
              className={'public-filter-pill' + (activeFilter === 'pool' ? ' is-active' : '')}
              onClick={() => onFilterChange('pool')}
            >
              Private Plunge Pools
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
