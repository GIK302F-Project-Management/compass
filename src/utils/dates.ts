// Due dates are stored as YYYY-MM-DD; build the date by parts so it is not shifted by the timezone.
export function parseDueDate(dueDate: string) {
  const [year = 0, month = 1, day = 1] = dueDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDueDate(dueDate: string) {
  return parseDueDate(dueDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

// The local calendar day as YYYY-MM-DD (toISOString would give the UTC day, which can be yesterday or tomorrow).
export function toIsoDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function addDays(isoDate: string, days: number) {
  const date = parseDueDate(isoDate)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

// Whole days from one YYYY-MM-DD date to another (negative when `to` is earlier).
export function daysBetween(from: string, to: string) {
  return Math.round((parseDueDate(to).getTime() - parseDueDate(from).getTime()) / 86_400_000)
}

export function todayIso() {
  return toIsoDate(new Date())
}

// 45 -> "45m", 120 -> "2h", 135 -> "2h 15m"
export function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest}m`
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`
}
