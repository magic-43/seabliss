import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin/auth'
import { SectionCard } from '@/components/admin/ui'
import SettingsForms from './settings-forms'
import AdminLoading from '../loading'

export default async function AdminSettingsPage() {
  await requireAdmin()
  const { data: settings, error } = await createAdminClient().from('resort_settings').select('*').eq('id', 1).maybeSingle()
  if (error) throw new Error('Could not load settings. Please try again.')
  if (!settings) return <SectionCard title="Settings are not available"><p className="text-sm text-admin-muted">Contact the resort administrator to initialize the resort settings.</p></SectionCard>
  return <Suspense fallback={<AdminLoading />}><SettingsForms initialSettings={settings} /></Suspense>
}
