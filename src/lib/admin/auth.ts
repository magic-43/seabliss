import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import type { UserProfileRow } from '@/lib/types/database.types'
import { cache } from 'react'

/**
 * Returns the current admin session without throwing redirects.
 * Uses service role client to verify role in user_profiles to bypass RLS issues cleanly.
 */
export const getAdminSession = cache(async (): Promise<{
  user: { id: string; email?: string }
  adminProfile: UserProfileRow
} | null> => {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) return null

    const adminClient = createAdminClient()
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'superadmin')) {
      return null
    }

    return {
      user: { id: user.id, email: user.email },
      adminProfile: profile,
    }
  } catch (error) {
    console.error('Failed to verify administrator session', error)
    return null
  }
})

/**
 * Ensures the caller is authenticated as an admin.
 * Throws a redirect to /admin/login if unauthenticated or not an admin.
 */
export async function requireAdmin(): Promise<{
  user: { id: string; email?: string }
  adminProfile: UserProfileRow
}> {
  const session = await getAdminSession()
  if (!session) {
    redirect('/admin/login')
  }
  return session
}
