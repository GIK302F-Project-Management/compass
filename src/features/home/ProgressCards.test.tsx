import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import type { Activity } from '@/features/activities/api/activities'
import type { DeadlineStatus } from '@/features/activities/deadlines'
import type { SavedRoute } from '@/features/route/api/savedRoute'
import { todayIso, addDays } from '@/shared/utils/dates'
import { ProgressCards } from './ProgressCards'

const TODAY = todayIso()

const ROUTE: SavedRoute = {
  source: 'llm',
  status: 'ready',
  sessions: [
    { goalId: 't1', title: 'Read', date: addDays(TODAY, -2), durationMinutes: 120 },
    { goalId: 't1', title: 'Read', date: addDays(TODAY, -1), durationMinutes: 120 },
    { goalId: 't1', title: 'Read', date: addDays(TODAY, 1), durationMinutes: 60 },
  ],
  warnings: [],
  request: { startDate: addDays(TODAY, -2), dailyAvailableMinutes: 60, goals: [] },
  goals: {},
  checked: [],
  createdAt: '2026-11-01T09:00:00Z',
}

function activity(id: string, title: string): Activity {
  return {
    id,
    ownerId: '1',
    role: 'OWNER',
    memberCount: 1,
    title,
    subject: '',
    dueDate: addDays(TODAY, 5),
    done: false,
    doneBy: null,
  }
}

function status(level: DeadlineStatus['level'], label: string): DeadlineStatus {
  return {
    level,
    label,
    remainingMinutes: 300,
    loadMinutes: 400,
    capacityMinutes: 360,
    missingEstimates: 0,
    daysLeft: 5,
  }
}

function renderCards(props: Partial<Parameters<typeof ProgressCards>[0]> = {}) {
  render(
    <MemoryRouter>
      <ProgressCards route={ROUTE} isDone={() => false} activities={[]} statuses={new Map()} {...props} />
    </MemoryRouter>,
  )
}

describe('ProgressCards', () => {
  it('shows in red how far behind the route the student is, and offers to plot it again', () => {
    renderCards()

    const pace = screen.getByRole('region', { name: 'Route pace' })
    expect(pace).toHaveClass('level-bad')
    expect(screen.getByText('4h behind')).toBeInTheDocument()
    expect(screen.getByText(/2 sessions missed/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Re-plot from today' })).toHaveAttribute('href', '/planner?new=1')
  })

  it('shows in green a route that is on schedule, without the re-plot button', () => {
    renderCards({ isDone: (index) => index < 2 })

    expect(screen.getByRole('region', { name: 'Route pace' })).toHaveClass('level-good')
    expect(screen.getByText('Right on schedule')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Re-plot from today' })).not.toBeInTheDocument()
  })

  it('lists the deadlines that need attention, the worst first', () => {
    renderCards({
      activities: [activity('a', 'Essay'), activity('b', 'Lab report'), activity('c', 'Reading')],
      statuses: new Map([
        ['a', status('tight', 'Tight')],
        ['b', status('bad', 'At risk')],
        ['c', status('good', 'On track')],
      ]),
    })

    const deadlines = screen.getByRole('region', { name: 'Deadlines' })
    expect(deadlines).toHaveClass('level-bad')
    expect(screen.getByText('2 need attention')).toBeInTheDocument()
    const titles = screen.getAllByRole('link').filter((link) => link.className === 'deadline-title')
    expect(titles.map((link) => link.textContent)).toEqual(['Lab report', 'Essay'])
    expect(screen.getAllByText(/^5h of work left, due/)).toHaveLength(2)
  })

  it('says in green when every deadline fits, and leaves the pace card out without a route', () => {
    renderCards({
      route: null,
      activities: [activity('c', 'Reading')],
      statuses: new Map([['c', status('good', 'On track')]]),
    })

    expect(screen.queryByRole('region', { name: 'Route pace' })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Deadlines' })).toHaveClass('level-good')
    expect(screen.getByText('Every deadline fits your time')).toBeInTheDocument()
  })
})
