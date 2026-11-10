import { clearSession, getSession } from './session'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

// Thrown when the backend rejects the token (missing, expired or for a deleted account).
export class UnauthorizedError extends Error {
  constructor() {
    super('Your session has expired. Please log in again.')
  }
}

// fetch for protected endpoints: adds the access token and drops the session on 401.
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = getSession()
  if (!session) {
    throw new UnauthorizedError()
  }

  const headers = new Headers(init.headers)
  headers.set('Authorization', `Bearer ${session.token}`)

  const response = await fetch(`${API_URL}${path}`, { ...init, headers })
  if (response.status === 401) {
    clearSession()
    throw new UnauthorizedError()
  }
  return response
}
