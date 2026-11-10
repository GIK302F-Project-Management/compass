import { normalizeEmail } from '../validation/register'
import { apiFetch } from './http'
import { API_URL } from './config'
import type { Session } from './session'

export type RegisterInput = {
  name: string
  email: string
  password: string
}

export type RegisterFieldErrors = Partial<Record<keyof RegisterInput, string>>

export type RegisterResult = { ok: true } | { ok: false; errors: RegisterFieldErrors }

// POST /user/register on compass-backend. It answers 202 even when the email already has an
// account (so nobody can find out which emails are registered), and 400 with
// {"errors": {"email": "..."}} when a field is invalid.
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const response = await fetch(`${API_URL}/user/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: input.name.trim(), email: normalizeEmail(input.email), password: input.password }),
  })

  if (response.ok) {
    return { ok: true }
  }
  if (response.status === 400) {
    const body: { errors?: RegisterFieldErrors } = await response.json().catch(() => ({}))
    return { ok: false, errors: body.errors ?? {} }
  }
  throw new Error(`Unexpected register response: ${response.status}`)
}

export type LoginInput = {
  email: string
  password: string
}

export type LoginResult = { ok: true; session: Session } | { ok: false; error: 'invalid-credentials' }

type LoginResponse = {
  token: string
  expiresAt: string
  user: { id: number; name: string; email: string; createdAt: string }
}

// POST /user/login on compass-backend. It answers 401 for both an unknown email and a wrong
// password (on purpose, so nobody can find out which emails have an account).
export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const response = await fetch(`${API_URL}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizeEmail(input.email), password: input.password }),
  })

  if (response.ok) {
    const body: LoginResponse = await response.json()
    return {
      ok: true,
      session: { name: body.user.name, email: body.user.email, token: body.token, expiresAt: body.expiresAt },
    }
  }
  if (response.status === 401 || response.status === 400) {
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
