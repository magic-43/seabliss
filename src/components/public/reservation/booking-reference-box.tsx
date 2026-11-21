'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function BookingReferenceBox({ referenceNumber }: { referenceNumber: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referenceNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers or restricted permissions
      const textArea = document.createElement('textarea')
      textArea.value = referenceNumber
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="my-2.5">
      {/* Booking Reference Container with copy icon inside */}
      <div className="inline-flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5 bg-white border border-[#bcb09e] rounded-lg shadow-xs max-w-full">
        <span
          className="font-mono text-2xl sm:text-3xl font-bold tracking-wider text-[#0c2836] select-all"
          tabIndex={0}
          aria-label={`Booking reference ${referenceNumber}`}
        >
          {referenceNumber}
        </span>

        {/* Copy icon INSIDE the container */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-md text-[#195b6d] hover:bg-[#195b6d]/10 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#195b6d]"
          aria-label="Copy booking reference code"
          title={copied ? 'Copied!' : 'Copy reference code'}
        >
          {copied ? (
            <Check size={20} className="text-emerald-600 shrink-0" aria-hidden="true" />
          ) : (
            <Copy size={20} className="shrink-0" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Mobile wide button under the container */}
      <div className="block sm:hidden w-full max-w-xs mx-auto mt-2">
        <button
          type="button"
          onClick={handleCopy}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#195b6d]/10 text-[#195b6d] border border-[#195b6d]/25 hover:bg-[#195b6d]/20 active:scale-98 transition-all"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-600" aria-hidden="true" />
              <span className="text-emerald-700 font-bold">Reference Code Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} aria-hidden="true" />
              <span>Copy Booking Reference Code</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
