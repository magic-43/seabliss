import 'server-only'
import { cookies } from 'next/headers'
import { createHash } from 'node:crypto'
import { z } from 'zod'
import { guestTokenForFlow, sealSession, unsealSession } from '@/lib/booking/session-crypto'

export const flowIdSchema = z.string().uuid()
const schema = z.object({
  version: z.literal(1), flowId: flowIdSchema, token: z.string().regex(/^[a-f0-9]{64}$/),
  expiresAt: z.number().int(), quoteHash: z.string().length(64).optional(), reviewedAt: z.number().int().optional(),
})
export type ReservationSession = z.infer<typeof schema>
const cookieName = (flowId: string) => 'seabliss_booking_' + flowId

function secret() {
  const value = process.env.BOOKING_SESSION_SECRET
  if (!value || value.length < 32) throw new Error('Secure booking sessions are not configured.')
  return value
}

export function fingerprint(value: unknown): string { return createHash('sha256').update(JSON.stringify(value)).digest('hex') }

export async function readReservationSession(flowId: string): Promise<ReservationSession | null> {
  if (!flowIdSchema.safeParse(flowId).success) return null
  const value = (await cookies()).get(cookieName(flowId))?.value
  if (!value) return null
  const parsed = schema.safeParse(unsealSession(value, secret()))
  return parsed.success && parsed.data.flowId === flowId && parsed.data.expiresAt > Date.now() ? parsed.data : null
}

export function newReservationSession(flowId: string): ReservationSession {
  // Concurrent initial reviews of one flow must issue the same unguessable credential.
  const token = guestTokenForFlow(flowIdSchema.parse(flowId), secret())
  return { version: 1, flowId, token, expiresAt: Date.now() + 86_400_000 }
}

export async function saveReservationSession(session: ReservationSession) {
  const value = sealSession(schema.parse(session), secret())
  ;(await cookies()).set(cookieName(session.flowId), value, {
    httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production',
    path: '/reserve', maxAge: Math.max(0, Math.floor((session.expiresAt - Date.now()) / 1000)),
  })
}
