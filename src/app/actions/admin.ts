'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin, getAdminSession } from '@/lib/admin/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/lib/types/action-result'
import type { BookingStatus, ResortSettingsUpdate } from '@/lib/types/database.types'
import {
  paymentSettingsSchema, bookingSettingsSchema, siteDetailsSchema,
  roomUpdateSchema, paymentReviewSchema, buyoutUpdateSchema, userRoleSchema,
} from '@/lib/validations/admin'

function failure(error: unknown, message: string): { success: false; error: string } {
  console.error(message, error)
  return { success: false, error: message }
}

export async function adminLoginAction(
  _prevState: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  if (!(formData instanceof FormData)) return { error: 'Invalid login form.' }
  const parsed = z.object({ email: z.string().trim().email(), password: z.string().min(1) })
    .safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Please enter a valid email address and password.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return { error: 'Invalid email or password.' }

  // Use the same role check as protected pages and actions.
  const session = await getAdminSession()
  if (!session) {
    await supabase.auth.signOut()
    return { error: 'Access is restricted to resort administrators.' }
  }
  revalidatePath('/admin', 'layout')
  redirect('/admin')
}

export async function adminLogoutAction() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error('Could not sign out. Please try again.')
  revalidatePath('/admin', 'layout')
  redirect('/admin/login')
}

async function saveSettings(
  schema: z.ZodType<ResortSettingsUpdate>, rawInput: unknown
): Promise<ActionResult> {
  await requireAdmin()
  const parsed = schema.safeParse(rawInput)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  try {
    const { error } = await createAdminClient().from('resort_settings')
      .update(parsed.data).eq('id', 1).select('id').single()
    if (error) return failure(error, 'Could not save resort settings.')
    revalidatePath('/admin/settings')
    revalidatePath('/')
    return { success: true, data: undefined }
  } catch (error) {
    return failure(error, 'Could not save resort settings.')
  }
}

export async function updatePaymentSettings(rawInput: unknown) {
  return saveSettings(paymentSettingsSchema, rawInput)
}

export async function updateBookingSettings(rawInput: unknown) {
  return saveSettings(bookingSettingsSchema, rawInput)
}

export async function updateSiteDetails(rawInput: unknown) {
  return saveSettings(siteDetailsSchema, rawInput)
}

export async function adminReviewPaymentAction(
  rawInput: unknown
): Promise<ActionResult<{ bookingStatus: BookingStatus }>> {
  const { user } = await requireAdmin()
  const parsed = paymentReviewSchema.safeParse(rawInput)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  try {
    const { data, error } = await createAdminClient().rpc('review_payment', {
      submission_id: parsed.data.paymentSubmissionId,
      decision: parsed.data.decision,
      reviewer_id: user.id,
      rejection_reason: parsed.data.rejectionReason,
    })
    if (error || !data) return failure(error, 'Could not review payment. Refresh and try again.')
    revalidatePath('/admin', 'layout')
    return { success: true, data: { bookingStatus: data } }
  } catch (error) {
    return failure(error, 'Could not review payment. Refresh and try again.')
  }
}

export async function updateRoomAction(rawInput: unknown): Promise<ActionResult> {
  await requireAdmin()
  const parsed = roomUpdateSchema.safeParse(rawInput)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  try {
    const { id, ...changes } = parsed.data
    const { error } = await createAdminClient().from('rooms')
      .update(changes).eq('id', id).select('id').single()
    if (error) return failure(error, 'Could not update the room.')
    revalidatePath('/admin/rooms', 'layout')
    revalidatePath('/')
    return { success: true, data: undefined }
  } catch (error) {
    return failure(error, 'Could not update the room.')
  }
}

export async function adminGetPaymentProofSignedUrlAction(
  rawInput: unknown
): Promise<ActionResult<{ signedUrl: string }>> {
  await requireAdmin()
  const parsed = z.string().max(1024).regex(/^proofs\/[a-f0-9-]{36}\/[a-zA-Z0-9._-]+$/).safeParse(rawInput)
  if (!parsed.success) return { success: false, error: 'Invalid receipt path.' }
  try {
    const { data, error } = await createAdminClient().storage.from('payment-proofs')
      .createSignedUrl(parsed.data, 3600)
    if (error || !data?.signedUrl) return failure(error, 'Could not open the payment receipt.')
    return { success: true, data: { signedUrl: data.signedUrl } }
  } catch (error) {
    return failure(error, 'Could not open the payment receipt.')
  }
}

export async function adminUpdateBuyoutStatusAction(rawInput: unknown): Promise<ActionResult> {
  await requireAdmin()
  const parsed = buyoutUpdateSchema.safeParse(rawInput)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  try {
    const { inquiryId, status, adminNotes } = parsed.data
    const { error } = await createAdminClient().from('estate_buyout_inquiries')
      .update({ status, admin_notes: adminNotes }).eq('id', inquiryId).select('id').single()
    if (error) return failure(error, 'Could not update the inquiry.')
    revalidatePath('/admin/buyouts')
    return { success: true, data: undefined }
  } catch (error) {
    return failure(error, 'Could not update the inquiry.')
  }
}

export async function adminUpdateUserRoleAction(rawInput: unknown): Promise<ActionResult> {
  const { adminProfile, user } = await requireAdmin()
  if (adminProfile.role !== 'superadmin') {
    return { success: false, error: 'Only a superadmin can change user roles.' }
  }
  const parsed = userRoleSchema.safeParse(rawInput)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }
  if (parsed.data.userId === user.id) {
    return { success: false, error: 'You cannot change your own role.' }
  }
  try {
    const { error } = await createAdminClient().from('user_profiles')
      .update({ role: parsed.data.role }).eq('id', parsed.data.userId).select('id').single()
    if (error) return failure(error, 'Could not update the user role.')
    revalidatePath('/admin/users')
    return { success: true, data: undefined }
  } catch (error) {
    return failure(error, 'Could not update the user role.')
  }
}
