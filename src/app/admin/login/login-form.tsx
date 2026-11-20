'use client'

import Image from 'next/image'
import { useActionState, useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { adminLoginAction } from '@/app/actions/admin'
import { FormFeedback } from '@/components/admin/ui'

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [state, formAction, pending] = useActionState(adminLoginAction, null)

  return (
    <main className="admin-shell flex min-h-dvh items-center justify-center bg-admin-bg px-4 py-10 text-admin-text sm:px-6">
      <div className="w-full max-w-md">
        <div className="admin-card p-6 sm:p-8">
          <div className="mb-8 text-center">
            <Image src="/images/branding/emblem.svg" alt="" width={56} height={56} className="mx-auto mb-4 size-14" priority />
            <p className="text-sm text-seabliss-sand">Seabliss Beach Resort</p>
            <h1 className="mt-2 font-serif text-3xl">Resort management</h1>
            <p className="mt-2 text-sm leading-relaxed text-admin-muted">Sign in to manage rooms, bookings, and payments.</p>
          </div>
          <form action={formAction} aria-busy={pending} className="space-y-5">
            <FormFeedback status={state?.error ? { type: 'error', message: state.error } : null} />
            <fieldset disabled={pending} className="space-y-5">
              <div>
                <label htmlFor="admin-email" className="admin-label">Email address</label>
                <input id="admin-email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required className="admin-input" />
              </div>
              <div>
                <label htmlFor="admin-password" className="admin-label">Password</label>
                <div className="relative">
                  <input id="admin-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required className="admin-input pr-14" />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute right-1 top-1 flex size-10 items-center justify-center rounded-lg text-admin-muted hover:text-admin-text">
                    {showPassword ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
                  </button>
                </div>
              </div>
            </fieldset>
            <button type="submit" disabled={pending} className="admin-button-primary w-full">{pending && <Loader2 aria-hidden="true" className="size-4 animate-spin" />}{pending ? 'Signing in…' : 'Sign in'}</button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs leading-relaxed text-admin-muted">Seabliss Beach Resort · Lian, Batangas</p>
      </div>
    </main>
  )
}
