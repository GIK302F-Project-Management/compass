// Logged-in user kept in localStorage. The backend has no tokens yet, so this
// only remembers who logged in; it does not protect any route.

export type Session = {
  name: string
  email: string
}

const STORAGE_KEY = 'compass.session'

export function getSession(): Session | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
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
