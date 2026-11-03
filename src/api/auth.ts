import { normalizeEmail } from '../validation/register'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export type RegisterInput = {
  name: string
  email: string
  password: string
}

export type RegisterResult = { ok: true } | { ok: false; error: 'email-taken' | 'invalid-email' }

// POST /user/register on compass-backend: 201 -> created, 409 -> email already registered,
// 400 -> validation failed ({ errors: { field: message } }). Any other status is unexpected and throws.
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

  if (response.status === 201) {
    return { ok: true }
  }
  if (response.status === 409) {
    return { ok: false, error: 'email-taken' }
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

export type LoginResult = { ok: true; name: string } | { ok: false; error: 'not-found' | 'wrong-password' }

// POST /user/login on compass-backend: 404 -> no account, 401 -> wrong password.
export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const email = normalizeEmail(input.email)
  const response = await fetch(`${API_URL}/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: input.password }),
  })

  if (response.ok) {
    // The backend only answers "Welcome, <name>!", so the name is read from that text.
    const message = await response.text()
    const name = /^Welcome, (.+)!$/.exec(message)?.[1] ?? email
    return { ok: true, name }
  }
  if (response.status === 404) {
    return { ok: false, error: 'not-found' }
  }
  if (response.status === 401) {
    return { ok: false, error: 'wrong-password' }
  }
  throw new Error(`Unexpected login response: ${response.status}`)
}
