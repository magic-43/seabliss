// Keep public room images within the existing Next Image remote allowlist.
export function safeResortImageSource(value: string | undefined): string | null {
  if (!value || /[\u0000-\u001f\\]/.test(value)) return null
  if (/^\/(?!\/)/.test(value)) return value
  try {
    const url = new URL(value)
    const host = url.hostname
    const supported = host.endsWith('.supabase.co') || host === 'res.cloudinary.com' || host === 'cms-qxit-bucket.s3.us-west-2.amazonaws.com'
    return url.protocol === 'https:' && supported && !url.username && !url.password && (!url.port || url.port === '443') ? url.href : null
  } catch { return null }
}
