import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, type InitialEntry } from 'react-router'
import { describe, expect, it } from 'vitest'
import { getSession } from '@/shared/session/session'
import { GuestOnly } from './RouteGuards'
import { jsonResponse, stubFetch } from '@/test/helpers'
import { LoginPage } from './LoginPage'

const LOGIN_BODY = {
  token: 'jwt-token',
  expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
  user: { id: 1, name: 'Ana', email: 'ana@alumni.mondragon.edu' },
}

function renderLogin(entry: InitialEntry = '/login') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route path="/home" element={<p>home page</p>} />
        <Route path="/plan" element={<p>plan page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function fillAndSubmit(email: string, password: string) {
  const user = userEvent.setup()
  if (email) await user.type(screen.getByLabelText('University email'), email)
  if (password) await user.type(screen.getByLabelText('Password'), password)
  await user.click(screen.getByRole('button', { name: 'Log in' }))
}

describe('LoginPage', () => {
  it('logs in and opens the home page', async () => {
    stubFetch(jsonResponse(LOGIN_BODY))
    renderLogin()

    await fillAndSubmit('ana@alumni.mondragon.edu', 'secret-pass')

    expect(await screen.findByText('home page')).toBeInTheDocument()
    expect(getSession()?.token).toBe('jwt-token')
  })

  it('returns to the page the student wanted', async () => {
    stubFetch(jsonResponse(LOGIN_BODY))
    renderLogin({ pathname: '/login', state: { from: '/plan' } })

    await fillAndSubmit('ana@alumni.mondragon.edu', 'secret-pass')

    expect(await screen.findByText('plan page')).toBeInTheDocument()
  })

  it('shows one message for a wrong email or password and clears the password', async () => {
    stubFetch(new Response('Incorrect email or password.', { status: 401 }))
    renderLogin()

    await fillAndSubmit('ana@alumni.mondragon.edu', 'wrong-pass')

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.')
    expect(screen.getByLabelText('Password')).toHaveValue('')
    expect(screen.getByLabelText('University email')).toHaveValue('ana@alumni.mondragon.edu')
    expect(getSession()).toBeNull()
  })

  it('checks the form before calling the backend', async () => {
    const fetchMock = stubFetch()
    renderLogin()

    await fillAndSubmit('', '')

    expect(screen.getByText('Please enter your university email.')).toBeInTheDocument()
    expect(screen.getByText('Please enter your password.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('says so when the server cannot be reached', async () => {
    stubFetch(new TypeError('Failed to fetch'))
    renderLogin()

    await fillAndSubmit('ana@alumni.mondragon.edu', 'secret-pass')

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server')
  })

  it('removes an error as soon as the student starts typing', async () => {
    stubFetch(new Response(null, { status: 401 }))
    renderLogin()
    await fillAndSubmit('ana@alumni.mondragon.edu', 'wrong-pass')
    await screen.findByRole('alert')

    await userEvent.setup().type(screen.getByLabelText('Password'), 'x')

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  })

  it('explains why the student was sent here after a session ended', () => {
    renderLogin({ pathname: '/login', state: { expired: true } })

    expect(screen.getByRole('status')).toHaveTextContent('Your session has ended')
  })

  it('shows no session notice on a normal visit', () => {
    renderLogin()

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})
