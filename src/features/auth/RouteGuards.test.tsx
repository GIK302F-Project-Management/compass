import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation, type InitialEntry } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { endSession, saveSession } from '@/shared/session/session'
import { makeSession } from '@/test/helpers'
import { GuestOnly, RequireAuth } from './RouteGuards'

vi.mock('./api/auth', () => ({ verifySession: vi.fn() }))

// Shows where the student ended up and what the guard told the login page.
function LoginProbe() {
  const location = useLocation()
  return <p>login page {JSON.stringify(location.state)}</p>
}

function renderApp(entry: InitialEntry) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginProbe />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/plan" element={<p>plan page</p>} />
          <Route path="/home" element={<p>home page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

// A logged-out browser that never had a session end (a first visit).
function startLoggedOut() {
  saveSession(makeSession())
  localStorage.removeItem('compass.session')
}

describe('RequireAuth', () => {
  it('sends a visitor to the login page and remembers the page they wanted', () => {
    startLoggedOut()

    renderApp('/plan?x=1')

    expect(screen.getByText(/login page/)).toHaveTextContent('"from":"/plan?x=1"')
    expect(screen.queryByText('plan page')).not.toBeInTheDocument()
  })

  it('explains it when the session ended by itself', () => {
    saveSession(makeSession())
    endSession('expired')

    renderApp('/plan')

    expect(screen.getByText(/login page/)).toHaveTextContent('"expired":true')
  })

  it('does not bring a student back to the page they just logged out from', () => {
    saveSession(makeSession())
    endSession('logout')

    renderApp('/plan')

    expect(screen.getByText(/login page/)).not.toHaveTextContent('from')
    expect(screen.getByText(/login page/)).not.toHaveTextContent('expired":true')
  })

  it('lets a logged-in student through', () => {
    saveSession(makeSession())

    renderApp('/plan')

    expect(screen.getByText('plan page')).toBeInTheDocument()
  })
})

describe('GuestOnly', () => {
  it('sends a logged-in student home', () => {
    saveSession(makeSession())

    renderApp('/login')

    expect(screen.getByText('home page')).toBeInTheDocument()
  })

  it('sends a student who just logged in to the page they wanted', () => {
    saveSession(makeSession())

    renderApp({ pathname: '/login', state: { from: '/plan' } })

    expect(screen.getByText('plan page')).toBeInTheDocument()
  })

  it.each(['//evil.example', 'https://evil.example', 'plan'])(
    'ignores a destination that is not a local path: %s',
    (from) => {
      saveSession(makeSession())

      renderApp({ pathname: '/login', state: { from } })

      expect(screen.getByText('home page')).toBeInTheDocument()
    },
  )

  it('shows the page to a visitor', () => {
    startLoggedOut()

    renderApp('/login')

    expect(screen.getByText(/login page/)).toBeInTheDocument()
  })
})
