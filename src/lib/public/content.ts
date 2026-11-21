import type { ResortSettingsRow, RoomRow } from '../types/database.types'
import { formatPeso } from '../format'

export type PublicRoom = Pick<RoomRow, 'id' | 'slug' | 'name' | 'category' | 'regular_rate' | 'min_guests' | 'max_guests' | 'amenities' | 'features' | 'gallery' | 'has_plunge_pool'>
export type PublicRoomDetails = PublicRoom & Pick<RoomRow, 'tagline' | 'description' | 'size_sqm' | 'bed_type' | 'location'>
export type PublicSettings = Pick<ResortSettingsRow, 'address' | 'contact_email' | 'contact_phone' | 'contact_facebook_url' | 'contact_instagram_url' | 'check_in_time' | 'check_out_time' | 'extra_person_fee' | 'security_deposit'>

export const publicNavigation = [
  { label: 'Home', href: '/' },
  { label: 'Accommodations', href: '/rooms' },
  { label: 'Experiences', href: '/experiences' },
  { label: 'Private Gatherings', href: '/private-gatherings' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const

function webLink(value: string | null | undefined): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null
  } catch { return null }
}

export function getContactLinks(settings: PublicSettings | null) {
  const email = settings?.contact_email?.trim()
  const phone = settings?.contact_phone?.trim()
  const facebook = webLink(settings?.contact_facebook_url)
  const instagram = webLink(settings?.contact_instagram_url)
  const mail = email && /^[^\s@?\r\n]+@[^\s@?\r\n]+\.[^\s@?\r\n]+$/.test(email) ? `mailto:${encodeURIComponent(email).replace('%40', '@')}` : null
  const digits = phone?.replace(/[\s().-]/g, '')
  const telephone = digits && /^\+?\d{7,15}$/.test(digits) ? `tel:${digits}` : null
  // Verified management contact for questions and manual follow-up.
  return { facebook, instagram, mail, telephone, management: facebook ?? mail ?? telephone ?? '/contact' }
}

export function formatStayTime(value: string): string | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(value)
  if (!match) return null
  const hour = Number(match[1])
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? 'PM' : 'AM'}`
}

export function getPublicFAQs(settings: PublicSettings | null, rooms: PublicRoom[] | null) {
  const items = [
    { question: 'Where will you find us?', answer: settings?.address?.trim() || 'Seabliss Beach Resort is in Lian, Batangas, Philippines.' },
    { question: 'How do I arrange a stay?', answer: 'Use Request Your Stay to choose an accommodation, enter your dates and guest information, review the charges, and submit payment proof. An inquiry, booking request, or payment submission does not automatically guarantee accommodation availability. Management will contact you to finalize your stay.' },
  ]
  if (settings) {
    if (Number.isSafeInteger(settings.extra_person_fee) && settings.extra_person_fee >= 0) {
      items.push({
        question: 'Can we arrange a stay with extra guests?',
        answer: `Each accommodation lists its included guest allowance. ${settings.extra_person_fee === 0 ? 'There is currently no extra-person fee.' : `The extra-person fee is ${formatPeso(settings.extra_person_fee)} per extra guest, per night.`} Confirm your full group details with management when planning your stay.`
      })
    }
    const checkIn = formatStayTime(settings.check_in_time)
    const checkOut = formatStayTime(settings.check_out_time)
    if (checkIn && checkOut) items.push({ question: 'What are the check-in and check-out times?', answer: `Check-in is at ${checkIn} and check-out is at ${checkOut}, in Philippine local time. Please speak with management about any specific arrival arrangements.` })
    if (Number.isSafeInteger(settings.security_deposit) && settings.security_deposit > 0) items.push({ question: 'Is there a security deposit?', answer: `A security deposit of ${formatPeso(settings.security_deposit)} is included in the stay's charges. Management can explain the applicable arrangements before you finalize your stay.` })
  }
  if (rooms?.some((room) => room.has_plunge_pool)) items.push({ question: 'Which stays have a private plunge pool?', answer: 'Selected accommodations have a private plunge pool. Look for this detail in the accommodation showcase, then confirm your preferred stay with our team.' })
  return items
}
