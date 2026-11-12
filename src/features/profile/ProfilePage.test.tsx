import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/shared/api/http'
import { getSession, saveSession } from '@/shared/session/session'
import { makeSession } from '@/test/helpers'
import * as profileApi from './api/profile'
import { ProfilePage } from './ProfilePage'

vi.mock('./api/profile', () => ({ getProfile: vi.fn(), updateName: vi.fn() }))

const getProfile = vi.mocked(profileApi.getProfile)
const updateName = vi.mocked(profileApi.updateName)

const PROFILE = { id: '1', name: 'Ana', email: 'ana@alumni.mondragon.edu', createdAt: '2026-09-01T10:00:00Z' }

function renderPage() {
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  saveSession(makeSession({ name: 'Ana' }))
  getProfile.mockResolvedValue(PROFILE)
})

describe('ProfilePage', () => {
  it('shows the profile information', async () => {
    renderPage()

    expect(await screen.findByLabelText('Name')).toHaveValue('Ana')
    expect(screen.getByText('ana@alumni.mondragon.edu')).toBeInTheDocument()
    expect(screen.getByText('Member since')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled() // nothing changed yet
  })

  it('saves a new name and shows it in the top bar too', async () => {
    updateName.mockResolvedValue({ ...PROFILE, name: 'Ana Cecília' })
    renderPage()

    const field = await screen.findByLabelText('Name')
    await userEvent.clear(field)
    await userEvent.type(field, 'Ana Cecília')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(updateName).toHaveBeenCalledWith('Ana Cecília')
    expect(await screen.findByText('Saved.')).toBeInTheDocument()
    expect(getSession()?.name).toBe('Ana Cecília')
  })

  it('asks for a name, and shows what the server refuses', async () => {
    updateName.mockRejectedValue(new ApiError(400, { name: 'The name must have at most 100 characters.' }))
    renderPage()

    const field = await screen.findByLabelText('Name')
    await userEvent.clear(field)
    await userEvent.type(field, ' ')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(screen.getByText('Please enter your name.')).toBeInTheDocument()
    expect(updateName).not.toHaveBeenCalled()

    await userEvent.type(field, 'Someone')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByText('The name must have at most 100 characters.')).toBeInTheDocument()
  })
})
