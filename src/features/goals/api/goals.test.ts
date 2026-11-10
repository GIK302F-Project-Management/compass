import { describe, expect, it } from 'vitest'
import { jsonResponse, makeSession, sentBody, stubFetch } from '@/test/helpers'
import { createGoal, deleteGoal, listGoals, updateGoal } from './goals'
import { getSession, saveSession } from '@/shared/session/session'

const GOAL = {
  id: 7,
  title: 'Pass the Java exam',
  description: 'Review the lectures',
  createdAt: '2026-11-03T10:00:00Z',
}

describe('listGoals', () => {
  it('returns the goals and sends the access token', async () => {
    saveSession(makeSession({ token: 'goal-token' }))
    const fetchMock = stubFetch(jsonResponse([GOAL]))

    expect(await listGoals()).toEqual([GOAL])
    expect(fetchMock.mock.calls[0]![0]).toMatch(/\/goals$/)
    expect((fetchMock.mock.calls[0]![1].headers as Headers).get('Authorization')).toBe('Bearer goal-token')
  })

  it('throws on an answer that is not a list of goals', async () => {
    stubFetch(jsonResponse({ goals: [] }))
    await expect(listGoals()).rejects.toThrow(/not a list/)

    stubFetch(jsonResponse([{ id: 1, title: 'No description or date' }]))
    await expect(listGoals()).rejects.toThrow(/not a goal/)
  })

  it('throws on an unexpected status', async () => {
    stubFetch(new Response(null, { status: 500 }))

    await expect(listGoals()).rejects.toThrow(/500/)
  })

  it('ends the session when the backend refuses the token', async () => {
    saveSession(makeSession())
    stubFetch(new Response(null, { status: 401 }))

    await expect(listGoals()).rejects.toThrow(/401/)
    expect(getSession()).toBeNull()
  })
})

describe('createGoal', () => {
  it('sends the trimmed texts and returns the created goal', async () => {
    const fetchMock = stubFetch(jsonResponse(GOAL, 201))

    const result = await createGoal({ title: '  Pass the Java exam ', description: ' Review the lectures  ' })

    expect(result).toEqual({ ok: true, goal: GOAL })
    expect(fetchMock.mock.calls[0]![1].method).toBe('POST')
    expect(sentBody(fetchMock)).toEqual({ title: 'Pass the Java exam', description: 'Review the lectures' })
  })

  it('returns the messages the backend gives for each field', async () => {
    stubFetch(jsonResponse({ errors: { title: 'Please give the goal a title.', other: 'ignored' } }, 400))

    expect(await createGoal({ title: '', description: '' })).toEqual({
      ok: false,
      error: 'invalid',
      fieldErrors: { title: 'Please give the goal a title.' },
    })
  })

  it('still reports invalid when a 400 has no readable body', async () => {
    stubFetch(new Response('not json', { status: 400 }))

    expect(await createGoal({ title: 'x', description: '' })).toEqual({ ok: false, error: 'invalid', fieldErrors: {} })
  })

  it('throws on an unexpected status', async () => {
    stubFetch(new Response(null, { status: 500 }))

    await expect(createGoal({ title: 'x', description: '' })).rejects.toThrow(/500/)
  })
})

describe('updateGoal', () => {
  it('sends a PUT to the goal and returns the updated goal', async () => {
    const fetchMock = stubFetch(jsonResponse({ ...GOAL, title: 'New title' }))

    const result = await updateGoal(7, { title: 'New title', description: 'Review the lectures' })

    expect(result).toEqual({ ok: true, goal: { ...GOAL, title: 'New title' } })
    expect(fetchMock.mock.calls[0]![0]).toMatch(/\/goals\/7$/)
    expect(fetchMock.mock.calls[0]![1].method).toBe('PUT')
  })

  it('reports a goal that no longer exists', async () => {
    stubFetch(new Response('Goal not found.', { status: 404 }))

    expect(await updateGoal(7, { title: 'x', description: '' })).toEqual({ ok: false, error: 'not-found' })
  })

  it('returns the messages the backend gives for each field', async () => {
    stubFetch(jsonResponse({ errors: { description: 'The description must have at most 1000 characters.' } }, 400))

    expect(await updateGoal(7, { title: 'x', description: 'd' })).toEqual({
      ok: false,
      error: 'invalid',
      fieldErrors: { description: 'The description must have at most 1000 characters.' },
    })
  })
})

describe('deleteGoal', () => {
  it('sends a DELETE to the goal', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }))

    await deleteGoal(7)

    expect(fetchMock.mock.calls[0]![0]).toMatch(/\/goals\/7$/)
    expect(fetchMock.mock.calls[0]![1].method).toBe('DELETE')
  })

  it('treats a goal that is already gone as deleted', async () => {
    stubFetch(new Response('Goal not found.', { status: 404 }))

    await expect(deleteGoal(7)).resolves.toBeUndefined()
  })

  it('throws on an unexpected status', async () => {
    stubFetch(new Response(null, { status: 500 }))

    await expect(deleteGoal(7)).rejects.toThrow(/500/)
  })
})
