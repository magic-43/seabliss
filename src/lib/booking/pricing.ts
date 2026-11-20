import { calculateNights } from './dates'
export { calculateNights } from './dates'

/**
 * Seabliss Beach Resort - Server-Side Pricing Calculator
 * All monetary values are integer Philippine Pesos (PHP) without float rounding errors.
 */

export interface PricingInput {
  regularRate: number
  checkIn: string // YYYY-MM-DD
  checkOut: string // YYYY-MM-DD
  adultGuests: number
  childGuests: number
  roomMaxGuests: number
  extraPersonFee: number
  securityDeposit: number
  paymentOption: 'full' | 'half'
}

export interface PricingResult {
  nights: number
  ratePerNight: number
  baseAmount: number
  extraPersons: number
  extraPersonFee: number
  extraPersonTotal: number
  subtotal: number
  securityDeposit: number
  totalAmount: number
  amountDue: number
  remainingBalance: number
}

export function calculatePricing(input: PricingInput): PricingResult {
  const nights = calculateNights(input.checkIn, input.checkOut)
  
  const ratePerNight = input.regularRate

  const baseAmount = ratePerNight * nights

  // Extra person calculation
  const totalGuests = input.adultGuests + input.childGuests
  const extraPersons = Math.max(0, totalGuests - input.roomMaxGuests)

  const extraPersonFee = input.extraPersonFee
  const extraPersonTotal = extraPersons * extraPersonFee * nights

  const subtotal = baseAmount + extraPersonTotal
  const securityDeposit = input.securityDeposit
  const totalAmount = subtotal + securityDeposit

  // Payment option: 'full' pays totalAmount now; 'half' pays 50% rounded up
  const amountDue = input.paymentOption === 'half' ? Math.ceil(totalAmount / 2) : totalAmount
  const remainingBalance = Math.max(0, totalAmount - amountDue)

  return {
    nights,
    ratePerNight,
    baseAmount,
    extraPersons,
    extraPersonFee,
    extraPersonTotal,
    subtotal,
    securityDeposit,
    totalAmount,
    amountDue,
    remainingBalance,
  }
}
