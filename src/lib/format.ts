const peso = new Intl.NumberFormat('en-PH', {
  style: 'currency', currency: 'PHP', maximumFractionDigits: 0,
})

export function formatPeso(amount: number): string {
  return peso.format(amount)
}

export function formatDate(value: string, includeTime = false): string {
  const date = new Date(value.length === 10 ? `${value}T00:00:00+08:00` : value)
  if (!Number.isFinite(date.getTime())) return 'Unavailable'
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } as const : {}),
  }).format(date)
}
