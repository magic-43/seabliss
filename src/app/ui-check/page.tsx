import { Suspense } from 'react'
import AdminShell from '../admin/admin-shell'
import SettingsForms from '../admin/settings/settings-forms'
import DashboardView from '../admin/dashboard-view'
import type { ResortSettingsRow } from '@/lib/types/database.types'

const settings: ResortSettingsRow = {
  id: 1, check_in_time: '14:00', check_out_time: '12:00', extra_person_fee: 500, security_deposit: 5000,
  global_discount_percentage: 0, bank_name: 'Sample Bank', bank_account_name: 'Sample Resort', bank_account_number: '1234567890',
  bank_qr_url: null, gcash_name: 'Sample Resort', gcash_number: '09171234567', gcash_qr_url: null,
  contact_email: 'test@example.com', contact_phone: '09171234567', contact_facebook_url: '', contact_instagram_url: '',
  address: 'Sample address', created_at: '', updated_at: '',
}

export default async function UICheck({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams
  return <AdminShell><Suspense fallback={null}>{view === 'settings' ? <SettingsForms initialSettings={settings} /> : <DashboardView
    totalRevenue={592500} activeRooms={6}
    submissions={[
      { id: '1', amount_claimed: 8000, payment_method: 'gcash', created_at: '2026-11-18T10:00:00Z', review_status: 'approved', bookings: { guest_name: 'Beth Balagtas', reference_number: 'SBL-2026-1234', rooms: { name: 'Family Cabin' } } },
      { id: '2', amount_claimed: 8000, payment_method: 'gcash', created_at: '2026-11-18T09:00:00Z', review_status: 'pending', bookings: { guest_name: 'Philip Bunag', reference_number: 'SBL-2026-1235', rooms: { name: 'Loft Cabin' } } },
      { id: '3', amount_claimed: 8500, payment_method: 'bank_transfer', created_at: '2026-11-17T16:30:00Z', review_status: 'approved', bookings: { guest_name: 'Lileth Reyes', reference_number: 'SBL-2026-1236', rooms: { name: 'Loft Cabin' } } },
      { id: '4', amount_claimed: 8000, payment_method: 'gcash', created_at: '2026-11-17T03:00:00Z', review_status: 'rejected', bookings: { guest_name: 'Philip John Bunag', reference_number: 'SBL-2026-1237', rooms: { name: 'Loft Cabin' } } },
    ]}
  />}</Suspense></AdminShell>
}
