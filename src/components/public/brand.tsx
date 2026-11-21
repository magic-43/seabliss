import Image from 'next/image'
import Link from 'next/link'

export default function Brand({ onNavigate }: { onNavigate?: () => void }) {
  return <Link href="/#home" onClick={onNavigate} className="public-brand" aria-label="Seabliss Beach Resort home">
    <Image src="/images/branding/emblem.svg" alt="" width={48} height={48} className="public-brand-mark" />
    <span>Seabliss<small>BEACH RESORT</small></span>
  </Link>
}
