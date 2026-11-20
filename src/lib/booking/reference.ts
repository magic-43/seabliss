import { randomInt } from 'node:crypto'

/**
 * Seabliss Beach Resort - Reference Generator
 * Format: SBL-YYYY-XXXX (e.g. SBL-2026-4821)
 */

export function generateReferenceNumber(): string {
  const year = new Date().getFullYear()
  // Generate a random 4-digit number between 1000 and 9999
  const randomSuffix = randomInt(1000, 10000)
  return `SBL-${year}-${randomSuffix}`
}

export function isValidReferenceNumber(reference: string): boolean {
  return /^SBL-\d{4}-\d{4}$/.test(reference)
}
