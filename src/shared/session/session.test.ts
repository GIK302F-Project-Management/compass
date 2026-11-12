import { describe, expect, it, vi } from 'vitest'
import { makeSession } from '@/test/helpers'
import { endSession, getEndReason, getSession, saveSession, subscribeSession } from './session'

describe('session store', () => {
  it('is empty at first', () => {
    expect(getSession()).toBeNull()
  })

  it('remembers a saved session and returns the same object until it changes', () => {
    const session = makeSession()
    saveSession(session)

    expect(getSession()).toEqual(session)
    expect(getSession()).toBe(getSession())
  })

  it.each([
    ['not JSON', 'not json'],
    ['a missing token', JSON.stringify({ expiresAt: 'x', name: 'Ana', email: 'a@b.c' })],
    ['a wrong type', JSON.stringify({ token: 1, expiresAt: 'x', name: 'Ana', email: 'a@b.c' })],
    // saved before the user id was kept: the student logs in again once
    ['no user id', JSON.stringify({ token: 't', expiresAt: '2999-01-01T00:00:00Z', name: 'Ana', email: 'a@b.c' })],
  ])('ignores stored data with %s', (_name, raw) => {
    localStorage.setItem('compass.session', raw)
    expect(getSession()).toBeNull()
  })

  it('treats an expired session as logged out', () => {
    saveSession(makeSession({ expiresAt: new Date(Date.now() - 1000).toISOString() }))
    expect(getSession()).toBeNull()
  })

  it('expires by itself as time passes', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    saveSession(makeSession({ expiresAt: new Date(Date.now() + 5000).toISOString() }))
    expect(getSession()).not.toBeNull()

    vi.advanceTimersByTime(6000)
    expect(getSession()).toBeNull()
  })

  it('records why a session ended, and forgets it on the next login', () => {
    saveSession(makeSession())
    endSession('expired')
    expect(getSession()).toBeNull()
    expect(getEndReason()).toBe('expired')

    saveSession(makeSession())
    expect(getEndReason()).toBeNull()
  })

  it('tells subscribers about every change until they unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeSession(listener)

    saveSession(makeSession())
    endSession('logout')
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    saveSession(makeSession())
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
