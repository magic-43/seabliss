'use client'

import { useState } from 'react'
import type { PublicRoomDetails } from '@/lib/public/content'
import RoomCard from './room-card'

const FILTER_OPTIONS = [
  { id: 'all', label: 'All Accommodations', shortLabel: 'All Rooms' },
  { id: 'villa', label: 'Beachfront Villas', shortLabel: 'Villas' },
  { id: 'suite', label: 'Suites', shortLabel: 'Suites' },
  { id: 'pool', label: 'Private Plunge Pool', shortLabel: 'Plunge Pool' },
]

export default function RoomsDirectory({
  rooms,
}: {
  rooms: PublicRoomDetails[]
  today?: string
}) {
  const [filter, setFilter] = useState('all')

  const filteredRooms = rooms.filter((room) => {
    if (filter === 'villa') return room.category.toLowerCase().includes('villa')
    if (filter === 'suite') return room.category.toLowerCase().includes('suite')
    if (filter === 'pool') return room.has_plunge_pool
    return true
  })

  return (
    <div className="public-rooms-directory-container">
      <div className="public-rooms-tabs" role="tablist" aria-label="Filter accommodations by category">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={filter === opt.id}
            className={'public-rooms-tab' + (filter === opt.id ? ' is-active' : '')}
            onClick={() => setFilter(opt.id)}
          >
            <span className="public-rooms-tab-full">{opt.label}</span>
            <span className="public-rooms-tab-short">{opt.shortLabel}</span>
          </button>
        ))}
      </div>

      <div className="public-room-directory" id="directory">
        {filteredRooms.length > 0 ? (
          <div className="public-room-vertical-list">
            {filteredRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        ) : (
          <div className="public-room-empty-state">
            <p>No accommodations match the selected filter.</p>
            <button
              type="button"
              className="public-button public-button-teal"
              onClick={() => setFilter('all')}
            >
              Show All Accommodations
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
