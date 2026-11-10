export type TaskValues = {
  title: string
  details: string
  dueDate: string
  estimate: string // hours as typed, e.g. "1.5"; '' when not estimated
}

export type TaskErrors = Partial<Record<keyof TaskValues | 'form', string>>

export const MAX_ESTIMATE_HOURS = 168 // the route planner accepts up to 10080 minutes per task

// "1.5" or "1,5" hours -> 90 minutes. '' -> null (no estimate). Anything else -> NaN.
export function parseEstimate(hours: string): number | null {
  const text = hours.trim().replace(',', '.')
  if (text === '') return null
  const value = Number(text)
  if (!(value > 0) || value > MAX_ESTIMATE_HOURS) return NaN
  return Math.max(1, Math.round(value * 60))
}

// 90 -> "1.5", for showing a stored estimate in an hours field (rounded to quarter hours).
export function estimateToHours(minutes: number | null | undefined) {
  return minutes ? String(Math.round((minutes / 60) * 4) / 4) : ''
}

export function validateTask(values: TaskValues): TaskErrors {
  const errors: TaskErrors = {}

  if (!values.title.trim()) {
    errors.title = 'Please give the task a name.'
  }
  if (Number.isNaN(parseEstimate(values.estimate))) {
    errors.estimate = `Enter the hours as a number between 0.25 and ${MAX_ESTIMATE_HOURS}, e.g. 1.5.`
  }

  return errors
}
