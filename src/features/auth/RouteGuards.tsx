import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { verifySession } from './api/auth'
import { getEndReason } from '@/shared/session/session'
import { useSession } from '@/shared/session/useSession'

export type LoginRedirectState = {
  from?: string // the page the student wanted, to return to after logging in
  expired?: boolean // the session ended by itself, so the login page explains why
}

/** Pages that need a login. Anyone else is sent to the login page and brought back afterwards. */
export function RequireAuth() {
  const session = useSession()
  const location = useLocation()
  const token = session?.token

  // A stored token may be stale (server restarted, account removed): confirm it once per page load.
  useEffect(() => {
    if (token) void verifySession(token)
  }, [token])

  if (!session) {
    const reason = getEndReason()
    const state: LoginRedirectState = {
      from: reason === 'logout' ? undefined : location.pathname + location.search,
      expired: reason === 'expired',
    }
    return <Navigate to="/login" replace state={state} />
  }
  return <Outlet />
}

/** Login and registration pages: a student who is already logged in has no use for them. */
export function GuestOnly() {
  const session = useSession()
  const location = useLocation()

  if (session) {
    return <Navigate to={safeDestination((location.state as LoginRedirectState | null)?.from)} replace />
  }
  return <Outlet />
}

// Only same-site paths: never follow a "from" that could point somewhere else.
function safeDestination(from: string | undefined): string {
  return from && from.startsWith('/') && !from.startsWith('//') ? from : '/home'
}
