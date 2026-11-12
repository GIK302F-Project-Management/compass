import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as sharingApi from './api/sharing'
import { InvitationsPanel } from './InvitationsPanel'

vi.mock('./api/sharing', () => ({
  listInvitations: vi.fn(),
  createInvitation: vi.fn(),
  revokeInvitation: vi.fn(),
  invitationLink: (token: string) => `http://app/join/${token}`,
}))

const listInvitations = vi.mocked(sharingApi.listInvitations)
const createInvitation = vi.mocked(sharingApi.createInvitation)
const revokeInvitation = vi.mocked(sharingApi.revokeInvitation)

const INVITATION = { id: '5', token: 'tok5', createdAt: '2026-11-03T10:00:00Z', expiresAt: '2026-11-10T10:00:00Z' }

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('InvitationsPanel', () => {
  it('shows the links that still work', async () => {
    listInvitations.mockResolvedValue([INVITATION])
    render(<InvitationsPanel activityId="2" />)

    expect(await screen.findByLabelText('Invitation link')).toHaveValue('http://app/join/tok5')
    expect(listInvitations).toHaveBeenCalledWith('2')
  })

  it('says when there are none', async () => {
    listInvitations.mockResolvedValue([])
    render(<InvitationsPanel activityId="2" />)

    expect(await screen.findByText('No active links.')).toBeInTheDocument()
  })

  it('creates a link and shows it first', async () => {
    listInvitations.mockResolvedValue([INVITATION])
    createInvitation.mockResolvedValue({ ...INVITATION, id: '6', token: 'tok6' })
    render(<InvitationsPanel activityId="2" />)
    await screen.findByLabelText('Invitation link')

    await userEvent.click(screen.getByRole('button', { name: 'Create invitation link' }))

    const links = await screen.findAllByLabelText('Invitation link')
    expect(links.map((link) => (link as HTMLInputElement).value)).toEqual([
      'http://app/join/tok6',
      'http://app/join/tok5',
    ])
  })

  it('copies a link to the clipboard', async () => {
    listInvitations.mockResolvedValue([INVITATION])
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    render(<InvitationsPanel activityId="2" />)

    await userEvent.click(await screen.findByRole('button', { name: 'Copy link' }))

    expect(writeText).toHaveBeenCalledWith('http://app/join/tok5')
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('revokes a link after asking', async () => {
    listInvitations.mockResolvedValue([INVITATION])
    revokeInvitation.mockResolvedValue(undefined)
    render(<InvitationsPanel activityId="2" />)

    await userEvent.click(await screen.findByRole('button', { name: 'Revoke' }))

    expect(revokeInvitation).toHaveBeenCalledWith('2', '5')
    expect(await screen.findByText('No active links.')).toBeInTheDocument()
  })

  it('keeps the link when the revoke fails', async () => {
    listInvitations.mockResolvedValue([INVITATION])
    revokeInvitation.mockRejectedValue(new Error('offline'))
    render(<InvitationsPanel activityId="2" />)

    await userEvent.click(await screen.findByRole('button', { name: 'Revoke' }))

    const alert = await screen.findByRole('alert')
    expect(within(alert.parentElement!).getByLabelText('Invitation link')).toBeInTheDocument()
    expect(alert).toHaveTextContent('Could not revoke the link')
  })
})
