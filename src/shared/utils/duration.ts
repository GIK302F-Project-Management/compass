// 45 -> "45m", 120 -> "2h", 135 -> "2h 15m"
export function formatMinutes(total: number) {
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  if (hours === 0) return `${minutes}m`
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

// Reads what a student types for hours: "2", "1.5" and "1,5" are all fine, anything else is not.
export function parseHours(text: string): number | null {
  const normalized = text.trim().replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  return Number(normalized)
}

export function hoursToMinutes(hours: number) {
  return Math.round(hours * 60)
}
