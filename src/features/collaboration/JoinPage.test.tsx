import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as plansApi from '@/shared/api/plans'
import { ApiError } from '@/shared/api/http'
import { makePlan, renderInPlans } from '@/test/plans'
import { JoinPage } from './JoinPage'

vi.mock('@/shared/api/plans', () => ({ previewInvitation: vi.fn(), acceptInvitation: vi.fn() }))

const previewInvitation = vi.mocked(plansApi.previewInvitation)
const acceptInvitation = vi.mocked(plansApi.acceptInvitation)

const PREVIEW = { planName: 'Exam group', ownerName: 'Ana', memberCount: 3, alreadyMember: false }

function renderPage(reload = vi.fn().mockResolvedValue(undefined)) {
  renderInPlans(<JoinPage />, { path: '/join/:token', url: '/join/tok123', state: { reload } })
  return reload
}

beforeEach(() => vi.resetAllMocks())

describe('JoinPage', () => {
  it('says which plan the link is for before joining', async () => {
    previewInvitation.mockResolvedValue(PREVIEW)
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Exam group' })).toBeInTheDocument()
    expect(screen.getByText('Ana invited you to')).toBeInTheDocument()
    expect(previewInvitation).toHaveBeenCalledWith('tok123')
    expect(acceptInvitation).not.toHaveBeenCalled()
  })

  it('joins, makes the plan the current one and goes home', async () => {
    previewInvitation.mockResolvedValue(PREVIEW)
    acceptInvitation.mockResolvedValue(makePlan({ id: '7', name: 'Exam group' }))
    const reload = renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Join the plan' }))

    await waitFor(() => expect(screen.getByText('Somewhere else')).toBeInTheDocument())
    expect(acceptInvitation).toHaveBeenCalledWith('tok123')
    expect(reload).toHaveBeenCalledWith('7')
  })

  it('offers to open the plan when the student is in it already', async () => {
    previewInvitation.mockResolvedValue({ ...PREVIEW, alreadyMember: true })
    renderPage()

    expect(await screen.findByText('You are already in this plan.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open the plan' })).toBeInTheDocument()
  })

  it('explains a link that is expired, revoked or unknown', async () => {
    previewInvitation.mockRejectedValue(new ApiError(404))
    renderPage()

    expect(await screen.findByRole('heading', { name: 'This link does not work' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Join/ })).not.toBeInTheDocument()
  })

  it('tells the student when the plan is full', async () => {
    previewInvitation.mockResolvedValue(PREVIEW)
    acceptInvitation.mockRejectedValue(new ApiError(409))
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Join the plan' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('This plan is full')
    expect(screen.getByRole('button', { name: 'Join the plan' })).toBeEnabled()
  })

  it('reports a failure to check the link that is not a 404', async () => {
    previewInvitation.mockRejectedValue(new Error('offline'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not check the invitation')
  })
})
