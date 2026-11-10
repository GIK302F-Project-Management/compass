import { describe, expect, it } from 'vitest'
import { makeSession, stubFetch } from '@/test/helpers'
import { apiFetch } from './http'
import { getEndReason, getSession, saveSession } from '@/shared/session/session'

const headersOf = (mock: ReturnType<typeof stubFetch>) => mock.mock.calls[0]![1].headers as Headers

describe('apiFetch', () => {
  it('sends the access token', async () => {
    saveSession(makeSession({ token: 'my-token' }))
    const fetchMock = stubFetch(new Response(null, { status: 200 }))

    await apiFetch('/user/me')

    expect(fetchMock.mock.calls[0]![0]).toBe('http://localhost:8080/user/me')
    expect(headersOf(fetchMock).get('Authorization')).toBe('Bearer my-token')
  })

  it('keeps the headers the caller set', async () => {
    saveSession(makeSession())
    const fetchMock = stubFetch(new Response(null, { status: 200 }))

    await apiFetch('/x', { headers: { 'Content-Type': 'application/json' } })

    expect(headersOf(fetchMock).get('Content-Type')).toBe('application/json')
  })

  it('sends no token when nobody is logged in', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 200 }))

    await apiFetch('/x')

    expect(headersOf(fetchMock).has('Authorization')).toBe(false)
  })

  it('ends the session when the backend refuses the token', async () => {
    saveSession(makeSession())
    stubFetch(new Response(null, { status: 401 }))

    const response = await apiFetch('/x')

    expect(response.status).toBe(401)
    expect(getSession()).toBeNull()
    expect(getEndReason()).toBe('expired')
  })

  it('leaves a newer login alone when an old request is refused', async () => {
    saveSession(makeSession({ token: 'old' }))
    const fetchMock = stubFetch()
    fetchMock.mockImplementationOnce(async () => {
      saveSession(makeSession({ token: 'new' })) // the student logged in again while the request was running
      return new Response(null, { status: 401 })
    })

    await apiFetch('/x')

    expect(getSession()?.token).toBe('new')
  })

  it('keeps the session on other errors', async () => {
    saveSession(makeSession())
    stubFetch(new Response(null, { status: 500 }))

    await apiFetch('/x')

    expect(getSession()).not.toBeNull()
  })
})
