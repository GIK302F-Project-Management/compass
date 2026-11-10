import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { jsonResponse, sentBody, stubFetch } from '@/test/helpers'
import { RegisterPage } from './RegisterPage'

async function fillForm(overrides: Partial<Record<'name' | 'email' | 'password' | 'repeat', string>> = {}) {
  const user = userEvent.setup()
  const values = {
    name: 'Ana',
    email: 'ana@alumni.mondragon.edu',
    password: 'secret-pass',
    repeat: 'secret-pass',
    ...overrides,
  }
  await user.type(screen.getByLabelText('Name'), values.name)
  await user.type(screen.getByLabelText('University email'), values.email)
  await user.type(screen.getByLabelText('Password'), values.password)
  await user.type(screen.getByLabelText('Repeat password'), values.repeat)
  await user.click(screen.getByRole('button', { name: 'Create account' }))
}

function renderRegister() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>,
  )
}

describe('RegisterPage', () => {
  it('creates the account and tells the student to log in', async () => {
    const fetchMock = stubFetch(jsonResponse({ message: 'ok' }, 202))
    renderRegister()

    await fillForm()

    const confirmation = await screen.findByRole('status')
    expect(confirmation).toHaveTextContent("You're on the map, Ana.")
    expect(within(confirmation).getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login')
    expect(sentBody(fetchMock)).toEqual({ name: 'Ana', email: 'ana@alumni.mondragon.edu', password: 'secret-pass' })
  })

  it('does not call the backend while the form has mistakes', async () => {
    const fetchMock = stubFetch()
    renderRegister()

    await fillForm({ repeat: 'different-pass', email: 'ana@gmail.com' })

    expect(screen.getByText('The passwords do not match.')).toBeInTheDocument()
    expect(screen.getByText(/Use your university email/)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses a password longer than the backend allows', async () => {
    const tooLong = 'a'.repeat(73)
    const fetchMock = stubFetch()
    renderRegister()

    await fillForm({ password: tooLong, repeat: tooLong })

    expect(screen.getByText(/The password is too long/)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('shows the backend message next to the field it names', async () => {
    stubFetch(jsonResponse({ errors: { password: 'The password must have between 8 and 72 characters.' } }, 400))
    renderRegister()

    await fillForm()

    expect(await screen.findByText('The password must have between 8 and 72 characters.')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true')
  })

  it('falls back to a general message when the backend names no field', async () => {
    stubFetch(new Response('oops', { status: 400 }))
    renderRegister()

    await fillForm()

    expect(await screen.findByRole('alert')).toHaveTextContent('Compass could not accept these details')
  })

  it('says so when something unexpected happens', async () => {
    stubFetch(new Response(null, { status: 500 }))
    renderRegister()

    await fillForm()

    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong')
  })
})
