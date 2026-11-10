import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as plansApi from '@/shared/api/plans'
import { saveSession } from '@/shared/session/session'
import { makePlan } from '@/test/plans'
import { makeSession } from '@/test/helpers'
import { CurrentPlanProvider } from './CurrentPlanProvider'
import { useCurrentPlan } from './useCurrentPlan'

vi.mock('@/shared/api/plans', () => ({ listPlans: vi.fn() }))

const listPlans = vi.mocked(plansApi.listPlans)

const PERSONAL = makePlan({ id: '1', name: 'My plan' })
const SHARED = makePlan({ id: '2', name: 'Exam group', memberCount: 3 })
const KEY = 'compass.currentPlan.ana@alumni.mondragon.edu'

function Probe() {
  const state = useCurrentPlan()
  return (
    <>
      <p>status: {state?.status}</p>
      <p>current: {state?.plan?.name ?? 'none'}</p>
      <button onClick={() => state?.select('2')}>pick shared</button>
      <button onClick={() => void state?.reload('2')}>reload to shared</button>
    </>
  )
}

function renderProvider() {
  return render(
    <CurrentPlanProvider>
      <Probe />
    </CurrentPlanProvider>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
  saveSession(makeSession())
})

describe('CurrentPlanProvider', () => {
  it('loads the plans and starts in the first one', async () => {
    listPlans.mockResolvedValue([PERSONAL, SHARED])
    renderProvider()

    expect(screen.getByText('status: loading')).toBeInTheDocument()
    expect(await screen.findByText('status: ready')).toBeInTheDocument()
    expect(screen.getByText('current: My plan')).toBeInTheDocument()
  })

  it('remembers the choice across a refresh', async () => {
    listPlans.mockResolvedValue([PERSONAL, SHARED])
    const first = renderProvider()
    await screen.findByText('status: ready')
    await userEvent.click(screen.getByRole('button', { name: 'pick shared' }))
    expect(screen.getByText('current: Exam group')).toBeInTheDocument()
    expect(localStorage.getItem(KEY)).toBe('2')
    first.unmount()

    renderProvider()

    expect(await screen.findByText('current: Exam group')).toBeInTheDocument()
  })

  it('falls back to the first plan when the remembered one is gone', async () => {
    localStorage.setItem(KEY, '99')
    listPlans.mockResolvedValue([PERSONAL, SHARED])
    renderProvider()

    expect(await screen.findByText('current: My plan')).toBeInTheDocument()
  })

  it('can reload and choose a plan, for example the one just joined', async () => {
    listPlans.mockResolvedValue([PERSONAL])
    renderProvider()
    await screen.findByText('current: My plan')

    listPlans.mockResolvedValue([PERSONAL, SHARED])
    await userEvent.click(screen.getByRole('button', { name: 'reload to shared' }))

    await waitFor(() => expect(screen.getByText('current: Exam group')).toBeInTheDocument())
  })

  it('reports an error when the plans cannot be loaded', async () => {
    listPlans.mockRejectedValue(new Error('offline'))
    renderProvider()

    expect(await screen.findByText('status: error')).toBeInTheDocument()
  })
})
