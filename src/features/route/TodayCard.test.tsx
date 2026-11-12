import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { addDays, todayIso } from '@/shared/utils/dates'
import type { SavedRoute } from './api/savedRoute'
import { TodayCard } from './TodayCard'

const TODAY = todayIso()

// Yesterday one session (done), today two (one done), tomorrow one.
const ROUTE: SavedRoute = {
  source: 'llm',
  status: 'ready',
  sessions: [
    { goalId: 't1', title: 'Read chapter 1', date: addDays(TODAY, -1), durationMinutes: 60 },
    { goalId: 't1', title: 'Read chapter 2', date: TODAY, durationMinutes: 60 },
    { goalId: 't2', title: 'Write intro', date: TODAY, durationMinutes: 30 },
    { goalId: 't2', title: 'Write the rest', date: addDays(TODAY, 1), durationMinutes: 45 },
  ],
  warnings: [],
  request: { startDate: addDays(TODAY, -1), dailyAvailableMinutes: 120, goals: [] },
  goals: {},
  checked: [0, 1],
  createdAt: '2026-11-01T09:00:00Z',
}

describe('TodayCard', () => {
  it('counts the sessions of today, not of the whole route', () => {
    render(
      <MemoryRouter>
        <TodayCard
          route={ROUTE}
          taskById={new Map()}
          isDone={(index) => ROUTE.checked.includes(index)}
          onToggle={vi.fn()}
        />
      </MemoryRouter>,
    )

    expect(screen.getByText('Today on your route')).toBeInTheDocument()
    expect(screen.getByText('1 of 2 done')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Sessions done today' })).toHaveAttribute('aria-valuemax', '2')
    expect(screen.getByRole('link', { name: 'See full route →' })).toHaveAttribute('href', '/planner')
  })
})
