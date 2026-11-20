import Link from 'next/link'
import { SearchX } from 'lucide-react'

export default function AdminNotFound() {
  return (
    <section className="admin-card mx-auto max-w-xl px-5 py-10 text-center sm:p-10">
      <SearchX aria-hidden="true" className="mx-auto mb-4 size-8 text-seabliss-sand" />
      <h2 className="font-serif text-3xl">Nothing here</h2>
      <p className="my-4 text-sm leading-relaxed text-admin-muted">This room or reservation could not be found. It may have been removed, or the link may be incorrect.</p>
      <Link href="/admin" className="admin-button-primary">Back to dashboard</Link>
    </section>
  )
}
