// Fake user store kept in localStorage until the backend exists.

type MockUser = {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

const STORAGE_KEY = 'compass.mockUsers'

function loadUsers(): MockUser[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveUsers(users: MockUser[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users))
}

export async function hashPassword(password: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function findMockUserByEmail(email: string) {
  return loadUsers().find((user) => user.email === email)
}

export async function createMockUser(name: string, email: string, password: string) {
  const user: MockUser = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  }
  saveUsers([...loadUsers(), user])
  return user
}
