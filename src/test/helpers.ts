import { vi } from 'vitest'
import type { Session } from '@/shared/session/session'

/** A session that is valid for another hour. */
export function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    token: 'token-abc',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    name: 'Ana',
    email: 'ana@alumni.mondragon.edu',
    ...overrides,
  }
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

/** Replaces fetch for one test and returns the mock, so the test can read what was sent. */
export function stubFetch(...responses: Array<Response | Error>) {
  const mock = vi.fn()
  for (const response of responses) {
    if (response instanceof Error) mock.mockRejectedValueOnce(response)
    else mock.mockResolvedValueOnce(response)
  }
  vi.stubGlobal('fetch', mock)
  return mock
}

/** The JSON body of the n-th request sent through a fetch mock. */
export function sentBody(mock: ReturnType<typeof vi.fn>, call = 0): unknown {
  return JSON.parse(mock.mock.calls[call]![1].body as string)
}
