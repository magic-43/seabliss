'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyReferenceButton({ referenceNumber }: { referenceNumber: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referenceNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback if clipboard API is blocked
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
    <button
      type="button"
      onClick={handleCopy}
      className="public-copy-ref-btn inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#195b6d]/10 text-[#195b6d] hover:bg-[#195b6d]/20 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#195b6d]"
      aria-label="Copy booking reference code"
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check size={13} className="text-emerald-600" aria-hidden="true" />
          <span className="text-emerald-700 font-bold">Copied!</span>
        </>
      ) : (
        <>
          <Copy size={13} aria-hidden="true" />
          <span>Copy Code</span>
        </>
      )}
    </button>
  )
}
