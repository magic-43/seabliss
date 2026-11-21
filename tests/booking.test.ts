import assert from 'node:assert/strict'
import { test } from 'node:test'
import { calculateNights, calculatePricing, type PricingInput } from '../src/lib/booking/pricing'
import { isValidStayDate } from '../src/lib/booking/dates'
import { generateGuestAccessToken, hashGuestAccessToken, verifyGuestAccessToken } from '../src/lib/booking/access-token'
import { generateReferenceNumber, isValidReferenceNumber } from '../src/lib/booking/reference'
import { bookingCreationSchema, paymentProofSchema, buyoutInquirySchema } from '../src/lib/validations/booking'
import { bookingSettingsSchema, roomUpdateSchema, siteDetailsSchema } from '../src/lib/validations/admin'

const pricingInput: PricingInput = {
  regularRate: 5_000,
  checkIn: '2028-02-28', checkOut: '2028-03-01',
  adultGuests: 3, childGuests: 1, roomMaxGuests: 2,
  extraPersonFee: 500, securityDeposit: 5_000, paymentOption: 'full',
}

const bookingInput = {
  roomSlug: 'villa-1', checkIn: '2028-02-28', checkOut: '2028-03-01',
  adultGuests: 2, childGuests: 0, guestName: 'Test Guest',
  guestEmail: 'guest@example.com', guestPhone: '09171234567',
  paymentOption: 'half', clientRequestId: '11111111-1111-4111-8111-111111111111',
}

test('stay dates reject impossible calendar days and reversed or zero-night stays', () => {
  assert.equal(isValidStayDate('2028-02-29'), true)
  for (const date of ['2027-02-29', '2028-02-30', '2028-13-01', 'not-a-date', '2028-2-1']) {
    assert.equal(isValidStayDate(date), false, date)
  }
  for (const [checkIn, checkOut] of [['2028-03-01', '2028-03-01'], ['2028-03-02', '2028-03-01'], ['2028-02-30', '2028-03-02']]) {
    assert.throws(() => calculateNights(checkIn, checkOut))
    assert.equal(bookingCreationSchema.safeParse({ ...bookingInput, checkIn, checkOut }).success, false)
  }
})

test('nights are calendar nights across leap days, DST, and year boundaries', () => {
  assert.equal(calculateNights('2028-02-28', '2028-03-01'), 2)
  assert.equal(calculateNights('2026-03-07', '2026-03-09'), 2)
  assert.equal(calculateNights('2026-12-31', '2027-01-01'), 1)
})

test('pricing snapshots include nightly extra guest fees and a single deposit', () => {
  const result = calculatePricing(pricingInput)
  assert.equal(result.baseAmount, 10_000)
  assert.equal(result.extraPersons, 2)
  assert.equal(result.extraPersonTotal, 2_000)
  assert.equal(result.subtotal, 12_000)
  assert.equal(result.totalAmount, 17_000)
  assert.equal(result.amountDue, 17_000)
  assert.equal(result.remainingBalance, 0)
})

test('half payment rounding preserves every peso', () => {
  const result = calculatePricing({ ...pricingInput, regularRate: 5001, securityDeposit: 1, paymentOption: 'half' })
  assert.equal(result.totalAmount, 12_003)
  assert.equal(result.amountDue, 6_002)
  assert.equal(result.amountDue + result.remainingBalance, result.totalAmount)
})

test('zero nightly rate and zero fees are respected', () => {
  const free = calculatePricing({ ...pricingInput, regularRate: 0, extraPersonFee: 0, securityDeposit: 0 })
  assert.equal(free.totalAmount, 0)
  assert.equal(free.ratePerNight, 0)
})

test('legacy promotional data cannot override the saved nightly rate', () => {
  const legacyInput = { ...pricingInput, discountedRate: 1 }
  assert.equal(calculatePricing(legacyInput).ratePerNight, pricingInput.regularRate)
})

test('guest tokens are random, hashed, and reject mismatches and malformed stored hashes', () => {
  const first = generateGuestAccessToken()
  const second = generateGuestAccessToken()
  assert.match(first.token, /^[a-f0-9]{64}$/)
  assert.notEqual(first.token, second.token)
  assert.notEqual(first.token, first.hash)
  assert.equal(first.hash, hashGuestAccessToken(first.token))
  assert.equal(verifyGuestAccessToken(first.token, first.hash), true)
  assert.equal(verifyGuestAccessToken(second.token, first.hash), false)
  assert.equal(verifyGuestAccessToken(first.token, 'broken'), false)
  assert.equal(verifyGuestAccessToken('', first.hash), false)
})

test('booking validation trims guest data and validates retry credentials', () => {
  const parsed = bookingCreationSchema.parse({ ...bookingInput, guestName: '  Test Guest  ' })
  assert.equal(parsed.guestName, 'Test Guest')
  assert.equal(bookingCreationSchema.safeParse({ ...bookingInput, guestName: '  ' }).success, false)
  assert.equal(bookingCreationSchema.safeParse({ ...bookingInput, adultGuests: 0 }).success, false)
  assert.equal(bookingCreationSchema.safeParse({ ...bookingInput, guestAccessToken: 'bad' }).success, false)
  assert.equal(bookingCreationSchema.safeParse({ ...bookingInput, guestAccessToken: generateGuestAccessToken().token }).success, true)
  for (const invalid of [
    { adultGuests: -1 }, { adultGuests: 1.5 }, { adultGuests: 31 },
    { childGuests: -1 }, { childGuests: 0.5 }, { childGuests: 21 },
    { guestEmail: 'not-an-email' }, { guestPhone: '' }, { roomSlug: '' },
    { clientRequestId: 'not-a-uuid' }, { paymentOption: 'later' },
  ]) {
    assert.equal(bookingCreationSchema.safeParse({ ...bookingInput, ...invalid }).success, false)
  }
  for (const malformed of [null, [], 'booking', {}]) {
    assert.equal(bookingCreationSchema.safeParse(malformed).success, false)
  }
})

test('distinct guests can request identical and partially overlapping stay dates', () => {
  const requests = [
    { guestName: 'Guest A', guestEmail: 'a@example.com', checkIn: '2099-12-10', checkOut: '2099-12-12', clientRequestId: '11111111-1111-4111-8111-111111111111' },
    { guestName: 'Guest B', guestEmail: 'b@example.com', checkIn: '2099-12-10', checkOut: '2099-12-12', clientRequestId: '22222222-2222-4222-8222-222222222222' },
    { guestName: 'Guest C', guestEmail: 'c@example.com', checkIn: '2099-12-11', checkOut: '2099-12-13', clientRequestId: '33333333-3333-4333-8333-333333333333' },
  ]
  for (const request of requests) {
    assert.equal(bookingCreationSchema.safeParse({ ...bookingInput, ...request }).success, true)
  }
})

test('payment claims reject fractions, invalid tokens, and integer overflow', () => {
  const input = { bookingReference: 'SBL-2026-1234', guestAccessToken: generateGuestAccessToken().token, paymentMethod: 'gcash', amountClaimed: 500 }
  assert.equal(paymentProofSchema.safeParse(input).success, true)
  for (const amountClaimed of [0, -1, 1.5, NaN, Infinity, 2_147_483_648]) {
    assert.equal(paymentProofSchema.safeParse({ ...input, amountClaimed }).success, false)
  }
  assert.equal(paymentProofSchema.safeParse({ ...input, guestAccessToken: 'invalid' }).success, false)
})

test('admin settings reject negative fees and invalid 24-hour times while allowing zero', () => {
  const settings = { extra_person_fee: 0, security_deposit: 0, check_in_time: '14:00', check_out_time: '12:00' }
  assert.equal(bookingSettingsSchema.safeParse(settings).success, true)
  for (const time of ['24:00', '12:60', '2:00 PM', '9:00']) {
    assert.equal(bookingSettingsSchema.safeParse({ ...settings, check_in_time: time }).success, false)
  }
  assert.equal(bookingSettingsSchema.safeParse({ ...settings, extra_person_fee: -1 }).success, false)
  assert.equal(bookingSettingsSchema.safeParse({ ...settings, security_deposit: 0.5 }).success, false)
})

test('social links validate at the server boundary', () => {
  const site = { contact_email: '', contact_phone: '', address: '' }
  assert.equal(siteDetailsSchema.safeParse({ ...site, contact_facebook_url: 'https://facebook.com/resort' }).success, true)
  assert.equal(siteDetailsSchema.safeParse({ ...site, contact_facebook_url: 'javascript:alert(1)' }).success, false)
})

test('room edits validate capacity and disallow unsafe gallery URLs', () => {
  const room = {
    id: '11111111-1111-4111-8111-111111111111', name: 'Villa', category: 'Villa',
    tagline: '', description: '', size_sqm: null, min_guests: 1, max_guests: 4,
    bed_type: '', location: '', regular_rate: 0, amenities: [], features: [],
    gallery: ['/images/villa.jpg', 'https://example.com/villa.jpg'], has_plunge_pool: false, is_active: true,
  }
  assert.equal(roomUpdateSchema.safeParse(room).success, true)
  assert.equal(roomUpdateSchema.safeParse({ ...room, min_guests: 5 }).success, false)
  assert.equal(roomUpdateSchema.safeParse({ ...room, gallery: ['//untrusted.example/image'] }).success, false)
  assert.equal(roomUpdateSchema.safeParse({ ...room, gallery: ['javascript:alert(1)'] }).success, false)
  assert.equal(roomUpdateSchema.safeParse({ ...room, category: 'Unknown' }).success, false)
})

test('inquiries reject blank identity fields', () => {
  assert.equal(buyoutInquirySchema.safeParse({ contactName: '  ', contactEmail: 'guest@example.com', contactPhone: '09171234567' }).success, false)
})

test('booking references retain the supported format', () => {
  assert.equal(isValidReferenceNumber(generateReferenceNumber()), true)
  assert.equal(isValidReferenceNumber('SBL-2026-12'), false)
})
