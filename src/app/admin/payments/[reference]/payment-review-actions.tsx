'use client'

import { useRef, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, X } from 'lucide-react'
import { adminReviewPaymentAction } from '@/app/actions/admin'
import type { BookingStatus, PaymentReviewStatus } from '@/lib/types/database.types'
import { FormFeedback, type FormStatus } from '@/components/admin/ui'

export function PaymentReviewActions({ submissionId, currentStatus, bookingStatus }: {
  submissionId: string; currentStatus: PaymentReviewStatus; bookingStatus: BookingStatus
}) {
  const router = useRouter()
  const dialog = useRef<HTMLDialogElement>(null)
  const [pending, setPending] = useState<'approved' | 'rejected' | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [status, setStatus] = useState<FormStatus>(null)
  const [reviewed, setReviewed] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  async function review(decision: 'approved' | 'rejected') {
    if (pending) return
    setPending(decision)
    setStatus(null)
    try {
      const result = await adminReviewPaymentAction({ paymentSubmissionId: submissionId, decision, rejectionReason: decision === 'rejected' ? rejectionReason.trim() : undefined })
      if (!result.success) { setStatus({ type: 'error', message: result.error }); return }
      setReviewed(true)
      setStatus({ type: 'success', message: decision === 'approved' ? 'Payment has been approved.' : 'Receipt has been rejected.' })
      dialog.current?.close()
      router.refresh()
    } catch {
      setStatus({ type: 'error', message: 'Could not review this payment. Please try again.' })
    } finally {
      setPending(null)
    }
  }

  function submitRejection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void review('rejected')
  }

  if (currentStatus !== 'pending') return <p className="rounded-xl bg-admin-bg p-4 text-sm leading-relaxed text-admin-muted">This receipt has already been {currentStatus}.</p>
  if (['cancelled', 'rejected', 'completed'].includes(bookingStatus)) return <p className="rounded-xl bg-admin-bg p-4 text-sm text-admin-muted">This reservation is closed and cannot accept payment reviews.</p>

  return (
    <div className="space-y-3 border-t border-admin-border pt-5">
      {!dialogOpen && <FormFeedback status={status} />}
      {!reviewed && <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button type="button" disabled={!!pending} onClick={() => void review('approved')} className="admin-button-primary">
          {pending === 'approved' ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <CheckCircle2 aria-hidden="true" className="size-4" />}{pending === 'approved' ? 'Approving…' : 'Approve payment'}
        </button>
        <button type="button" disabled={!!pending} onClick={() => { setStatus(null); dialog.current?.showModal(); setDialogOpen(true) }} className="admin-button-secondary"><XCircle aria-hidden="true" className="size-4" />Reject receipt</button>
      </div>}
      <dialog ref={dialog} aria-labelledby="reject-title" aria-describedby="reject-description" onClose={() => setDialogOpen(false)} onCancel={(event) => { if (pending) event.preventDefault() }} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-admin-border bg-admin-surface p-5 text-admin-text shadow-2xl backdrop:bg-black/75 sm:p-6">
        <div className="mb-3 flex items-start justify-between gap-3"><h2 id="reject-title" className="pt-2 font-serif text-2xl">Reject receipt</h2><button type="button" disabled={!!pending} aria-label="Close rejection dialog" onClick={() => dialog.current?.close()} className="admin-button-icon shrink-0"><X aria-hidden="true" className="size-4" /></button></div>
        <p id="reject-description" className="mb-5 text-sm leading-relaxed text-admin-muted">Explain why this receipt could not be verified so the guest knows what to correct.</p>
        <form onSubmit={submitRejection} className="space-y-4">
          <label htmlFor="rejection-reason" className="admin-label">Reason for rejection</label>
          <textarea id="rejection-reason" autoFocus rows={4} required minLength={3} maxLength={1000} disabled={!!pending} value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} className="admin-input resize-y" placeholder="For example, the reference number does not match the payment." />
          <FormFeedback status={status} />
          <div className="grid grid-cols-2 gap-3"><button type="button" disabled={!!pending} onClick={() => dialog.current?.close()} className="admin-button-secondary">Cancel</button><button type="submit" disabled={!!pending || rejectionReason.trim().length < 3} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60">{pending === 'rejected' ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}{pending === 'rejected' ? 'Rejecting…' : 'Reject receipt'}</button></div>
        </form>
      </dialog>
    </div>
  )
}
