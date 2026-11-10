import { describe, expect, it } from 'vitest'
import { jsonResponse, sentBody, stubFetch } from '@/test/helpers'
import {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  setActivityDone,
  updateActivity,
} from './activities'

const ACTIVITY = { id: 3, planId: 1, title: 'Read chapter 4', subject: 'Physics', dueDate: '2026-12-01', done: false }
const EXPECTED = { ...ACTIVITY, id: '3', planId: '1', doneBy: null }

const urlOf = (fetchMock: ReturnType<typeof stubFetch>, call = 0) =>
  String(fetchMock.mock.calls[call]![0]).replace(/^https?:\/\/[^/]+/, '')

describe('activities', () => {
  it('lists the activities of a plan', async () => {
    const fetchMock = stubFetch(jsonResponse([ACTIVITY, { ...ACTIVITY, id: 4, done: true, doneBy: 2 }]))

    const activities = await listActivities('1')

    expect(urlOf(fetchMock)).toBe('/plans/1/activities')
    expect(activities).toEqual([EXPECTED, { ...EXPECTED, id: '4', done: true, doneBy: '2' }])
  })

  it('gives null for an activity that is not there, and throws for other failures', async () => {
    stubFetch(new Response(null, { status: 404 }), new Response(null, { status: 500 }))

    expect(await getActivity('9')).toBeNull()
    await expect(getActivity('9')).rejects.toThrow(/500/)
  })

  it('creates an activity in a plan with trimmed texts', async () => {
    const fetchMock = stubFetch(jsonResponse(ACTIVITY, 201))

    expect(
      await createActivity('1', { title: ' Read chapter 4 ', subject: ' Physics', dueDate: '2026-12-01' }),
    ).toEqual(EXPECTED)
    expect(urlOf(fetchMock)).toBe('/plans/1/activities')
    expect(sentBody(fetchMock)).toEqual({ title: 'Read chapter 4', subject: 'Physics', dueDate: '2026-12-01' })
  })

  it('updates, completes and deletes an activity', async () => {
    const fetchMock = stubFetch(
      jsonResponse(ACTIVITY),
      jsonResponse({ ...ACTIVITY, done: true, doneBy: 5 }),
      new Response(null, { status: 204 }),
    )

    await updateActivity('3', { title: 'New', subject: 'Physics', dueDate: '2026-12-02' })
    expect((await setActivityDone('3', true)).doneBy).toBe('5')
    await deleteActivity('3')

    expect(fetchMock.mock.calls.map(([, init], call) => [init.method, urlOf(fetchMock, call)])).toEqual([
      ['PUT', '/activities/3'],
      ['PUT', '/activities/3/done'],
      ['DELETE', '/activities/3'],
    ])
    expect(sentBody(fetchMock, 1)).toEqual({ done: true })
  })
})
