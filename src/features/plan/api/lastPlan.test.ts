import { describe, expect, it } from 'vitest'
import { clearLastPlan, loadLastPlan, saveLastPlan, type SavedPlan } from './lastPlan'

const SAVED: SavedPlan = {
  values: { startDate: '2026-11-03', dailyHours: '2', goals: [] },
  request: { startDate: '2026-11-03', dailyAvailableMinutes: 120, goals: [] },
  plan: { source: 'rule-based', status: 'ready', sessions: [], warnings: [] },
  generatedAt: '2026-11-03T12:00:00Z',
}

describe('last plan', () => {
  it('is empty at first', () => {
    expect(loadLastPlan('ana@alumni.mondragon.edu')).toBeNull()
  })

  it('is kept per account', () => {
    saveLastPlan('ana@alumni.mondragon.edu', SAVED)

    expect(loadLastPlan('ana@alumni.mondragon.edu')).toEqual(SAVED)
    expect(loadLastPlan('bob@alumni.mondragon.edu')).toBeNull()
  })

  it('can be cleared without touching other accounts', () => {
    saveLastPlan('ana@alumni.mondragon.edu', SAVED)
    saveLastPlan('bob@alumni.mondragon.edu', SAVED)

    clearLastPlan('ana@alumni.mondragon.edu')

    expect(loadLastPlan('ana@alumni.mondragon.edu')).toBeNull()
    expect(loadLastPlan('bob@alumni.mondragon.edu')).toEqual(SAVED)
  })

  it('ignores stored data that is not a plan', () => {
    localStorage.setItem('compass.lastPlan.ana@alumni.mondragon.edu', JSON.stringify({ plan: 'nope' }))
    expect(loadLastPlan('ana@alumni.mondragon.edu')).toBeNull()

    localStorage.setItem('compass.lastPlan.ana@alumni.mondragon.edu', 'not json')
    expect(loadLastPlan('ana@alumni.mondragon.edu')).toBeNull()
  })
})
