'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Plus, X, MapPin, ImagePlus } from 'lucide-react'
import { updateRoomAction } from '@/app/actions/admin'
import type { RoomRow } from '@/lib/types/database.types'
import { Field, SectionCard, SaveBar, StatusBadge, type FormStatus } from '@/components/admin/ui'

function TextListEditor({ id, label, values, onChange }: {
  id: string; label: string; values: string[]; onChange: (values: string[]) => void
}) {
  const [newValue, setNewValue] = useState('')
  const trimmed = newValue.trim()
  const canAdd = trimmed.length > 0 && !values.includes(trimmed) && values.length < 100
  function addValue() {
    if (!canAdd) return
    onChange([...values, trimmed])
    setNewValue('')
  }
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="admin-label">{label}</label>
      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {values.map((value) => (
            <li key={value} className="flex max-w-full items-center gap-1 rounded-xl border border-admin-border bg-admin-bg py-1 pl-3 text-sm">
              <span className="min-w-0 break-words">{value}</span>
              <button type="button" onClick={() => onChange(values.filter((item) => item !== value))} aria-label={`Remove ${value}`} className="flex size-10 shrink-0 items-center justify-center rounded-lg text-admin-muted hover:text-red-300"><X aria-hidden="true" className="size-4" /></button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-admin-muted">No items added yet.</p>}
      <div className="flex gap-2">
        <input id={id} value={newValue} onChange={(event) => setNewValue(event.target.value)} maxLength={200} className="admin-input flex-1" placeholder={`Add ${label.toLowerCase()}`}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addValue() } }} />
        <button type="button" onClick={addValue} disabled={!canAdd} className="admin-button-secondary shrink-0"><Plus aria-hidden="true" className="size-4" /><span>Add</span></button>
      </div>
    </div>
  )
}

export function RoomEditForm({ room }: { room: RoomRow }) {
  const router = useRouter()
  const [draft, setDraft] = useState({
    name: room.name, category: room.category, location: room.location ?? '',
    size_sqm: room.size_sqm?.toString() ?? '', bed_type: room.bed_type ?? '',
    regular_rate: String(room.regular_rate), min_guests: String(room.min_guests), max_guests: String(room.max_guests),
    has_plunge_pool: room.has_plunge_pool, is_active: room.is_active,
    tagline: room.tagline ?? '', description: room.description ?? '',
    amenities: room.amenities, features: room.features, gallery: room.gallery,
  })
  const [newImage, setNewImage] = useState('')
  const [imageError, setImageError] = useState('')
  const [pending, setPending] = useState(false)
  const [status, setStatus] = useState<FormStatus>(null)

  const isDirty = (
    draft.name !== room.name ||
    draft.category !== room.category ||
    draft.location !== (room.location ?? '') ||
    draft.size_sqm !== (room.size_sqm?.toString() ?? '') ||
    draft.bed_type !== (room.bed_type ?? '') ||
    draft.regular_rate !== String(room.regular_rate) ||
    draft.min_guests !== String(room.min_guests) ||
    draft.max_guests !== String(room.max_guests) ||
    draft.has_plunge_pool !== room.has_plunge_pool ||
    draft.is_active !== room.is_active ||
    draft.tagline !== (room.tagline ?? '') ||
    draft.description !== (room.description ?? '') ||
    draft.amenities.length !== room.amenities.length ||
    draft.amenities.some((v, i) => v !== room.amenities[i]) ||
    draft.features.length !== room.features.length ||
    draft.features.some((v, i) => v !== room.features[i]) ||
    draft.gallery.length !== room.gallery.length ||
    draft.gallery.some((v, i) => v !== room.gallery[i])
  )

  function update<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function addImage() {
    const value = newImage.trim()
    if (!value || draft.gallery.includes(value)) return
    let valid = /^\/(?!\/)/.test(value)
    try { valid ||= ['http:', 'https:'].includes(new URL(value).protocol) } catch { /* Local image paths are allowed. */ }
    if (!valid) { setImageError('Enter a local image path or an HTTP(S) link.'); return }
    update('gallery', [...draft.gallery, value])
    setNewImage('')
    setImageError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setPending(true)
    setStatus(null)
    try {
      const result = await updateRoomAction({
        ...draft, id: room.id, size_sqm: draft.size_sqm === '' ? null : Number(draft.size_sqm),
        regular_rate: Number(draft.regular_rate), min_guests: Number(draft.min_guests), max_guests: Number(draft.max_guests),
      })
      if (!result.success) { setStatus({ type: 'error', message: result.error }); return }
      setStatus({ type: 'success', message: 'Room changes have been saved.' })
      router.refresh()
    } catch {
      setStatus({ type: 'error', message: 'Could not save the room. Please try again.' })
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} aria-label="Edit room" aria-busy={pending} className="mx-auto max-w-5xl space-y-5">
      <div className="admin-card">
        <div className="relative h-48 bg-admin-hover sm:h-64">
          <Image src={draft.gallery[0] || '/images/beachfront_sunset.png'} alt={draft.name || 'Accommodation'} fill unoptimized className="object-cover" sizes="(min-width: 768px) 75vw, 100vw" />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4 p-4 sm:p-6">
          <div className="min-w-0">
            <p className="mb-2 text-sm text-seabliss-sand">{draft.category}</p>
            <h2 className="break-words font-serif text-3xl">{draft.name || 'Untitled room'}</h2>
            {draft.location && <p className="mt-2 flex items-center gap-2 text-sm text-admin-muted"><MapPin aria-hidden="true" className="size-4 shrink-0" />{draft.location}</p>}
          </div>
          <StatusBadge status={draft.is_active ? 'active' : 'inactive'} />
        </div>
      </div>

      <fieldset disabled={pending} className="min-w-0 space-y-5">
        <SectionCard title="Room details" description="The basic details guests see when choosing their stay.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="room-name" label="Room name" value={draft.name} onChange={(event) => update('name', event.target.value)} maxLength={100} required />
            <div><label htmlFor="room-category" className="admin-label">Category</label>
              <select id="room-category" value={draft.category} onChange={(event) => update('category', event.target.value as RoomRow['category'])} className="admin-input">
                <option>Villa</option><option>Couple Suite</option><option>Family Suite</option>
              </select>
            </div>
            <Field id="room-location" label="Location or wing" value={draft.location} onChange={(event) => update('location', event.target.value)} maxLength={200} />
            <Field id="room-size" label="Room size (m²)" type="number" inputMode="numeric" min={0} max={100_000} step={1} value={draft.size_sqm} onChange={(event) => update('size_sqm', event.target.value)} placeholder="Optional" />
            <Field id="room-beds" label="Bed configuration" value={draft.bed_type} onChange={(event) => update('bed_type', event.target.value)} maxLength={200} className="sm:col-span-2" />
          </div>
        </SectionCard>

        <SectionCard title="Price and capacity" description="Set the nightly room price and guest capacity.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="room-rate" label="Nightly rate (PHP)" type="number" inputMode="numeric" min={0} max={2_147_483_647} step={1} value={draft.regular_rate} onChange={(event) => update('regular_rate', event.target.value)} className="sm:col-span-2" required />
            <Field id="room-min-guests" label="Minimum guests" type="number" inputMode="numeric" min={1} max={Number(draft.max_guests) || 500} step={1} value={draft.min_guests} onChange={(event) => update('min_guests', event.target.value)} required />
            <Field id="room-max-guests" label="Maximum guests" type="number" inputMode="numeric" min={Number(draft.min_guests) || 1} max={500} step={1} value={draft.max_guests} onChange={(event) => update('max_guests', event.target.value)} required />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-admin-border p-4 text-sm">
              <input type="checkbox" checked={draft.has_plunge_pool} onChange={(event) => update('has_plunge_pool', event.target.checked)} className="size-5 shrink-0 accent-seabliss-sand" />Private plunge pool
            </label>
            <label className="flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border border-admin-border p-4 text-sm">
              <input type="checkbox" checked={draft.is_active} onChange={(event) => update('is_active', event.target.checked)} className="size-5 shrink-0 accent-seabliss-sand" />Available for bookings
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Descriptions">
          <Field id="room-tagline" label="Short summary" value={draft.tagline} onChange={(event) => update('tagline', event.target.value)} maxLength={300} />
          <div><label htmlFor="room-description" className="admin-label">Full description</label>
            <textarea id="room-description" rows={5} value={draft.description} onChange={(event) => update('description', event.target.value)} maxLength={5000} className="admin-input resize-y" />
          </div>
        </SectionCard>

        <SectionCard title="Amenities and inclusions" description="Add individual items, then remove any that no longer apply.">
          <TextListEditor id="room-amenities" label="Amenities" values={draft.amenities} onChange={(values) => update('amenities', values)} />
          <div className="border-t border-admin-border pt-5"><TextListEditor id="room-features" label="Package inclusions" values={draft.features} onChange={(values) => update('features', values)} /></div>
        </SectionCard>

        <SectionCard title="Photo gallery" description="The first photo is the cover image for this room.">
          {draft.gallery.length > 0 ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {draft.gallery.map((url, index) => (
                <li key={url} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-admin-border bg-admin-bg">
                  <Image src={url} alt={`${draft.name}, photo ${index + 1}`} fill unoptimized className="object-cover" sizes="(min-width: 768px) 25vw, 50vw" />
                  {index === 0 && <span className="absolute bottom-2 left-2 rounded-md bg-admin-bg/90 px-2 py-1 text-xs font-medium">Cover photo</span>}
                  <button type="button" onClick={() => update('gallery', draft.gallery.filter((image) => image !== url))} aria-label={`Remove photo ${index + 1}`} className="absolute right-2 top-2 flex size-10 items-center justify-center rounded-lg bg-admin-bg/90 text-white hover:text-red-300"><X aria-hidden="true" className="size-4" /></button>
                </li>
              ))}
            </ul>
          ) : <div className="rounded-xl border border-dashed border-admin-border p-8 text-center text-admin-muted"><ImagePlus aria-hidden="true" className="mx-auto mb-3 size-7" /><p className="text-sm">Add photos to help guests explore the room.</p></div>}
          <div>
            <label htmlFor="room-new-photo" className="admin-label">Photo link or image path</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input id="room-new-photo" value={newImage} onChange={(event) => { setNewImage(event.target.value); setImageError('') }} maxLength={2048} className="admin-input flex-1" aria-invalid={!!imageError} aria-describedby={imageError ? 'room-photo-error' : undefined} placeholder="https://… or /images/…"
                onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addImage() } }} />
              <button type="button" onClick={addImage} disabled={!newImage.trim() || draft.gallery.includes(newImage.trim()) || draft.gallery.length >= 100} className="admin-button-secondary shrink-0"><Plus aria-hidden="true" className="size-4" />Add photo</button>
            </div>
            {imageError && <p id="room-photo-error" role="alert" className="mt-2 text-sm text-red-300">{imageError}</p>}
          </div>
        </SectionCard>
      </fieldset>
      <SaveBar pending={pending} dirty={isDirty} status={status} label="Save room changes" />
    </form>
  )
}
