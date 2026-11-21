import type { Metadata } from 'next'

export function publicMetadata(title: string, description: string, path: string): Metadata {
  return {
    title: title + ' | Seabliss Beach Resort', description,
    alternates: { canonical: path },
    openGraph: { title: title + ' | Seabliss Beach Resort', description, url: path, type: 'website' },
    twitter: { title: title + ' | Seabliss Beach Resort', description, card: 'summary_large_image' },
  }
}
