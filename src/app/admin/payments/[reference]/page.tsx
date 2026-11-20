import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Download, ExternalLink, FileText } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin/auth'
import { isValidReferenceNumber } from '@/lib/booking/reference'
import { formatPeso, formatDate } from '@/lib/format'
import { SectionCard, StatusBadge } from '@/components/admin/ui'
import { PaymentReviewActions } from './payment-review-actions'
import type { ReactNode } from 'react'

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-4 py-3 text-sm"><dt className="text-admin-muted">{label}</dt><dd className="min-w-0 break-words text-right font-medium">{children}</dd></div>
}

export default async function AdminPaymentDetailPage({ params, searchParams }: {
  params: Promise<{ reference: string }>; searchParams: Promise<{ receipt?: string }>
}) {
  await requireAdmin()
  const [{ reference }, { receipt }] = await Promise.all([params, searchParams])
  if (!isValidReferenceNumber(reference)) notFound()
  const supabase = createAdminClient()
  const { data: booking, error } = await supabase.from('bookings')
    .select('*, payment_submissions(*), rooms(name, category)').eq('reference_number', reference).maybeSingle()
  if (error) throw new Error('Could not load the reservation. Please try again.')
  if (!booking) notFound()

  const submissions = [...booking.payment_submissions].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  const activeSubmission = submissions.find((submission) => submission.id === receipt)
    ?? submissions.find((submission) => submission.review_status === 'pending') ?? submissions[0]
  let signedUrl: string | undefined
  let downloadUrl: string | undefined
  if (activeSubmission) {
    const bucket = supabase.storage.from('payment-proofs')
    const [preview, download] = await Promise.all([
      bucket.createSignedUrl(activeSubmission.proof_storage_path, 3600),
      bucket.createSignedUrl(activeSubmission.proof_storage_path, 3600, { download: true }),
    ])
    signedUrl = preview.data?.signedUrl
    downloadUrl = download.data?.signedUrl
  }

  return (
    <div className="space-y-5">
      <section className="admin-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-mono text-sm text-seabliss-sand">{booking.reference_number}</p><StatusBadge status={booking.status} /></div>
        <h2 className="mt-4 break-words font-serif text-3xl">{booking.guest_name}</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-admin-border pt-5 sm:grid-cols-3">
          {[['Reservation total', booking.total_amount], ['Verified paid', booking.amount_paid], ['Remaining balance', booking.remaining_balance]].map(([label, value], index) => (
            <div key={label} className={index === 0 ? 'col-span-2 sm:col-span-1' : ''}><p className="text-xs text-admin-muted">{label}</p><p className="mt-1 break-words text-xl font-semibold tabular-nums">{formatPeso(Number(value))}</p></div>
          ))}
        </div>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <SectionCard title="Guest information">
            <dl className="divide-y divide-admin-border">
              <DetailRow label="Name">{booking.guest_name}</DetailRow>
              <DetailRow label="Phone"><a href={`tel:${booking.guest_phone}`} className="underline decoration-admin-border underline-offset-4 hover:text-seabliss-sand">{booking.guest_phone}</a></DetailRow>
              <DetailRow label="Email"><a href={`mailto:${booking.guest_email}`} className="underline decoration-admin-border underline-offset-4 hover:text-seabliss-sand">{booking.guest_email}</a></DetailRow>
              <DetailRow label="Guests">{booking.adult_guests} adults, {booking.child_guests} children</DetailRow>
            </dl>
            {booking.special_requests && <div className="rounded-xl bg-admin-bg p-4"><h3 className="text-sm font-medium">Special requests</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-admin-muted">{booking.special_requests}</p></div>}
          </SectionCard>
          <SectionCard title="Stay details">
            <dl className="divide-y divide-admin-border">
              <DetailRow label="Accommodation">{booking.rooms?.name ?? 'Accommodation unavailable'}</DetailRow>
              <DetailRow label="Check-in">{formatDate(booking.check_in)}</DetailRow>
              <DetailRow label="Check-out">{formatDate(booking.check_out)}</DetailRow>
              <DetailRow label="Duration">{booking.nights} {booking.nights === 1 ? 'night' : 'nights'}</DetailRow>
              <DetailRow label="Payment option">{booking.payment_option === 'half' ? '50% deposit' : 'Full payment'}</DetailRow>
            </dl>
          </SectionCard>
        </div>

        <SectionCard title="Payment receipt" description="Verify the payment against the receiving account before approving.">
          {submissions.length > 1 && (
            <nav aria-label="Payment receipts" className="space-y-2">
              <p className="text-sm font-medium">Receipt history</p>
              <ul className="space-y-2">
                {submissions.map((submission) => (
                  <li key={submission.id}><Link href={`/admin/payments/${reference}?receipt=${submission.id}`} scroll={false} aria-current={activeSubmission?.id === submission.id ? 'true' : undefined}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 ${activeSubmission?.id === submission.id ? 'border-seabliss-sand/60 bg-admin-active/40' : 'border-admin-border hover:bg-admin-hover'}`}>
                    <span className="text-sm"><span className="font-semibold">{formatPeso(submission.amount_claimed)}</span><span className="mt-1 block text-xs text-admin-muted">{formatDate(submission.created_at, true)}</span></span>
                    <StatusBadge status={submission.review_status} />
                  </Link></li>
                ))}
              </ul>
            </nav>
          )}
          {activeSubmission ? (
            <>
              <dl className="divide-y divide-admin-border">
                <DetailRow label="Amount claimed">{formatPeso(activeSubmission.amount_claimed)}</DetailRow>
                <DetailRow label="Payment method">{activeSubmission.payment_method === 'gcash' ? 'GCash' : 'Bank transfer'}</DetailRow>
                <DetailRow label="Submitted">{formatDate(activeSubmission.created_at, true)}</DetailRow>
                <DetailRow label="Review status"><StatusBadge status={activeSubmission.review_status} /></DetailRow>
              </dl>
              {activeSubmission.rejection_reason && <p className="rounded-xl border border-red-800/50 bg-red-950/30 p-4 text-sm leading-relaxed text-red-200">{activeSubmission.rejection_reason}</p>}
              {signedUrl && /\.(jpe?g|png|webp)$/i.test(activeSubmission.proof_storage_path) ? (
                <a href={signedUrl} target="_blank" rel="noopener noreferrer" aria-label="Open full payment receipt in a new tab" className="relative block h-80 overflow-hidden rounded-xl border border-admin-border bg-admin-bg sm:h-96">
                  <Image src={signedUrl} alt="Submitted payment receipt" fill unoptimized className="object-contain" sizes="(min-width: 1280px) 40vw, 100vw" />
                </a>
              ) : <div className="rounded-xl border border-dashed border-admin-border px-4 py-8 text-center text-admin-muted"><FileText aria-hidden="true" className="mx-auto mb-3 size-8" /><p className="text-sm">{signedUrl ? 'Open the file to view this receipt.' : 'Receipt preview is unavailable. Please refresh to try again.'}</p></div>}
              {(signedUrl || downloadUrl) && <div className="flex flex-wrap gap-2">
                {signedUrl && <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="admin-button-secondary flex-1"><ExternalLink aria-hidden="true" className="size-4" />Open receipt</a>}
                {downloadUrl && <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="admin-button-secondary flex-1"><Download aria-hidden="true" className="size-4" />Download</a>}
              </div>}
              <PaymentReviewActions key={activeSubmission.id} submissionId={activeSubmission.id} currentStatus={activeSubmission.review_status} bookingStatus={booking.status} />
            </>
          ) : <div className="py-8 text-center"><FileText aria-hidden="true" className="mx-auto mb-3 size-8 text-seabliss-sand" /><p className="text-base font-medium">No receipt submitted</p><p className="mt-2 text-sm leading-relaxed text-admin-muted">The guest&apos;s payment receipt will appear here when it is submitted.</p></div>}
        </SectionCard>
      </div>
    </div>
  )
}
