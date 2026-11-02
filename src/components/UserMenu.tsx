import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { clearSession, getSession } from '../api/session'

export function UserMenu() {
  const navigate = useNavigate()
  const [session] = useState(getSession)

  if (!session) {
    return (
      <Link to="/login" className="button button-small">
        Log in
      </Link>
    )
  }

  function handleLogout() {
    clearSession()
    navigate('/login')
  }

  return (
    <>
      <span className="user-name" title={session.email}>
        {session.name}
      </span>
      <button type="button" className="button button-small" onClick={handleLogout}>
        Log out
      </button>
    </>
  )
}
