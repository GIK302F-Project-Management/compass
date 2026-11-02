import { createMockUser, findMockUserByEmail } from '../mocks/users'
import { isUniversityEmail, normalizeEmail } from '../validation/register'

export type RegisterInput = {
  name: string
  email: string
  password: string
}

export type RegisterResult = { ok: true } | { ok: false; error: 'email-taken' | 'invalid-email' }

// Mock implementation. When the backend is ready, replace the body with
// POST /auth/register and map 409 -> 'email-taken', 400 -> 'invalid-email'.
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const email = normalizeEmail(input.email)

  if (!isUniversityEmail(email)) {
    return { ok: false, error: 'invalid-email' }
  }
  if (findMockUserByEmail(email)) {
    return { ok: false, error: 'email-taken' }
  }

  await createMockUser(input.name.trim(), email, input.password)
  return { ok: true }
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

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
