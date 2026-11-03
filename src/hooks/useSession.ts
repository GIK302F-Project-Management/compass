import { useEffect, useSyncExternalStore } from 'react'
import { endSession, getSession, subscribeSession, type Session } from '../api/session'

// setTimeout cannot wait longer than this (about 24 days)
const MAX_TIMER_MS = 2 ** 31 - 1

/** The current session (null when logged out). Logs the student out by itself when the token expires. */
export function useSession(): Session | null {
  const session = useSyncExternalStore(subscribeSession, getSession)
  const expiresAt = session?.expiresAt

  useEffect(() => {
    if (!expiresAt) return
    const delay = Math.min(Math.max(Date.parse(expiresAt) - Date.now(), 0), MAX_TIMER_MS)
    const timer = setTimeout(() => {
      if (Date.parse(expiresAt) <= Date.now()) endSession('expired')
    }, delay)
    return () => clearTimeout(timer)
  }, [expiresAt])

  return session
}
