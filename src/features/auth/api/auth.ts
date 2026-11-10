import { normalizeEmail } from '../validation/register'
import { API_URL } from '@/shared/api/config'
import { apiFetch } from '@/shared/api/http'
import type { Session } from '@/shared/session/session'

export type RegisterInput = {
  name: string
  email: string
  password: string
}

export type RegisterField = 'name' | 'email' | 'password'

export type RegisterResult =
  { ok: true } | { ok: false; error: 'invalid'; fieldErrors: Partial<Record<RegisterField, string>> }

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
    const body: unknown = await response.json().catch(() => null)
    return { ok: false, error: 'invalid', fieldErrors: readFieldErrors(body) }
  }
  throw new Error(`Unexpected register response: ${response.status}`)
}

// Keeps only the messages the form has a field for: { errors: { email: "..." } } -> { email: "..." }
function readFieldErrors(body: unknown): Partial<Record<RegisterField, string>> {
  const errors = isRecord(body) && isRecord(body.errors) ? body.errors : {}
  const fieldErrors: Partial<Record<RegisterField, string>> = {}
  for (const field of ['name', 'email', 'password'] as const) {
    const message = errors[field]
    if (typeof message === 'string') fieldErrors[field] = message
  }
  return fieldErrors
}

export type LoginInput = {
  email: string
  password: string
}

export type LoginResult = { ok: true; session: Session } | { ok: false; error: 'invalid-credentials' }

// POST /user/login on compass-backend. It answers 401 for both an unknown email and a wrong
// password (on purpose, so nobody can find out which emails have an account).
export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const response = await fetch(`${API_URL}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: normalizeEmail(input.email), password: input.password }),
  })

  if (response.ok) {
    return { ok: true, session: toSession(await response.json()) }
  }
  if (response.status === 401 || response.status === 400) {
    return { ok: false, error: 'invalid-credentials' }
  }
  throw new Error(`Unexpected login response: ${response.status}`)
}

// Never trust the shape of a response blindly: a wrong one must fail here, not deep inside a page.
function toSession(body: unknown): Session {
  if (
    isRecord(body) &&
    typeof body.token === 'string' &&
    typeof body.expiresAt === 'string' &&
    isRecord(body.user) &&
    typeof body.user.name === 'string' &&
    typeof body.user.email === 'string'
  ) {
    return { token: body.token, expiresAt: body.expiresAt, name: body.user.name, email: body.user.email }
  }
  throw new Error('Unexpected login response: missing token or user')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
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
