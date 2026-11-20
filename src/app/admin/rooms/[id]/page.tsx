import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { RoomEditForm } from './room-edit-form'
import { z } from 'zod'

export default async function AdminRoomEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  if (!z.string().uuid().safeParse(id).success) notFound()
  const { data: room, error } = await createAdminClient().from('rooms').select('*').eq('id', id).maybeSingle()
  if (error) throw new Error('Could not load the room. Please try again.')
  if (!room) notFound()
  return <RoomEditForm room={room} />
}
