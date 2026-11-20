import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-seabliss-linen px-5 py-12 text-center sm:px-8">
      <div className="mx-auto max-w-xl">
        <Image src="/images/branding/emblem.svg" alt="" width={72} height={72} className="mx-auto mb-6" priority />
        <p className="text-sm font-medium tracking-wide text-seabliss-teal">Lian, Batangas · Philippines</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight text-seabliss-aegean sm:text-6xl">Seabliss Beach Resort</h1>
        <p className="mt-5 text-base leading-relaxed text-seabliss-slate">Private coastal stays, time by the water, and room to unwind in Lian, Batangas.</p>
        <Link href="/admin" className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-seabliss-aegean px-6 py-3 text-sm font-medium text-white hover:bg-seabliss-teal focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-seabliss-teal">Resort management</Link>
      </div>
    </main>
  )
}
