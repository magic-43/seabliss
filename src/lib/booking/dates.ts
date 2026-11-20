const DAY_IN_MS = 86_400_000

export function isValidStayDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}

export function calculateNights(checkIn: string, checkOut: string): number {
  if (!isValidStayDate(checkIn) || !isValidStayDate(checkOut) || checkOut <= checkIn) {
    throw new Error('Check-out must be after a valid check-in date')
  }
  return (Date.parse(checkOut) - Date.parse(checkIn)) / DAY_IN_MS
}

export function todayInManila(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())
}
