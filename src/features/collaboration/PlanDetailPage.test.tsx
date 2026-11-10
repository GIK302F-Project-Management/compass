import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as plansApi from '@/shared/api/plans'
import { ApiError } from '@/shared/api/http'
import { makePlan, renderInPlans } from '@/test/plans'
import { PlanDetailPage } from './PlanDetailPage'

vi.mock('@/shared/api/plans', () => ({
  getPlan: vi.fn(),
  getPlanProgress: vi.fn(),
  renamePlan: vi.fn(),
  deletePlan: vi.fn(),
  removeMember: vi.fn(),
  listInvitations: vi.fn(),
  createInvitation: vi.fn(),
  revokeInvitation: vi.fn(),
  invitationLink: (token: string) => `http://app/join/${token}`,
}))

const getPlan = vi.mocked(plansApi.getPlan)
const getPlanProgress = vi.mocked(plansApi.getPlanProgress)
const renamePlan = vi.mocked(plansApi.renamePlan)
const deletePlan = vi.mocked(plansApi.deletePlan)
const removeMember = vi.mocked(plansApi.removeMember)
const listInvitations = vi.mocked(plansApi.listInvitations)

const MEMBERS = [
  { userId: '1', name: 'Ana', owner: true, you: true, joinedAt: '2026-11-03T10:00:00Z' },
  { userId: '2', name: 'Bruno', owner: false, you: false, joinedAt: '2026-11-04T10:00:00Z' },
]
const AS_OWNER = {
  id: '2',
  name: 'Exam group',
  role: 'OWNER' as const,
  createdAt: '2026-11-03T10:00:00Z',
  members: MEMBERS,
}
const AS_MEMBER = {
  ...AS_OWNER,
  role: 'MEMBER' as const,
  members: [
    { ...MEMBERS[0]!, you: false },
    { ...MEMBERS[1]!, you: true },
  ],
}
const PROGRESS = {
  activitiesTotal: 2,
  activitiesDone: 1,
  tasksTotal: 4,
  tasksDone: 2,
  percent: 50,
  members: [{ userId: '1', name: 'Ana', tasksDone: 2, activitiesDone: 1 }],
}

function renderPage(state: Parameters<typeof renderInPlans>[1]['state'] = {}) {
  return renderInPlans(<PlanDetailPage />, {
    path: '/plans/:id',
    url: '/plans/2',
    plans: [makePlan({ id: '1' }), makePlan({ id: '2', name: 'Exam group', memberCount: 2 })],
    state,
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  getPlanProgress.mockResolvedValue(PROGRESS)
  listInvitations.mockResolvedValue([])
})

describe('PlanDetailPage as the owner', () => {
  beforeEach(() => getPlan.mockResolvedValue(AS_OWNER))

  it('shows the progress, the members and the invitation tools', async () => {
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Exam group' })).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('Ana (you)')).toBeInTheDocument()
    expect(screen.getByText('Bruno')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create invitation link' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete plan' })).toBeInTheDocument()
    expect(getPlan).toHaveBeenCalledWith('2')
  })

  it('removes a member after asking, and loads the plan again', async () => {
    removeMember.mockResolvedValue(undefined)
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Remove Bruno' }))

    expect(window.confirm).toHaveBeenCalled()
    expect(removeMember).toHaveBeenCalledWith('2', '2')
    await waitFor(() => expect(getPlan).toHaveBeenCalledTimes(2))
  })

  it('keeps the member when the student does not confirm', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Remove Bruno' }))

    expect(removeMember).not.toHaveBeenCalled()
  })

  it('renames the plan and refreshes the plan list', async () => {
    renamePlan.mockResolvedValue(makePlan({ id: '2', name: 'Finals group' }))
    const reload = vi.fn().mockResolvedValue(undefined)
    renderPage({ reload })

    await userEvent.click(await screen.findByRole('button', { name: 'Rename' }))
    const input = screen.getByLabelText('Plan name')
    await userEvent.clear(input)
    await userEvent.type(input, 'Finals group')
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(renamePlan).toHaveBeenCalledWith('2', 'Finals group'))
    expect(reload).toHaveBeenCalled()
  })

  it('does not rename to an empty name', async () => {
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Rename' }))
    await userEvent.clear(screen.getByLabelText('Plan name'))
    await userEvent.click(screen.getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Please give the plan a name.')).toBeInTheDocument()
    expect(renamePlan).not.toHaveBeenCalled()
  })

  it('deletes the plan after asking and goes back to the plans', async () => {
    deletePlan.mockResolvedValue(undefined)
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Delete plan' }))

    await waitFor(() => expect(deletePlan).toHaveBeenCalledWith('2'))
    expect(await screen.findByText('Somewhere else')).toBeInTheDocument() // navigated to /plans
  })

  it('reports a failure to delete', async () => {
    deletePlan.mockRejectedValue(new Error('offline'))
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Delete plan' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete the plan')
  })
})

describe('PlanDetailPage as a member', () => {
  beforeEach(() => getPlan.mockResolvedValue(AS_MEMBER))

  it('hides the owner tools and lets the student leave', async () => {
    removeMember.mockResolvedValue(undefined)
    renderPage()

    expect(await screen.findByText('Shared with you')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Delete plan' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Rename' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Create invitation link' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Remove/ })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Leave plan' }))

    await waitFor(() => expect(removeMember).toHaveBeenCalledWith('2', '2')) // their own id
    expect(await screen.findByText('Somewhere else')).toBeInTheDocument()
  })

  it('switches to the plan and goes home', async () => {
    const select = vi.fn()
    renderPage({ select })

    await userEvent.click(await screen.findByRole('button', { name: 'Work in this plan' }))

    expect(select).toHaveBeenCalledWith('2')
    expect(await screen.findByText('Somewhere else')).toBeInTheDocument()
  })
})

describe('PlanDetailPage when the plan cannot be shown', () => {
  it('says the plan does not exist on a 404', async () => {
    getPlan.mockRejectedValue(new ApiError(404))
    renderPage()

    expect(await screen.findByText(/does not exist, or you are not part of it/)).toBeInTheDocument()
  })

  it('offers to try again on any other failure', async () => {
    getPlan.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(AS_OWNER)
    renderPage()

    const alert = await screen.findByRole('alert')
    await userEvent.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('heading', { name: 'Exam group' })).toBeInTheDocument()
  })
})
