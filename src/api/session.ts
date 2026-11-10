// Logged-in user kept in localStorage, with the access token from compass-backend.
// The token is sent as "Authorization: Bearer <token>" on protected endpoints (see api/http.ts).

export type Session = {
  name: string
  email: string
  token: string
  expiresAt: string // ISO instant from the backend
}

const STORAGE_KEY = 'compass.session'

// Returns null when nobody is logged in, or when the stored token has already expired.
export function getSession(): Session | null {
  try {
    const session: Session | null = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (!session?.token || Date.parse(session.expiresAt) <= Date.now()) {
      return null
    }
    return session
  } catch {
    return null
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
}
