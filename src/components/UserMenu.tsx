import { Link } from 'react-router'
import { endSession } from '../api/session'
import { useSession } from '../hooks/useSession'

export function UserMenu() {
  const session = useSession()

  if (!session) {
    return (
      <Link to="/login" className="button button-small">
        Log in
      </Link>
    )
  }

  // Ending the session is enough: the protected routes see it and send the student to the login page.
  return (
    <>
      <span className="user-name" title={session.email}>
        {session.name}
      </span>
      <button type="button" className="button button-small" onClick={() => endSession('logout')}>
        Log out
      </button>
    </>
  )
}
