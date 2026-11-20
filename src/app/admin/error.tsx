'use client'

import { AlertCircle } from 'lucide-react'

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <section role="alert" className="admin-card mx-auto max-w-xl px-5 py-10 text-center sm:p-10">
      <AlertCircle aria-hidden="true" className="mx-auto mb-4 size-8 text-seabliss-sand" />
      <h2 className="font-serif text-3xl">Unable to load this page</h2>
      <p className="my-4 text-sm leading-relaxed text-admin-muted">Please try again. If the problem continues, contact the resort administrator.</p>
      <button type="button" onClick={reset} className="admin-button-primary">Try again</button>
    </section>
  )
}
