import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as plansApi from '@/shared/api/plans'
import { ApiError } from '@/shared/api/http'
import { makePlan, renderInPlans } from '@/test/plans'
import { PlansPage } from './PlansPage'

vi.mock('@/shared/api/plans', () => ({ createPlan: vi.fn(), getPlanProgress: vi.fn() }))

const createPlan = vi.mocked(plansApi.createPlan)
const getPlanProgress = vi.mocked(plansApi.getPlanProgress)

const PERSONAL = makePlan({ id: '1', name: 'My plan' })
const SHARED = makePlan({ id: '2', name: 'Exam group', role: 'MEMBER', memberCount: 3 })

function renderPage(options: Parameters<typeof renderInPlans>[1]['state'] = {}) {
  return renderInPlans(<PlansPage />, { path: '/plans', url: '/plans', plans: [PERSONAL, SHARED], state: options })
}

beforeEach(() => {
  vi.resetAllMocks()
  getPlanProgress.mockResolvedValue({
    activitiesTotal: 2,
    activitiesDone: 1,
    tasksTotal: 0,
    tasksDone: 0,
    percent: 50,
    members: [],
  })
})

describe('PlansPage', () => {
  it('lists the plans with their role, members and progress', async () => {
    renderPage()

    const shared = screen.getByRole('heading', { name: 'Exam group' }).closest('article')!
    expect(within(shared).getByText('Member')).toBeInTheDocument()
    expect(within(shared).getByText('3 members')).toBeInTheDocument()
    expect(await within(shared).findByText('50% done')).toBeInTheDocument()
    expect(screen.getByText('You are working in this plan')).toBeInTheDocument()
  })

  it('switches the plan the student works in', async () => {
    const select = vi.fn()
    renderPage({ select })

    await userEvent.click(screen.getByRole('button', { name: 'Work in this plan' }))

    expect(select).toHaveBeenCalledWith('2')
  })

  it('creates a plan, works in it and opens it to invite people', async () => {
    createPlan.mockResolvedValue(makePlan({ id: '9', name: 'Study club' }))
    const reload = vi.fn().mockResolvedValue(undefined)
    renderPage({ reload })

    await userEvent.type(screen.getByLabelText('Plan name'), 'Study club')
    await userEvent.click(screen.getByRole('button', { name: 'Create plan' }))

    await waitFor(() => expect(createPlan).toHaveBeenCalledWith('Study club'))
    expect(reload).toHaveBeenCalledWith('9')
    expect(await screen.findByText('Somewhere else')).toBeInTheDocument() // navigated to /plans/9
  })

  it('asks for a name without calling the backend', async () => {
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Create plan' }))

    expect(screen.getByText('Please give the plan a name.')).toBeInTheDocument()
    expect(createPlan).not.toHaveBeenCalled()
  })

  it('shows the message the backend gives for the name', async () => {
    createPlan.mockRejectedValue(new ApiError(400, { name: 'That name is taken.' }))
    renderPage()

    await userEvent.type(screen.getByLabelText('Plan name'), 'Study club')
    await userEvent.click(screen.getByRole('button', { name: 'Create plan' }))

    expect(await screen.findByText('That name is taken.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create plan' })).toBeEnabled()
  })

  it('reports a failure to create the plan', async () => {
    createPlan.mockRejectedValue(new Error('offline'))
    renderPage()

    await userEvent.type(screen.getByLabelText('Plan name'), 'Study club')
    await userEvent.click(screen.getByRole('button', { name: 'Create plan' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not create the plan')
  })

  it('opens the join page for a pasted link', async () => {
    renderPage()

    await userEvent.type(screen.getByLabelText('Invitation link'), 'https://compass.example/join/abc123')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(await screen.findByText('Somewhere else')).toBeInTheDocument() // navigated to /join/abc123
  })

  it('refuses text that is not an invitation link', async () => {
    renderPage()

    await userEvent.type(screen.getByLabelText('Invitation link'), 'hello there')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByText(/does not look like an invitation link/)).toBeInTheDocument()
  })
})
