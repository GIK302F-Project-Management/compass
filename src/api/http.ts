import { API_URL } from './config'
import { endSession, getSession } from './session'

// Thrown to tell callers the backend refused the access token (apiFetch has already ended the session).
export class UnauthorizedError extends Error {
  constructor() {
    super('Your session has expired. Please log in again.')
  }
}

// fetch for the endpoints that need a login: adds the access token and handles a refused one.
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const session = getSession()
  const headers = new Headers(init.headers)
  if (session) headers.set('Authorization', `Bearer ${session.token}`)

  const response = await fetch(`${API_URL}${path}`, { ...init, headers })

  // The backend no longer accepts this token (it expired, or the server was restarted with a new key).
  // Ending the session sends the student to the login page. A newer login is left alone.
  if (response.status === 401 && session && getSession()?.token === session.token) {
    endSession('expired')
  }
  return response
}
