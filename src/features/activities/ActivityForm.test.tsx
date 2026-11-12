import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ActivityForm } from './ActivityForm'

vi.mock('./api/activities', () => ({ createActivity: vi.fn(), updateActivity: vi.fn() }))

function JoinStub() {
  return <p>Invitation {useParams().token}</p>
}

function renderNewSheet() {
  render(
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        <Route path="/home" element={<ActivityForm onSaved={vi.fn()} onCancel={vi.fn()} />} />
        <Route path="/join/:token" element={<JoinStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ActivityForm', () => {
  it('opens the invitation of a pasted link instead of creating a sheet', async () => {
    renderNewSheet()

    await userEvent.click(screen.getByRole('button', { name: 'Have an invitation link?' }))
    await userEvent.type(
      screen.getByLabelText('Invitation link'),
      'http://localhost:5173/join/abcdefghijklmnopqrstuvwxyz',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Open invitation' }))

    expect(await screen.findByText('Invitation abcdefghijklmnopqrstuvwxyz')).toBeInTheDocument()
  })

  it('says so when the pasted text is not an invitation link, and can go back to creating', async () => {
    renderNewSheet()

    await userEvent.click(screen.getByRole('button', { name: 'Have an invitation link?' }))
    await userEvent.type(screen.getByLabelText('Invitation link'), 'my group project')
    await userEvent.click(screen.getByRole('button', { name: 'Open invitation' }))

    expect(screen.getByText(/Paste the whole invitation link/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Create one instead' }))
    expect(screen.getByLabelText('Name')).toBeInTheDocument()
  })
})
