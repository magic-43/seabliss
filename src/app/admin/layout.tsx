import type { ReactNode } from 'react'
import { getAdminSession } from '@/lib/admin/auth'
import AdminShell from './admin-shell'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession()
  if (!session) return <>{children}</>
  return <AdminShell>{children}</AdminShell>
}
