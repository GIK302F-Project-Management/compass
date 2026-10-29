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
