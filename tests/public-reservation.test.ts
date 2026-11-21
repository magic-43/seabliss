import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { configuredPaymentMethods, guestDetailsSchema, parseStayDraft, parseUrlStayPreferences, receiptValidation, safeQRSource, stayDetailsSchema, staySchema } from '../src/lib/public/reservation-model'
import { safeResortImageSource } from '../src/lib/public/images'
import { guestTokenForFlow, sealSession, unsealSession } from '../src/lib/booking/session-crypto'

const stay = { roomSlug: 'villa-1', checkIn: '2099-12-10', checkOut: '2099-12-12', adultGuests: 12, childGuests: 1 }
const payment = { bank_name: null, bank_account_name: null, bank_account_number: null, bank_qr_url: null, gcash_name: null, gcash_number: null, gcash_qr_url: null }
const secret = 'test-only-secret-'.repeat(4)

test('guest stay validation shares backend bounds without rejecting overlapping requests', () => {
  assert.equal(staySchema.safeParse(stay).success, true)
  assert.equal(staySchema.safeParse({ ...stay }).success, true)
  for (const patch of [{ checkIn: '2099-02-30' }, { checkOut: stay.checkIn }, { checkOut: '2099-12-01' }, { adultGuests: 0 }, { adultGuests: 31 }, { childGuests: -1 }, { childGuests: 21 }]) assert.equal(staySchema.safeParse({ ...stay, ...patch }).success, false)
})

test('guest step requires the same contact validation as booking creation', () => {
  const guest = { guestName: ' Guest Name ', guestEmail: 'guest@example.com', guestPhone: '09171234567', specialRequests: ' Quiet room ' }
  assert.equal(guestDetailsSchema.parse(guest).guestName, 'Guest Name')
  for (const patch of [{ guestEmail: 'bad' }, { guestName: ' ' }, { guestPhone: '12' }, { specialRequests: 'x'.repeat(1001) }]) assert.equal(guestDetailsSchema.safeParse({ ...guest, ...patch }).success, false)
})

test('draft parsing is versioned, bounded, expires, and strips guest/payment credentials', () => {
  const now = 100_000
  const draft = { version: 1, flowId: randomUUID(), expiresAt: now + 1000, ...stay, paymentOption: 'half', guestName: 'Private Guest', guestEmail: 'private@example.com', guestAccessToken: 'a'.repeat(64), receipt: 'secret' }
  const parsed = parseStayDraft(JSON.stringify(draft), now)
  assert.ok(parsed)
  assert.equal('guestName' in parsed, false)
  assert.equal('guestEmail' in parsed, false)
  assert.equal('guestAccessToken' in parsed, false)
  assert.equal('receipt' in parsed, false)
  assert.equal(parseStayDraft(JSON.stringify(draft), now + 1001), null)
  assert.equal(parseStayDraft(JSON.stringify({ ...draft, expiresAt: now + 86_400_001 }), now), null)
  assert.equal(parseStayDraft(JSON.stringify({ ...draft, version: 2 }), now), null)
  assert.equal(parseStayDraft('{bad json', now), null)
})

test('payment methods never invent missing accounts and reject unsafe QR sources', () => {
  assert.deepEqual(configuredPaymentMethods(null), [])
  assert.deepEqual(configuredPaymentMethods(payment), [])
  assert.deepEqual(configuredPaymentMethods({ ...payment, bank_name: 'QA Bank', bank_account_name: 'QA Resort', bank_account_number: '000' }), ['bank_transfer'])
  assert.deepEqual(configuredPaymentMethods({ ...payment, gcash_name: 'QA Resort', gcash_number: '09000000000' }), ['gcash'])
  assert.deepEqual(configuredPaymentMethods({ ...payment, gcash_qr_url: 'javascript:alert(1)' }), [])
  assert.equal(safeQRSource('https://user:password@example.com/qr'), null)
  assert.equal(safeQRSource('//example.com/qr'), null)
  assert.equal(safeQRSource('/images/qr.png'), '/images/qr.png')
})

test('receipt selection preserves server MIME and 10 MB limits', () => {
  assert.ok(receiptValidation(null))
  assert.ok(receiptValidation({ size: 0, type: 'image/jpeg' }))
  assert.equal(receiptValidation({ size: 10 * 1024 * 1024, type: 'application/pdf' }), null)
  assert.ok(receiptValidation({ size: 10 * 1024 * 1024 + 1, type: 'image/jpeg' }))
  assert.ok(receiptValidation({ size: 100, type: 'image/svg+xml' }))
  for (const type of ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']) assert.equal(receiptValidation({ size: 100, type }), null)
})

test('booking cookies use authenticated encryption and fresh nonces', () => {
  const value = { version: 1, flowId: randomUUID(), token: 'a'.repeat(64), expiresAt: Date.now() + 1000 }
  const sealed = sealSession(value, secret)
  assert.deepEqual(unsealSession(sealed, secret), value)
  assert.notEqual(sealSession(value, secret), sealed)
  assert.equal(sealed.includes(value.token), false)
  const tampered = (sealed[0] === 'A' ? 'B' : 'A') + sealed.slice(1)
  assert.equal(unsealSession(tampered, secret), null)
  assert.equal(unsealSession(sealed, 'different-secret-'.repeat(4)), null)
  assert.equal(unsealSession('a'.repeat(2049), secret), null)
  assert.throws(() => sealSession(value, 'weak'))
})

test('concurrent reviews derive one stable, private credential for the same flow', () => {
  const flow = randomUUID()
  const token = guestTokenForFlow(flow, secret)
  assert.match(token, /^[a-f0-9]{64}$/)
  assert.equal(guestTokenForFlow(flow, secret), token)
  assert.notEqual(guestTokenForFlow(randomUUID(), secret), token)
  assert.notEqual(guestTokenForFlow(flow, 'other-key-'.repeat(5)), token)
})

test('unsupported gallery sources fall back before Next Image can throw', () => {
  assert.equal(safeResortImageSource('/images/rooms/room.jpg'), '/images/rooms/room.jpg')
  assert.equal(safeResortImageSource('https://res.cloudinary.com/resort/image.jpg'), 'https://res.cloudinary.com/resort/image.jpg')
  assert.equal(safeResortImageSource('https://example.supabase.co/storage/v1/object/public/rooms/a.jpg'), 'https://example.supabase.co/storage/v1/object/public/rooms/a.jpg')
  for (const source of [undefined, '', '//example.com/image.jpg', 'javascript:alert(1)', 'http://res.cloudinary.com/a.jpg', 'https://unknown.example/a.jpg', 'https://user:password@res.cloudinary.com/a.jpg', 'not an image URL']) assert.equal(safeResortImageSource(source), null)
})

test('url stay preselection validates dates, guest limits, and strips any untrusted fields', () => {
  const valid = parseUrlStayPreferences({ room: 'villa-1', checkIn: '2099-12-10', checkOut: '2099-12-12', adults: '4', children: '2', rate: '0', price: '10' })
  assert.deepEqual(valid, { roomSlug: 'villa-1', checkIn: '2099-12-10', checkOut: '2099-12-12', adultGuests: 4, childGuests: 2 })
  assert.equal('rate' in (valid ?? {}), false)
  assert.equal('price' in (valid ?? {}), false)

  // Reversed dates or invalid dates fail safely
  assert.equal(parseUrlStayPreferences({ checkIn: '2099-12-12', checkOut: '2099-12-10' }), null)
  assert.equal(parseUrlStayPreferences({ checkIn: 'bad-date' }), null)
  assert.equal(parseUrlStayPreferences({ adults: '-1' }), null)
  assert.equal(parseUrlStayPreferences({ adults: '99' }), null)
  assert.equal(parseUrlStayPreferences({ adults: 'two' }), null)
})

test('starting a new reservation workflow isolates fresh sessions and preserves earlier bookings', () => {
  const initialFlow = randomUUID()
  const initialToken = guestTokenForFlow(initialFlow, secret)
  const nextFlow = randomUUID()
  const nextToken = guestTokenForFlow(nextFlow, secret)

  assert.notEqual(initialFlow, nextFlow)
  assert.notEqual(initialToken, nextToken)

  // Draft clearing: when a user starts a new request, draft parses independently
  const oldDraft = { version: 1, flowId: initialFlow, expiresAt: Date.now() + 1000, ...stay, paymentOption: 'full' }
  const parsedOld = parseStayDraft(JSON.stringify(oldDraft))
  assert.equal(parsedOld?.flowId, initialFlow)

  const freshDraft = { version: 1, flowId: nextFlow, expiresAt: Date.now() + 1000, roomSlug: 'villa-2', checkIn: '2099-12-15', checkOut: '2099-12-18', adultGuests: 2, childGuests: 0, paymentOption: 'half' }
  const parsedFresh = parseStayDraft(JSON.stringify(freshDraft))
  assert.equal(parsedFresh?.flowId, nextFlow)
  assert.notEqual(parsedFresh?.roomSlug, parsedOld?.roomSlug)
})


test('stay preferences validate before room selection without weakening the complete stay schema', () => {
  const { roomSlug: _room, ...preferences } = stay
  void _room
  assert.equal(stayDetailsSchema.safeParse(preferences).success, true)
  assert.equal(staySchema.safeParse(preferences).success, false)
  assert.equal(staySchema.safeParse({ ...preferences, roomSlug: '' }).success, false)
  for (const patch of [{ checkIn: '2099-02-30' }, { checkOut: preferences.checkIn }, { adultGuests: 0 }, { childGuests: 21 }]) {
    assert.equal(stayDetailsSchema.safeParse({ ...preferences, ...patch }).success, false)
  }
})
