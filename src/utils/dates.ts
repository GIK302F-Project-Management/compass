// Due dates are stored as YYYY-MM-DD; build the date by parts so it is not shifted by the timezone.
export function parseDueDate(dueDate: string) {
  const [year, month, day] = dueDate.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDueDate(dueDate: string) {
  return parseDueDate(dueDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
