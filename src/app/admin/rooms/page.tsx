import Image from 'next/image'
import Link from 'next/link'
import { BedDouble, Users, Waves, Pencil } from 'lucide-react'
import { requireAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { StatusBadge } from '@/components/admin/ui'
import { formatPeso } from '@/lib/format'

export default async function AdminRoomsPage() {
  await requireAdmin()
  const { data: rooms, error } = await createAdminClient().from('rooms').select('*').order('sort_order', { ascending: true })
  if (error) throw new Error('Could not load rooms. Please try again.')

  if (rooms.length === 0) return (
    <div className="admin-card px-5 py-14 text-center"><BedDouble aria-hidden="true" className="mx-auto mb-4 size-8 text-seabliss-sand" /><h2 className="font-serif text-2xl">No rooms yet</h2><p className="mt-2 text-sm text-admin-muted">Your accommodations will appear here once they have been added.</p></div>
  )

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-2">
      {rooms.map((room) => (
        <article key={room.id} className="admin-card flex flex-col sm:flex-row">
          <div className="relative aspect-[16/10] w-full shrink-0 bg-admin-hover sm:aspect-auto sm:w-2/5">
            <Image src={room.gallery[0] || '/images/beachfront_sunset.png'} alt={room.name} fill unoptimized className="object-cover" sizes="(min-width: 1280px) 20vw, (min-width: 640px) 35vw, 100vw" />
          </div>
          <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-seabliss-sand">{room.category}</p><StatusBadge status={room.is_active ? 'active' : 'inactive'} /></div>
            <h2 className="mt-3 break-words font-serif text-2xl">{room.name}</h2>
            <ul className="my-4 space-y-2 text-sm text-admin-muted">
              <li className="flex items-start gap-2"><Users aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span>Up to {room.max_guests} guests</span></li>
              {room.bed_type && <li className="flex items-start gap-2"><BedDouble aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span className="break-words">{room.bed_type}</span></li>}
              {room.has_plunge_pool && <li className="flex items-start gap-2"><Waves aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><span>Private plunge pool</span></li>}
            </ul>
            <div className="mt-auto border-t border-admin-border pt-4">
              <p className="text-xs text-admin-muted">Nightly rate</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{formatPeso(room.regular_rate)}</p>
              <Link href={`/admin/rooms/${room.id}`} aria-label={`Edit ${room.name}`} className="admin-button-secondary mt-4 w-full"><Pencil aria-hidden="true" className="size-4" />Edit room</Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}
