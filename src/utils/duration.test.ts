import { describe, expect, it } from 'vitest'
import { formatMinutes, hoursToMinutes, parseHours } from './duration'

describe('formatMinutes', () => {
  it.each([
    [45, '45 min'],
    [60, '1 h'],
    [90, '1 h 30 min'],
    [120, '2 h'],
    [0, '0 min'],
  ])('%i minutes -> %s', (minutes, text) => {
    expect(formatMinutes(minutes)).toBe(text)
  })
})

describe('parseHours', () => {
  it.each([
    ['2', 2],
    ['1.5', 1.5],
    ['1,5', 1.5],
    ['  3 ', 3],
    ['0.25', 0.25],
  ])('accepts %j', (text, hours) => {
    expect(parseHours(text)).toBe(hours)
  })

  it.each(['', 'abc', '-1', '1.555', '1e3', '2h', '1.5.2'])('rejects %j', (text) => {
    expect(parseHours(text)).toBeNull()
  })
})

describe('hoursToMinutes', () => {
  it('rounds to whole minutes', () => {
    expect(hoursToMinutes(1.5)).toBe(90)
    expect(hoursToMinutes(0.01)).toBe(1)
  })
})
