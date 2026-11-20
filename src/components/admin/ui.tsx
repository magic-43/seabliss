import type { InputHTMLAttributes, ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Save } from 'lucide-react'

export type FormStatus = { type: 'success' | 'error'; message: string } | null

export function SectionCard({ title, description, children }: {
  title: string; description?: string; children: ReactNode
}) {
  return (
    <section className="admin-card">
      <div className="border-b border-admin-border px-4 py-5 sm:px-6">
        <h2 className="font-serif text-2xl text-admin-text">{title}</h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-admin-muted">{description}</p>}
      </div>
      <div className="space-y-5 p-4 sm:p-6">{children}</div>
    </section>
  )
}

export function Field({ label, hint, id, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & {
  id: string; label: string; hint?: string
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={id} className="admin-label">{label}</label>
      <input {...props} id={id} className="admin-input" aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && <p id={`${id}-hint`} className="mt-2 text-sm leading-relaxed text-admin-muted">{hint}</p>}
    </div>
  )
}

export function FormFeedback({ status }: { status: FormStatus }) {
  if (!status) return null
  const Icon = status.type === 'error' ? AlertCircle : CheckCircle2
  return (
    <p role={status.type === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 text-sm leading-relaxed ${status.type === 'error' ? 'text-red-300' : 'text-emerald-300'}`}>
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{status.message}</span>
    </p>
  )
}

export function SaveBar({ pending, dirty = true, status, label = 'Save changes' }: {
  pending: boolean; dirty?: boolean; status: FormStatus; label?: string
}) {
  return (
    <div className="admin-savebar">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0"><FormFeedback status={status} /></div>
        <button type="submit" disabled={pending || !dirty} className="admin-button-primary w-full md:w-auto">
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
          {pending ? 'Saving changes…' : label}
        </button>
      </div>
    </div>
  )
}

const statusStyles = {
  pending: ['Needs review', 'border-amber-700/50 bg-amber-950/40 text-amber-200'],
  pending_review: ['Needs review', 'border-amber-700/50 bg-amber-950/40 text-amber-200'],
  awaiting_payment: ['Awaiting payment', 'border-admin-border bg-admin-hover text-admin-muted'],
  approved: ['Approved', 'border-emerald-700/50 bg-emerald-950/40 text-emerald-200'],
  rejected: ['Rejected', 'border-red-800/50 bg-red-950/40 text-red-200'],
  cancelled: ['Cancelled', 'border-admin-border bg-admin-bg text-admin-muted'],
  completed: ['Completed', 'border-admin-border bg-admin-hover text-admin-text'],
  active: ['Active', 'border-emerald-700/50 bg-emerald-950/40 text-emerald-200'],
  inactive: ['Inactive', 'border-admin-border bg-admin-bg text-admin-muted'],
} as const

export function StatusBadge({ status }: { status: keyof typeof statusStyles }) {
  const [label, style] = statusStyles[status]
  return <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium ${style}`}>{label}</span>
}
