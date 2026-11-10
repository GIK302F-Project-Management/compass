import { API_URL } from './config'
import { endSession, getSession } from '@/shared/session/session'

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

// A request the backend answered with an error status. `fieldErrors` holds the messages of a 400
// ({ errors: { title: "..." } }), so a form can show each one next to its field.
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, fieldErrors: Record<string, string> = {}) {
    super(`The server answered ${status}`)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type JsonRequest = { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown }

// apiFetch for JSON endpoints: sends `body` as JSON and returns the answer as JSON (undefined for 204).
// Any other failure status throws an ApiError, so callers only write the happy path and the cases they can explain.
export async function apiJson(path: string, { method = 'GET', body }: JsonRequest = {}): Promise<unknown> {
  const response = await apiFetch(path, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (!response.ok) {
    throw new ApiError(response.status, readFieldErrors(await response.json().catch(() => null)))
  }
  return response.status === 204 ? undefined : response.json()
}

function readFieldErrors(body: unknown): Record<string, string> {
  const errors = typeof body === 'object' && body !== null ? (body as { errors?: unknown }).errors : undefined
  if (typeof errors !== 'object' || errors === null) return {}
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => typeof message === 'string')) as Record<
    string,
    string
  >
}
