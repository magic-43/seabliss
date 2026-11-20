import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getAdminPage, getSettingsSection, isAdminNavActive, settingsSections } from '../src/lib/admin/navigation'
import { formatDate, formatPeso } from '../src/lib/format'

test('settings opens a menu on mobile and focuses each valid editing section', () => {
  assert.equal(getAdminPage('/admin/settings', null).focused, false)
  for (const section of settingsSections) {
    const page = getAdminPage('/admin/settings', section.id)
    assert.equal(page.focused, true)
    assert.equal(page.title, section.title)
    assert.equal(page.backHref, '/admin/settings')
  }
})

test('invalid settings sections do not hide the main navigation', () => {
  assert.equal(getSettingsSection('unknown'), undefined)
  assert.equal(getAdminPage('/admin/settings', 'unknown').focused, false)
  assert.equal(getAdminPage('/admin/settings', 'unknown').title, 'Settings')
})

test('editing and payment screens deliberately hide bottom navigation', () => {
  assert.equal(getAdminPage('/admin/rooms', null).focused, false)
  assert.equal(getAdminPage('/admin/rooms/room-id', null).focused, true)
  assert.equal(getAdminPage('/admin/rooms/room-id', null).backHref, '/admin/rooms')
  assert.equal(getAdminPage('/admin/payments/SBL-2026-1234', null).focused, true)
})

test('active navigation respects path segments and keeps payments under dashboard', () => {
  assert.equal(isAdminNavActive('/admin/rooms/example', '/admin/rooms'), true)
  assert.equal(isAdminNavActive('/admin/rooms-other', '/admin/rooms'), false)
  assert.equal(isAdminNavActive('/admin/payments/SBL-2026-1234', '/admin'), true)
  assert.equal(isAdminNavActive('/admin/settings', '/admin'), false)
})

test('shared date and currency formats use the resort locale consistently', () => {
  assert.match(formatPeso(0), /0/)
  assert.match(formatPeso(12345), /12,345/)
  assert.equal(formatDate('2026-11-19'), formatDate('2026-11-18T16:00:00Z'))
  assert.equal(formatDate('not-a-date'), 'Unavailable')
})
