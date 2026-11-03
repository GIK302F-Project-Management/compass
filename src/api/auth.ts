import { normalizeEmail } from '../validation/register'
import { apiFetch } from './http'
import { API_URL } from './config'
import type { Session } from './session'

export type RegisterInput = {
  name: string
  email: string
  password: string
}

export type RegisterResult = { ok: true } | { ok: false; error: 'invalid-email' }

// POST /user/register on compass-backend: 202 -> received, 400 -> validation failed ({ errors: { field: message } }).
// The backend answers 202 both for a new account and for an email that already has one, on purpose, so the
// page cannot tell the two apart. Any other status is unexpected and throws.
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const response = await fetch(`${API_URL}/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name.trim(),
      email: normalizeEmail(input.email),
      password: input.password,
    }),
  })

  if (response.status === 202) {
    return { ok: true }
  }
  if (response.status === 400) {
    // The form already checks name and password, so the email is the field that can still fail here.
    const body = await response.json().catch(() => null)
    if (body?.errors?.email) {
      return { ok: false, error: 'invalid-email' }
    }
  }
  throw new Error(`Unexpected register response: ${response.status}`)
}

export type LoginInput = {
  email: string
  password: string
}

export type LoginResult = { ok: true; session: Session } | { ok: false; error: 'invalid-credentials' }

// POST /user/login on compass-backend: 200 -> { token, expiresAt, user }, 401 -> wrong email or password
// (the backend gives the same answer for both, on purpose). Any other status is unexpected and throws.
export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const response = await fetch(`${API_URL}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizeEmail(input.email), password: input.password }),
  })

  if (response.ok) {
    const body = await response.json()
    return {
      ok: true,
      session: { token: body.token, expiresAt: body.expiresAt, name: body.user.name, email: body.user.email },
    }
  }
  if (response.status === 401) {
    return { ok: false, error: 'invalid-credentials' }
  }
  throw new Error(`Unexpected login response: ${response.status}`)
}

// The token we already confirmed with the backend during this page load.
let verifiedToken: string | null = null

// GET /user/me: asks the backend whether a stored token still works. A refused token ends the session
// (apiFetch does that); a network failure is ignored, because the student may just be offline.
export async function verifySession(token: string): Promise<void> {
  if (verifiedToken === token) return
  try {
    const response = await apiFetch('/user/me')
    if (response.ok) verifiedToken = token
  } catch {
    // offline or server down: keep the session and try again on the next page load
  }
}
