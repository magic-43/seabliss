import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from 'node:crypto'

const purpose = Buffer.from('seabliss-public-booking-session-v1')
function key(secret: string) {
  if (secret.length < 32) throw new Error('BOOKING_SESSION_SECRET must contain at least 32 characters.')
  return createHash('sha256').update(purpose).update(secret).digest()
}

export function sealSession(value: unknown, secret: string): string {
  const nonce = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(secret), nonce)
  cipher.setAAD(purpose)
  const data = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()])
  return Buffer.concat([nonce, cipher.getAuthTag(), data]).toString('base64url')
}

export function unsealSession(value: string, secret: string): unknown {
  try {
    if (value.length > 2048 || !/^[A-Za-z0-9_-]+$/.test(value)) return null
    const data = Buffer.from(value, 'base64url')
    if (data.length < 29) return null
    const decipher = createDecipheriv('aes-256-gcm', key(secret), data.subarray(0, 12))
    decipher.setAAD(purpose)
    decipher.setAuthTag(data.subarray(12, 28))
    return JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString('utf8'))
  } catch { return null }
}

export function guestTokenForFlow(flowId: string, secret: string): string {
  if (!/^[a-f0-9-]{36}$/i.test(flowId) || secret.length < 32) throw new Error('Invalid booking-session configuration.')
  return createHmac('sha256', secret).update('seabliss-guest-capability-v1:').update(flowId).digest('hex')
}
