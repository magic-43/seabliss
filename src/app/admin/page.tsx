import { requireAdmin } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import DashboardView from './dashboard-view'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  await requireAdmin()
  const supabase = createAdminClient()
  const [
    { data: bookings, error: bookingsError },
    { count: roomsCount, error: roomsError },
    { data: submissions, error: submissionsError },
  ] = await Promise.all([
    supabase.from('bookings').select('amount_paid'),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('payment_submissions')
      .select('id, amount_claimed, payment_method, created_at, review_status, bookings(reference_number, guest_name, rooms(name))')
      .order('created_at', { ascending: false }),
  ])
  if (bookingsError || roomsError || submissionsError) throw new Error('Could not load the dashboard. Please try again.')

  return <DashboardView
    totalRevenue={bookings.reduce((sum, booking) => sum + booking.amount_paid, 0)}
    activeRooms={roomsCount ?? 0}
    submissions={submissions}
  />
}
