import crypto from 'crypto'

/**
 * Guest access token utilities for tracking reservations securely.
 * Generates an unguessable 32-byte hex token for the guest,
 * while storing only its SHA-256 hash in the database.
 */

export function generateGuestAccessToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('hex')
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  return { token, hash }
}

export function hashGuestAccessToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function verifyGuestAccessToken(token: string, storedHash: string): boolean {
  if (!token || !storedHash) return false
  const computedHash = hashGuestAccessToken(token)
  try {
    return crypto.timingSafeEqual(
      Buffer.from(computedHash, 'utf8'),
      Buffer.from(storedHash, 'utf8')
    )
  } catch {
    return false
  }
}
