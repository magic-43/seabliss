import { notFound } from 'next/navigation'
import { getPublicResortData } from '@/lib/public/data'
import { formatStayTime, getContactLinks } from '@/lib/public/content'
import { publicMetadata } from '@/lib/public/metadata'
import RoomDetailClient from '@/components/public/room-detail-client'

async function findRoom(slug: string) {
  const { rooms, settings } = await getPublicResortData()
  if (!rooms) throw new Error('Accommodation information is temporarily unavailable.')
  const room = rooms.find((r) => r.slug === slug)
  if (!room) notFound()
  const relatedRooms = rooms.filter((r) => r.slug !== slug).slice(0, 3)
  return { room, settings, relatedRooms }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { room } = await findRoom(slug)
  return publicMetadata(
    room.name,
    room.tagline || `Discover ${room.name} at Seabliss Beach Resort in Lian, Batangas.`,
    '/rooms/' + encodeURIComponent(room.slug)
  )
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { room, settings, relatedRooms } = await findRoom(slug)
  const checkIn = settings ? formatStayTime(settings.check_in_time) : null
  const checkOut = settings ? formatStayTime(settings.check_out_time) : null
  const contact = getContactLinks(settings)

  return (
    <main id="public-content" tabIndex={-1} className="public-room-detail-page">
      <div className="public-container">
        <RoomDetailClient
          room={room}
          settings={settings}
          checkIn={checkIn}
          checkOut={checkOut}
          relatedRooms={relatedRooms}
          contactHref={contact.management}
        />
      </div>
    </main>
  )
}
