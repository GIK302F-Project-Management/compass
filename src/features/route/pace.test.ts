import { describe, expect, it } from 'vitest'
import type { SavedRoute } from './api/savedRoute'
import { routePace } from './pace'

const TODAY = '2026-11-12'

// Two sessions yesterday (60 + 30), one today (60), one tomorrow (45); 120 minutes a day.
const ROUTE: SavedRoute = {
  source: 'llm',
  status: 'ready',
  sessions: [
    { goalId: 't1', title: 'Read', date: '2026-11-11', durationMinutes: 60 },
    { goalId: 't2', title: 'Write', date: '2026-11-11', durationMinutes: 30 },
    { goalId: 't1', title: 'Read', date: '2026-11-12', durationMinutes: 60 },
    { goalId: 't2', title: 'Write', date: '2026-11-13', durationMinutes: 45 },
  ],
  warnings: [],
  request: { startDate: '2026-11-11', dailyAvailableMinutes: 120, goals: [] },
  goals: {},
  checked: [],
  createdAt: '2026-11-11T09:00:00Z',
}

const pace = (done: number[], route = ROUTE) => routePace(route, (index) => done.includes(index), TODAY)

describe('routePace', () => {
  it('is on track when everything planned before today is done', () => {
    expect(pace([0, 1])).toMatchObject({
      level: 'good',
      label: 'On track',
      expectedMinutes: 90,
      doneMinutes: 90,
      behindMinutes: 0,
      totalMinutes: 195,
    })
  })

  it('is ahead when sessions of today or later are done too', () => {
    expect(pace([0, 1, 3])).toMatchObject({ level: 'good', label: 'Ahead', aheadMinutes: 45 })
  })

  it('does not count today’s sessions as missed yet', () => {
    expect(pace([0, 1]).missedSessions).toBe(0)
  })

  it('is slightly behind up to one study day, and behind beyond that', () => {
    expect(pace([0])).toMatchObject({ level: 'tight', label: 'Slightly behind', behindMinutes: 30, missedSessions: 1 })

    const shortDays = { ...ROUTE, request: { ...ROUTE.request, dailyAvailableMinutes: 60 } }
    expect(pace([], shortDays)).toMatchObject({ level: 'bad', label: 'Behind', behindMinutes: 90, missedSessions: 2 })
  })
})
