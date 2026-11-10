import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { PlannerPage } from './PlannerPage'

// The two planners have their own tests and need a plan and a backend; here only the choice between them matters.
vi.mock('@/features/route/RoutePlanner', () => ({ RoutePlanner: () => <p>planner from activities</p> }))
vi.mock('@/features/plan/QuickPlan', () => ({ QuickPlan: () => <p>planner by hand</p> }))

function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <PlannerPage />
    </MemoryRouter>,
  )
}

describe('PlannerPage', () => {
  it('plans from the activities by default', () => {
    renderAt('/planner')

    expect(screen.getByText('planner from activities')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'From my activities' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'By hand' })).not.toHaveAttribute('aria-current')
  })

  it('plans by hand with ?mode=hand', () => {
    renderAt('/planner?mode=hand')

    expect(screen.getByText('planner by hand')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'By hand' })).toHaveAttribute('aria-current', 'page')
  })

  it('falls back to the activities for an unknown mode', () => {
    renderAt('/planner?mode=whatever')

    expect(screen.getByText('planner from activities')).toBeInTheDocument()
  })
})
