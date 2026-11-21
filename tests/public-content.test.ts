import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatStayTime, getContactLinks, getPublicFAQs, type PublicSettings, type PublicRoom } from '../src/lib/public/content'

const settings: PublicSettings = {
  address: 'Verified resort address', contact_email: 'team@example.com', contact_phone: '+63 915 123 4567',
  contact_facebook_url: 'https://www.facebook.com/example', contact_instagram_url: 'https://www.instagram.com/example',
  check_in_time: '14:00', check_out_time: '12:00', extra_person_fee: 500, security_deposit: 5000,
}

test('management links prefer configured contacts and have a valid contact-page fallback', () => {
  assert.equal(getContactLinks(settings).management, settings.contact_facebook_url)
  const withoutFacebook = { ...settings, contact_facebook_url: '' }
  assert.equal(getContactLinks(withoutFacebook).management, 'mailto:team@example.com')
  assert.equal(getContactLinks({ ...withoutFacebook, contact_email: '' }).management, 'tel:+639151234567')
  assert.equal(getContactLinks(null).management, '/contact')
})

test('public contact links reject executable URLs, embedded credentials, and malformed contact values', () => {
  const result = getContactLinks({ ...settings, contact_facebook_url: 'javascript:alert(1)', contact_instagram_url: 'https://user:password@example.com', contact_email: 'team@example.com?subject=unsafe', contact_phone: '+63<script>' })
  assert.equal(result.facebook, null)
  assert.equal(result.instagram, null)
  assert.equal(result.mail, null)
  assert.equal(result.telephone, null)
  assert.equal(result.management, '/contact')
})

test('public stay times preserve midnight, noon, and optional database seconds', () => {
  assert.equal(formatStayTime('00:00'), '12:00 AM')
  assert.equal(formatStayTime('12:00'), '12:00 PM')
  assert.equal(formatStayTime('14:30:00'), '2:30 PM')
  for (const value of ['24:00', '12:60', '9:00', '', '2 PM']) assert.equal(formatStayTime(value), null)
})

test('missing settings do not invent fees, deposit terms, or stay times', () => {
  const items = getPublicFAQs(null, null)
  assert.equal(items.length, 2)
  assert.match(items.find((item) => item.question.includes('arrange'))!.answer, /does not automatically guarantee accommodation availability/)
  assert.equal(getPublicFAQs({ ...settings, check_in_time: 'invalid', security_deposit: 0 }, []).some((item) => /check-in|deposit/.test(item.question)), false)
})

test('FAQ fees and pool information follow the supplied records, including zero extra-guest fees', () => {
  const room: PublicRoom = { id: 'test', slug: 'test', name: 'Test accommodation', category: 'Villa', regular_rate: 0, min_guests: 1, max_guests: 2, amenities: [], features: [], gallery: [], has_plunge_pool: true }
  const items = getPublicFAQs(settings, [room])
  assert.match(items.find((item) => item.question.includes('extra guests'))!.answer, /500.*per extra guest, per night/)
  assert.match(items.find((item) => item.question.includes('security deposit'))!.answer, /5,000/)
  assert.equal(items.some((item) => item.question.includes('private plunge pool')), true)
  assert.match(getPublicFAQs({ ...settings, extra_person_fee: 0 }, []).find((item) => item.question.includes('extra guests'))!.answer, /no extra-person fee/)
})
