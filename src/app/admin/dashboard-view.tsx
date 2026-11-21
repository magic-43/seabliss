import Link from 'next/link'
import { CreditCard, BedDouble, Receipt, ChevronRight, ArrowDownLeft, Clock3, CircleX } from 'lucide-react'
import { formatPeso, formatDate } from '@/lib/format'
import { StatusBadge } from '@/components/admin/ui'
import type { PaymentSubmissionRow, BookingRow, RoomRow } from '@/lib/types/database.types'

type PaymentActivity = Pick<PaymentSubmissionRow, 'id' | 'amount_claimed' | 'payment_method' | 'created_at' | 'review_status'> & {
  bookings: (Pick<BookingRow, 'reference_number' | 'guest_name'> & { rooms: Pick<RoomRow, 'name'> | null }) | null
}
const paymentDay = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Manila', day: '2-digit', month: 'long', year: 'numeric' })

export default function DashboardView({ totalRevenue, activeRooms, submissions }: {
  totalRevenue: number; activeRooms: number; submissions: PaymentActivity[]
}) {
  const metrics = [
    { title: 'Verified payments', value: formatPeso(totalRevenue), icon: CreditCard, description: 'Payments approved by the resort' },
    { title: 'Active rooms', value: String(activeRooms), icon: BedDouble, description: 'Available for reservations' },
    { title: 'Transactions', value: String(submissions.length), icon: Receipt, description: 'All payment submissions received' },
  ]
  const groups = new Map<string, PaymentActivity[]>()
  for (const submission of submissions) {
    const day = paymentDay.format(new Date(submission.created_at))
    const group = groups.get(day)
    if (group) group.push(submission)
    else groups.set(day, [submission])
  }

  return (
    <div className="space-y-8 md:space-y-6">
      <section aria-label="Resort summary" className="admin-card flex items-start justify-between gap-4 p-5 md:hidden">
        <div className="min-w-0 flex-1">
          <h2 className="text-[10px] font-semibold uppercase tracking-widest text-admin-muted">Total collected</h2>
          <p className="mt-2 break-words font-serif text-4xl tabular-nums">{formatPeso(totalRevenue)}</p>
        </div>
        <dl className="shrink-0 space-y-4 text-right">
          {[['Active rooms', String(activeRooms)], ['Transactions', String(submissions.length)]].map(([label, value]) => (
            <div key={label}><dt className="text-[9px] font-semibold uppercase tracking-widest text-admin-muted">{label}</dt><dd className="mt-1 text-sm font-semibold tabular-nums">{value}</dd></div>
          ))}
        </dl>
      </section>
      <div className="hidden grid-cols-2 gap-3 md:grid lg:grid-cols-3 lg:gap-5">
        {metrics.map(({ title, value, icon: Icon, description }, index) => (
          <div key={title} className={`admin-card p-5 ${index === 0 ? 'col-span-2 lg:col-span-1' : ''}`}>
            <div className="flex items-center justify-between gap-3"><p className="text-sm text-admin-muted">{title}</p><Icon aria-hidden="true" className="size-5 shrink-0 text-seabliss-sand" /></div>
            <p className="mt-3 break-words font-serif text-4xl tabular-nums">{value}</p>
            <p className="mt-2 text-xs leading-relaxed text-admin-muted">{description}</p>
          </div>
        ))}
      </div>
      <section aria-label="Payment history" className="min-w-0 md:overflow-hidden md:rounded-2xl md:border md:border-admin-border md:bg-admin-surface">
        <div className="mb-4 px-1 md:mb-0 md:flex md:flex-wrap md:items-center md:justify-between md:gap-2 md:border-b md:border-admin-border md:px-6 md:py-5">
          <div><h2 className="font-serif text-2xl"><span className="md:hidden">Payment History</span><span className="hidden md:inline">Payment activity</span></h2><p className="mt-1 hidden text-sm text-admin-muted md:block">Open a receipt to review its reservation.</p></div>
          <span className="hidden text-sm text-admin-muted md:inline">{submissions.length} {submissions.length === 1 ? 'receipt' : 'receipts'}</span>
        </div>
        {submissions.length === 0 ? (
          <div className="admin-card px-5 py-14 text-center md:rounded-none md:border-0"><CreditCard aria-hidden="true" className="mx-auto mb-4 size-8 text-seabliss-sand" /><h3 className="text-base font-medium">No payment receipts yet</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-admin-muted">Guest payment submissions will appear here when they are ready for review.</p></div>
        ) : (
          <div className="space-y-6 md:space-y-0">
            {[...groups].map(([day, payments]) => (
              <div key={day}>
                <h3 className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-widest text-admin-muted md:hidden">{day}</h3>
                <ul className="divide-y divide-admin-border overflow-hidden rounded-2xl border border-admin-border bg-admin-surface md:rounded-none md:border-0">
                  {payments.map((submission) => {
                    const booking = submission.bookings
                    const approved = submission.review_status === 'approved'
                    const Icon = approved ? ArrowDownLeft : submission.review_status === 'pending' ? Clock3 : CircleX
                    const details = (
                      <>
                        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full border md:hidden ${approved ? 'border-sky-700/50 bg-sky-950/40 text-sky-300' : 'border-admin-border bg-admin-hover text-admin-muted'}`}><Icon aria-hidden="true" className="size-5" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-semibold md:text-base">{booking?.guest_name ?? 'Guest'}</p>
                          <p className="mt-1 break-words text-xs text-admin-muted md:text-sm"><span className="md:hidden">{submission.payment_method === 'gcash' ? 'GCash' : 'Bank transfer'} · </span>{booking?.rooms?.name ?? 'Accommodation unavailable'}</p>
                          <p className="mt-2 hidden font-mono text-xs text-admin-muted md:block">{booking?.reference_number ?? 'Reference unavailable'}</p>
                        </div>
                        <div className="min-w-0 max-w-[45%] space-y-1 text-right">
                          <p className={`break-words text-sm font-semibold tabular-nums md:text-base ${approved ? 'text-emerald-300' : ''}`}>{approved ? '+' : ''}{formatPeso(submission.amount_claimed)}</p>
                          <p className="hidden text-xs text-admin-muted md:block">{submission.payment_method === 'gcash' ? 'GCash' : 'Bank transfer'}</p>
                          <p className="break-all font-mono text-[10px] text-admin-muted md:hidden">{booking?.reference_number ?? 'Reference unavailable'}</p>
                          <div className={approved ? 'hidden md:block' : ''}><StatusBadge status={submission.review_status} /></div>
                          <time dateTime={submission.created_at} className="hidden text-xs text-admin-muted md:block">{formatDate(submission.created_at)}</time>
                        </div>
                        {booking && <ChevronRight aria-hidden="true" className="hidden size-4 shrink-0 text-admin-muted md:block" />}
                      </>
                    )
                    const rowClass = 'flex items-center gap-3 p-4 md:gap-6 md:px-6 md:py-5'
                    return <li key={submission.id}>{booking ? <Link href={`/admin/payments/${booking.reference_number}`} className={`${rowClass} hover:bg-admin-hover/60`}>{details}</Link> : <div className={rowClass}>{details}</div>}</li>
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
