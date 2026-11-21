'use client'

import Image from 'next/image'
import { useState } from 'react'
import { safeResortImageSource } from '@/lib/public/images'

export default function ResortImage({ src, alt, sizes, preload = false }: { src?: string; alt: string; sizes: string; preload?: boolean }) {
  const [failed, setFailed] = useState<string | null>(null)
  const source = safeResortImageSource(src)
  if (!source || failed === source) return <div className="public-photo-fallback"><span>Seabliss</span><p>Photography is being updated.</p></div>
  return <Image src={source} alt={alt} fill sizes={sizes} preload={preload} onError={() => setFailed(source)} />
}
