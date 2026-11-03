import { describe, expect, it } from 'vitest'
import { jsonResponse, makeSession, sentBody, stubFetch } from '../test/helpers'
import { loginUser, registerUser, verifySession } from './auth'
import { getSession, saveSession } from './session'

const LOGIN_BODY = {
  token: 'jwt-token',
  expiresAt: '2026-11-03T14:00:00Z',
  user: { id: 1, name: 'Ana', email: 'ana@alumni.mondragon.edu' },
}

describe('loginUser', () => {
  it('returns the session and sends a normalized email', async () => {
    const fetchMock = stubFetch(jsonResponse(LOGIN_BODY))

    const result = await loginUser({ email: '  ANA@alumni.mondragon.edu ', password: 'secret' })

    expect(result).toEqual({
      ok: true,
      session: {
        token: 'jwt-token',
        expiresAt: '2026-11-03T14:00:00Z',
        name: 'Ana',
        email: 'ana@alumni.mondragon.edu',
      },
    })
    expect(sentBody(fetchMock)).toEqual({ email: 'ana@alumni.mondragon.edu', password: 'secret' })
  })

  it('reports wrong credentials', async () => {
    stubFetch(new Response('Incorrect email or password.', { status: 401 }))

    expect(await loginUser({ email: 'a@alumni.mondragon.edu', password: 'x' })).toEqual({
      ok: false,
      error: 'invalid-credentials',
    })
  })

  it('throws on an unexpected status', async () => {
    stubFetch(new Response(null, { status: 500 }))

    await expect(loginUser({ email: 'a@alumni.mondragon.edu', password: 'x' })).rejects.toThrow(/500/)
  })

  it('throws on an answer that is not a login', async () => {
    stubFetch(jsonResponse({ token: 'only-a-token' }))

    await expect(loginUser({ email: 'a@alumni.mondragon.edu', password: 'x' })).rejects.toThrow(/missing token or user/)
  })
})

describe('registerUser', () => {
  const input = { name: ' Ana ', email: 'ANA@alumni.mondragon.edu', password: 'secret-pass' }

  it('accepts 202 and sends a trimmed name and a normalized email', async () => {
    const fetchMock = stubFetch(jsonResponse({ message: 'ok' }, 202))

    expect(await registerUser(input)).toEqual({ ok: true })
    expect(sentBody(fetchMock)).toEqual({ name: 'Ana', email: 'ana@alumni.mondragon.edu', password: 'secret-pass' })
  })

  it('returns the backend message for each field it names', async () => {
    stubFetch(jsonResponse({ errors: { email: 'Use your university email.', other: 'ignored', password: 7 } }, 400))

    expect(await registerUser(input)).toEqual({
      ok: false,
      error: 'invalid',
      fieldErrors: { email: 'Use your university email.' },
    })
  })

  it('copes with a 400 that has no readable body', async () => {
    stubFetch(new Response('oops', { status: 400 }))

    expect(await registerUser(input)).toEqual({ ok: false, error: 'invalid', fieldErrors: {} })
  })

  it('throws on an unexpected status', async () => {
    stubFetch(new Response(null, { status: 500 }))

    await expect(registerUser(input)).rejects.toThrow(/500/)
  })
})

describe('verifySession', () => {
  it('asks the backend once per token', async () => {
    saveSession(makeSession({ token: 'verified-once' }))
    const fetchMock = stubFetch(jsonResponse({}))

    await verifySession('verified-once')
    await verifySession('verified-once')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(getSession()).not.toBeNull()
  })

  it('ends the session when the token is refused', async () => {
    saveSession(makeSession({ token: 'refused' }))
    stubFetch(new Response(null, { status: 401 }))

    await verifySession('refused')

    expect(getSession()).toBeNull()
  })

  it('keeps the session when the backend cannot be reached', async () => {
    saveSession(makeSession({ token: 'offline' }))
    stubFetch(new TypeError('Failed to fetch'))

    await verifySession('offline')

    expect(getSession()).not.toBeNull()
  })
})
