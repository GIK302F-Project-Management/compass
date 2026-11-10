import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_DEADLINE_DAYS,
  MAX_GOALS,
  hasPlanErrors,
  toPlanRequest,
  validatePlan,
  type GoalValues,
  type PlanValues,
} from './plan'

const goal = (overrides: Partial<GoalValues> = {}): GoalValues => ({
  id: 'g1',
  title: 'Learn Java',
  deadline: '2026-11-10',
  hours: '3',
  ...overrides,
})

const plan = (overrides: Partial<PlanValues> = {}): PlanValues => ({
  startDate: '2026-11-03',
  dailyHours: '2',
  goals: [goal()],
  ...overrides,
})

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 10, 3, 12, 0)) // 3 Nov 2026
})

describe('validatePlan', () => {
  it('accepts a good plan', () => {
    expect(hasPlanErrors(validatePlan(plan()))).toBe(false)
  })

  it('refuses a start day in the past', () => {
    expect(validatePlan(plan({ startDate: '2026-11-02' })).startDate).toBeDefined()
    expect(validatePlan(plan({ startDate: '2026-11-03' })).startDate).toBeUndefined()
  })

  it.each(['', 'abc', '0', '25'])('refuses %j hours per day', (dailyHours) => {
    expect(validatePlan(plan({ dailyHours })).dailyHours).toBeDefined()
  })

  it('needs at least one goal and at most the backend limit', () => {
    expect(validatePlan(plan({ goals: [] })).goals).toBeDefined()
    const many = Array.from({ length: MAX_GOALS + 1 }, (_, i) => goal({ id: `g${i}` }))
    expect(validatePlan(plan({ goals: many })).goals).toBeDefined()
  })

  it('checks each goal on its own', () => {
    const errors = validatePlan(plan({ goals: [goal(), goal({ id: 'g2', title: ' ', deadline: '', hours: '' })] }))

    expect(errors.goalErrors.g1).toBeUndefined()
    expect(Object.keys(errors.goalErrors.g2 ?? {}).sort()).toEqual(['deadline', 'hours', 'title'])
  })

  it('keeps deadlines between the start day and a year later', () => {
    expect(validatePlan(plan({ goals: [goal({ deadline: '2026-11-02' })] })).goalErrors.g1?.deadline).toBeDefined()
    expect(validatePlan(plan({ goals: [goal({ deadline: '2026-11-03' })] })).goalErrors.g1?.deadline).toBeUndefined()
    const lastDay = '2027-11-03' // 365 days later
    expect(validatePlan(plan({ goals: [goal({ deadline: lastDay })] })).goalErrors.g1?.deadline).toBeUndefined()
    expect(MAX_DEADLINE_DAYS).toBe(365)
    expect(validatePlan(plan({ goals: [goal({ deadline: '2027-11-04' })] })).goalErrors.g1?.deadline).toBeDefined()
  })

  it('limits one goal to a week of work', () => {
    expect(validatePlan(plan({ goals: [goal({ hours: '168' })] })).goalErrors.g1?.hours).toBeUndefined()
    expect(validatePlan(plan({ goals: [goal({ hours: '169' })] })).goalErrors.g1?.hours).toBeDefined()
  })
})

describe('toPlanRequest', () => {
  it('turns what was typed into what the backend expects', () => {
    const request = toPlanRequest(plan({ dailyHours: '1,5', goals: [goal({ title: '  Learn Java ', hours: '2.5' })] }))

    expect(request).toEqual({
      startDate: '2026-11-03',
      dailyAvailableMinutes: 90,
      goals: [{ id: 'g1', title: 'Learn Java', deadline: '2026-11-10', estimatedMinutes: 150 }],
    })
  })
})
