'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import { CreditCard, CalendarDays, Globe, ChevronRight, LogOut } from 'lucide-react'
import { updatePaymentSettings, updateBookingSettings, updateSiteDetails, adminLogoutAction } from '@/app/actions/admin'
import { settingsSections, getSettingsSection, type SettingsTab } from '@/lib/admin/navigation'
import type { ResortSettingsRow } from '@/lib/types/database.types'
import { Field, SectionCard, SaveBar, type FormStatus } from '@/components/admin/ui'

const sectionIcons = { payment: CreditCard, booking: CalendarDays, site_details: Globe }
const saveActions = { payment: updatePaymentSettings, booking: updateBookingSettings, site_details: updateSiteDetails }

export default function SettingsForms({ initialSettings: settings }: { initialSettings: ResortSettingsRow }) {
  const searchParams = useSearchParams()
  const section = getSettingsSection(searchParams.get('tab'))
  const activeTab = section?.id ?? 'payment'
  const [pending, setPending] = useState(false)
  const [statuses, setStatuses] = useState<Record<SettingsTab, FormStatus>>({ payment: null, booking: null, site_details: null })
  const [dirty, setDirty] = useState<Record<SettingsTab, boolean>>({ payment: false, booking: false, site_details: false })

  function handleChange(tab: SettingsTab) {
    if (!dirty[tab]) setDirty((current) => ({ ...current, [tab]: true }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>, tab: SettingsTab) {
    event.preventDefault()
    if (pending) return
    const data = Object.fromEntries(new FormData(event.currentTarget))
    const input = tab === 'booking' ? {
      ...data,
      extra_person_fee: Number(data.extra_person_fee ?? NaN),
      security_deposit: Number(data.security_deposit ?? NaN),
    } : data
    setPending(true)
    setStatuses((current) => ({ ...current, [tab]: null }))
    try {
      const result = await saveActions[tab](input)
      setStatuses((current) => ({ ...current, [tab]: result.success
        ? { type: 'success', message: 'Your changes have been saved.' }
        : { type: 'error', message: result.error } }))
      if (result.success) setDirty((current) => ({ ...current, [tab]: false }))
    } catch {
      setStatuses((current) => ({ ...current, [tab]: { type: 'error', message: 'Could not save changes. Please try again.' } }))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <div className={section ? 'hidden md:block' : ''}>
        <p className="mb-4 text-sm leading-relaxed text-admin-muted md:hidden">Choose a section to update your resort preferences.</p>
        <nav aria-label="Settings sections" className="admin-card divide-y divide-admin-border md:space-y-2 md:divide-y-0 md:overflow-visible md:rounded-none md:border-0 md:bg-transparent">
          {settingsSections.map(({ id, title, description }) => {
            const Icon = sectionIcons[id]
            return (
              <Link key={id} href={`/admin/settings?tab=${id}`} scroll={false} aria-current={activeTab === id ? 'page' : undefined}
                className={`flex items-center gap-3 p-4 md:min-h-11 md:rounded-md md:px-4 md:py-3 ${activeTab === id ? 'md:bg-admin-active' : ''} hover:bg-admin-hover`}>
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-admin-hover text-seabliss-sand md:hidden"><Icon aria-hidden="true" className="size-5" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-admin-text md:font-medium">{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-admin-muted md:hidden">{description}</span>
                </span>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-admin-muted md:hidden" />
              </Link>
            )
          })}
        </nav>
        <div className="mt-6 rounded-2xl border border-admin-border p-4 md:hidden">
          <p className="text-sm font-medium">Resort management</p>
          <p className="mb-3 mt-1 text-sm text-admin-muted">Finished managing the resort?</p>
          <form action={adminLogoutAction}>
            <button type="submit" className="admin-button-secondary w-full"><LogOut aria-hidden="true" className="size-4" /> Sign out</button>
          </form>
        </div>
      </div>

      <div className={`${section ? 'block' : 'hidden md:block'} min-w-0 space-y-6`}>
        {section && <p className="text-sm leading-relaxed text-admin-muted md:hidden">{section.description}</p>}
        <form hidden={activeTab !== 'payment'} onSubmit={(event) => handleSubmit(event, 'payment')} onChange={() => handleChange('payment')} aria-label="Payment methods" aria-busy={pending} className="space-y-5">
          <fieldset disabled={pending} className="min-w-0 space-y-5">
            <SectionCard title="GCash" description="Guests use these details to send their payment.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="gcash_name" name="gcash_name" label="Account name" defaultValue={settings.gcash_name ?? ''} maxLength={100} autoComplete="off" />
                <Field id="gcash_number" name="gcash_number" label="Mobile number" type="tel" inputMode="tel" defaultValue={settings.gcash_number ?? ''} maxLength={20} placeholder="0917 123 4567" autoComplete="off" />
              </div>
            </SectionCard>
            <SectionCard title="Bank transfer" description="Make sure the account details match the receiving bank.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="bank_name" name="bank_name" label="Bank name" defaultValue={settings.bank_name ?? ''} maxLength={100} className="sm:col-span-2" />
                <Field id="bank_account_name" name="bank_account_name" label="Account name" defaultValue={settings.bank_account_name ?? ''} maxLength={100} autoComplete="off" />
                <Field id="bank_account_number" name="bank_account_number" label="Account number" inputMode="numeric" defaultValue={settings.bank_account_number ?? ''} maxLength={50} autoComplete="off" />
              </div>
            </SectionCard>
          </fieldset>
          <SaveBar pending={pending} dirty={dirty.payment} status={statuses.payment} label="Save payment methods" />
        </form>

        <form hidden={activeTab !== 'booking'} onSubmit={(event) => handleSubmit(event, 'booking')} onChange={() => handleChange('booking')} aria-label="Booking details" aria-busy={pending} className="space-y-5">
          <fieldset disabled={pending} className="min-w-0 space-y-5">
            <SectionCard title="Stay times" description="Use the resort's local time in the Philippines.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="check_in_time" name="check_in_time" label="Check-in time" type="time" defaultValue={settings.check_in_time.slice(0, 5)} required />
                <Field id="check_out_time" name="check_out_time" label="Check-out time" type="time" defaultValue={settings.check_out_time.slice(0, 5)} required />
              </div>
            </SectionCard>
            <SectionCard title="Fees and deposits" description="Amounts are in Philippine pesos (PHP).">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="extra_person_fee" name="extra_person_fee" label="Extra guest fee" type="number" inputMode="numeric" min={0} max={2_147_483_647} step={1} defaultValue={settings.extra_person_fee} hint="Per extra guest, per night. Enter 0 for no fee." required />
                <Field id="security_deposit" name="security_deposit" label="Security deposit" type="number" inputMode="numeric" min={0} max={2_147_483_647} step={1} defaultValue={settings.security_deposit} hint="Charged once per stay. Enter 0 for no deposit." required />
              </div>
            </SectionCard>
          </fieldset>
          <SaveBar pending={pending} dirty={dirty.booking} status={statuses.booking} label="Save booking details" />
        </form>

        <form hidden={activeTab !== 'site_details'} onSubmit={(event) => handleSubmit(event, 'site_details')} onChange={() => handleChange('site_details')} aria-label="Contact details" aria-busy={pending} className="space-y-5">
          <fieldset disabled={pending} className="min-w-0 space-y-5">
            <SectionCard title="Contact information" description="The public contact details for Seabliss Beach Resort.">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="contact_email" name="contact_email" label="Email address" type="email" autoComplete="email" defaultValue={settings.contact_email ?? ''} maxLength={254} />
                <Field id="contact_phone" name="contact_phone" label="Phone number" type="tel" autoComplete="tel" defaultValue={settings.contact_phone ?? ''} maxLength={20} />
              </div>
              <div>
                <label htmlFor="address" className="admin-label">Resort address</label>
                <textarea id="address" name="address" defaultValue={settings.address ?? ''} autoComplete="street-address" maxLength={300} rows={3} className="admin-input resize-y" />
              </div>
            </SectionCard>
            <SectionCard title="Social pages" description="Enter the full link, including https://.">
              <div className="space-y-5">
                <Field id="contact_facebook_url" name="contact_facebook_url" label="Facebook" type="url" inputMode="url" defaultValue={settings.contact_facebook_url ?? ''} placeholder="https://www.facebook.com/yourpage" />
              </div>
            </SectionCard>
          </fieldset>
          <SaveBar pending={pending} dirty={dirty.site_details} status={statuses.site_details} label="Save contact details" />
        </form>
      </div>
    </div>
  )
}
