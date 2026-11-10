import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router'
import type { Plan } from '@/shared/api/plans'
import { CurrentPlanContext, type CurrentPlanState } from '@/shared/plans/currentPlanContext'

export function makePlan(overrides: Partial<Plan> = {}): Plan {
  return { id: '1', name: 'My plan', role: 'OWNER', memberCount: 1, createdAt: '2026-11-03T10:00:00Z', ...overrides }
}

type Options = {
  path: string // the route pattern, e.g. "/plans/:id"
  url: string // where the student is, e.g. "/plans/2"
  plans?: Plan[]
  current?: Plan
  state?: Partial<CurrentPlanState>
}

/** Renders a page the way the app does behind the login: inside a router and with a current plan. */
export function renderInPlans(page: ReactElement, { path, url, plans, current, state }: Options) {
  const list = plans ?? [current ?? makePlan()]
  const value: CurrentPlanState = {
    status: 'ready',
    plans: list,
    plan: current ?? list[0] ?? null,
    select: () => undefined,
    reload: () => Promise.resolve(),
    ...state,
  }
  return render(
    <CurrentPlanContext.Provider value={value}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path={path} element={page} />
          <Route path="*" element={<p>Somewhere else</p>} />
        </Routes>
      </MemoryRouter>
    </CurrentPlanContext.Provider>,
  )
}
