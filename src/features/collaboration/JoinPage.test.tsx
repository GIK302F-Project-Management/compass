import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as sharingApi from './api/sharing'
import { ApiError } from '@/shared/api/http'
import { JoinPage } from './JoinPage'

vi.mock('./api/sharing', () => ({ previewInvitation: vi.fn(), acceptInvitation: vi.fn() }))

const previewInvitation = vi.mocked(sharingApi.previewInvitation)
const acceptInvitation = vi.mocked(sharingApi.acceptInvitation)

const PREVIEW = {
  activityTitle: 'Group project',
  subject: 'Physics',
  dueDate: '2026-12-01',
  ownerName: 'Ana',
  memberCount: 3,
  alreadyMember: false,
}

function renderPage() {
  render(
    <MemoryRouter initialEntries={['/join/tok123']}>
      <Routes>
        <Route path="/join/:token" element={<JoinPage />} />
        <Route path="/activity/:id" element={<p>Activity page</p>} />
        <Route path="*" element={<p>Somewhere else</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => vi.resetAllMocks())

describe('JoinPage', () => {
  it('says which activity the link is for before joining', async () => {
    previewInvitation.mockResolvedValue(PREVIEW)
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Group project' })).toBeInTheDocument()
    expect(screen.getByText('Ana invited you to')).toBeInTheDocument()
    expect(screen.getByText(/Physics/)).toBeInTheDocument()
    expect(previewInvitation).toHaveBeenCalledWith('tok123')
    expect(acceptInvitation).not.toHaveBeenCalled()
  })

  it('joins and opens the activity, which is now in the atlas', async () => {
    previewInvitation.mockResolvedValue(PREVIEW)
    acceptInvitation.mockResolvedValue('7')
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Join the activity' }))

    await waitFor(() => expect(screen.getByText('Activity page')).toBeInTheDocument())
    expect(acceptInvitation).toHaveBeenCalledWith('tok123')
  })

  it('offers to open the activity when the student is in it already', async () => {
    previewInvitation.mockResolvedValue({ ...PREVIEW, alreadyMember: true })
    renderPage()

    expect(await screen.findByText('This activity is already in your atlas.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open the activity' })).toBeInTheDocument()
  })

  it('explains a link that is expired, revoked or unknown', async () => {
    previewInvitation.mockRejectedValue(new ApiError(404))
    renderPage()

    expect(await screen.findByRole('heading', { name: 'This link does not work' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Join/ })).not.toBeInTheDocument()
  })

  it('tells the student when the activity is full', async () => {
    previewInvitation.mockResolvedValue(PREVIEW)
    acceptInvitation.mockRejectedValue(new ApiError(409))
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Join the activity' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('This activity is full')
    expect(screen.getByRole('button', { name: 'Join the activity' })).toBeEnabled()
  })

  it('reports a failure to check the link that is not a 404', async () => {
    previewInvitation.mockRejectedValue(new Error('offline'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not check the invitation')
  })
})
