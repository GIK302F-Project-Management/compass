import { describe, expect, it } from 'vitest'
import { addDays, daysBetween, formatDueDate, parseDueDate, toIsoDate } from './dates'

describe('dates', () => {
  it('reads YYYY-MM-DD as a local calendar day', () => {
    const date = parseDueDate('2026-11-03')
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 10, 3])
  })

  it('writes a date back as the same local day', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
  })

  it('adds days across month and year ends', () => {
    expect(addDays('2026-11-03', 1)).toBe('2026-11-04')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('counts whole days, also across a daylight saving change', () => {
    expect(daysBetween('2026-11-03', '2026-11-06')).toBe(3)
    expect(daysBetween('2026-11-06', '2026-11-03')).toBe(-3)
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
  })

  it('formats a due date for people', () => {
    expect(formatDueDate('2026-11-06')).toBe('Fri 6 Nov')
  })
})
