// The logged-in student: who they are and the access token the backend gave them.
// Kept in localStorage so a refresh does not log them out, and exposed as a small store
// so every component (and every browser tab) sees a login or logout at once.

export type Session = {
  token: string // sent to the backend as "Authorization: Bearer <token>"
  expiresAt: string // ISO timestamp; after this the backend refuses the token
  userId: string // the student's id on the backend, e.g. to tell which tasks are theirs
  name: string
  email: string
}

// Why the last session ended. The login page uses it to explain a forced logout.
export type EndReason = 'logout' | 'expired'

const STORAGE_KEY = 'compass.session'

const listeners = new Set<() => void>()
let endReason: EndReason | null = null

// useSyncExternalStore needs the same object back until the data changes, so the parsed value is cached.
let cachedRaw: string | null | undefined
let cachedSession: Session | null = null

function parse(raw: string | null): Session | null {
  try {
    const value = JSON.parse(raw ?? 'null')
    const valid =
      typeof value?.token === 'string' &&
      typeof value?.expiresAt === 'string' &&
      typeof value?.userId === 'string' && // sessions saved before the id was kept ask for a new login
      typeof value?.name === 'string' &&
      typeof value?.email === 'string'
    return valid ? value : null
  } catch {
    return null
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}

/** The current session, or null when nobody is logged in or the token has expired. */
export function getSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedSession = parse(raw)
  }
  if (cachedSession && Date.parse(cachedSession.expiresAt) <= Date.now()) return null
  return cachedSession
}

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  // "storage" fires when another tab logs in or out
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  endReason = null
  notify()
}

export function endSession(reason: EndReason) {
  localStorage.removeItem(STORAGE_KEY)
  endReason = reason
  notify()
}

export function getEndReason(): EndReason | null {
  return endReason
}
