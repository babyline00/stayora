export function formatPrice(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatRating(r: number): string {
  return r.toFixed(1)
}

export function formatRelativeDate(d: string | Date): string {
  const date = typeof d === 'string' ? new Date(d) : d
  const now = new Date()
  const diff = (now.getTime() - date.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDate(d: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' })
}

export function nightsBetween(checkIn: string | Date, checkOut: string | Date): number {
  const start = typeof checkIn === 'string' ? new Date(checkIn) : checkIn
  const end = typeof checkOut === 'string' ? new Date(checkOut) : checkOut
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 86400000))
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function parseISODate(s: string): Date {
  return new Date(s + 'T00:00:00.000Z')
}

export function classNames(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export const AMENITY_LABELS: Record<string, string> = {
  wifi: 'Wi-Fi', kitchen: 'Kitchen', pool: 'Pool', parking: 'Free parking', ac: 'Air conditioning',
  workspace: 'Dedicated workspace', washer: 'Washer', dryer: 'Dryer', tv: 'TV', heating: 'Heating',
  hot_tub: 'Hot tub', gym: 'Gym', fireplace: 'Fireplace', bbq: 'BBQ grill', balcony: 'Balcony',
  garden: 'Garden', beach_access: 'Beach access', ski_storage: 'Ski storage', ev_charger: 'EV charger',
  security: 'Security system', first_aid: 'First aid kit', smoke_alarm: 'Smoke alarm',
}

export const CATEGORY_LABELS: Record<string, string> = {
  VILLA: 'Villa', APARTMENT: 'Apartment', CABIN: 'Cabin', LOFT: 'Loft',
  TINYHOUSE: 'Tiny house', BOAT: 'Boat', ROOM: 'Private room',
}

export const CANCELLATION_LABELS: Record<string, string> = {
  FLEXIBLE: 'Flexible', MODERATE: 'Moderate', STRICT: 'Strict', SUPER_STRICT: 'Super strict',
}
