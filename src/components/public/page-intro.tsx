import type { ReactNode } from 'react'

export default function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return <header className="public-page-intro public-container"><p className="public-eyebrow">{eyebrow}</p><h1>{title}</h1>{children && <div className="public-page-introduction">{children}</div>}</header>
}
