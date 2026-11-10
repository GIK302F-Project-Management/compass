import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { PlanProgress } from '@/shared/api/plans'
import { PlanProgressPanel } from './PlanProgressPanel'

const PROGRESS: PlanProgress = {
  activitiesTotal: 3,
  activitiesDone: 1,
  tasksTotal: 4,
  tasksDone: 3,
  percent: 75,
  members: [
    { userId: '1', name: 'Ana', tasksDone: 2, activitiesDone: 1 },
    { userId: '2', name: 'Bruno', tasksDone: 1, activitiesDone: 0 },
  ],
}

describe('PlanProgressPanel', () => {
  it('shows the overall progress and what each member completed', () => {
    render(<PlanProgressPanel progress={PROGRESS} />)

    expect(screen.getByText('75%')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Plan progress' })).toHaveAttribute('aria-valuenow', '75')
    expect(screen.getByText(/1 of 3 activities done · 3 of 4 tasks done/)).toBeInTheDocument()

    const bruno = screen.getByRole('row', { name: /Bruno/ })
    expect(
      within(bruno)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['1', '0'])
  })

  it('says there is nothing to track in an empty plan', () => {
    render(
      <PlanProgressPanel
        progress={{ activitiesTotal: 0, activitiesDone: 0, tasksTotal: 0, tasksDone: 0, percent: 0, members: [] }}
      />,
    )

    expect(screen.getByText(/Nothing to track yet/)).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })
})
