export const settingsSections = [
  { id: 'payment', title: 'Payment methods', description: 'Bank and GCash accounts shown to guests.' },
  { id: 'booking', title: 'Booking details', description: 'Stay times, extra guest fees, and deposits.' },
  { id: 'site_details', title: 'Contact details', description: 'Resort address, phone, email, and social pages.' },
] as const

export type SettingsTab = (typeof settingsSections)[number]['id']

export function getSettingsSection(tab: string | null) {
  return settingsSections.find((section) => section.id === tab)
}

export function getAdminPage(pathname: string, tab: string | null) {
  const section = pathname === '/admin/settings' ? getSettingsSection(tab) : undefined
  if (section) return { title: section.title, description: section.description, backHref: '/admin/settings', backLabel: 'Settings', focused: true }
  if (pathname.startsWith('/admin/rooms/')) return { title: 'Edit room', description: 'Manage room details, prices, and photos.', backHref: '/admin/rooms', backLabel: 'Rooms', focused: true }
  if (pathname.startsWith('/admin/payments/')) return { title: 'Payment details', description: 'Check the reservation and verify its receipt.', backHref: '/admin', backLabel: 'Dashboard', focused: true }
  if (pathname === '/admin/rooms') return { title: 'Rooms', description: 'Manage your accommodations and nightly rates.', focused: false }
  if (pathname === '/admin/settings') return { title: 'Settings', description: 'Manage how the resort takes bookings and receives payments.', focused: false }
  return { title: 'Dashboard', description: 'An overview of payments and resort activity.', focused: false }
}

export function isAdminNavActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin' || pathname.startsWith('/admin/payments/')
  return pathname === href || pathname.startsWith(`${href}/`)
}
