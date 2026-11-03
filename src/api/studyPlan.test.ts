import { describe, expect, it } from 'vitest'
import { jsonResponse, makeSession, stubFetch } from '../test/helpers'
import { saveSession } from './session'
import { generateStudyPlan, type PlanRequest } from './studyPlan'

const REQUEST: PlanRequest = {
  startDate: '2026-11-03',
  dailyAvailableMinutes: 60,
  goals: [{ id: 'g1', title: 'Learn Java', deadline: '2026-11-10', estimatedMinutes: 120 }],
}

describe('generateStudyPlan', () => {
  it('returns the plan and sends the access token', async () => {
    saveSession(makeSession({ token: 'plan-token' }))
    const plan = { source: 'rule-based', status: 'ready', sessions: [], warnings: [] }
    const fetchMock = stubFetch(jsonResponse(plan))

    expect(await generateStudyPlan(REQUEST)).toEqual({ ok: true, plan })
    expect((fetchMock.mock.calls[0]![1].headers as Headers).get('Authorization')).toBe('Bearer plan-token')
  })

  it.each([
    [400, 'invalid'],
    [401, 'session-expired'],
    [502, 'ai-failed'],
    [503, 'busy'],
    [504, 'timeout'],
  ])('maps status %i to %s', async (status, error) => {
    stubFetch(new Response(null, { status }))

    expect(await generateStudyPlan(REQUEST)).toEqual({ ok: false, error })
  })

  it('throws on a status it does not know', async () => {
    stubFetch(new Response(null, { status: 418 }))

    await expect(generateStudyPlan(REQUEST)).rejects.toThrow(/418/)
  })
})
