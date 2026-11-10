import { Link, useSearchParams } from 'react-router'
import { QuickPlan } from '@/features/plan/QuickPlan'
import { RoutePlanner } from '@/features/route/RoutePlanner'
import { AppHeader } from '@/shared/layout/AppHeader'
import { Main } from '@/shared/layout/Main'
import './PlannerPage.css'

type Mode = 'activities' | 'hand'

// The one place to plan study time. Both ways ask the same planner on the backend; they differ in where the
// goals come from: the tasks of the plan's activities (tracked, with a route to follow), or goals typed in by hand.
export function PlannerPage() {
  const [searchParams] = useSearchParams()
  const mode: Mode = searchParams.get('mode') === 'hand' ? 'hand' : 'activities'

  return (
    <>
      <AppHeader title="Planner" />
      <Main className="planner-page">
        <nav className="planner-modes" aria-label="What to plan from">
          <Link to="/planner" aria-current={mode === 'activities' ? 'page' : undefined}>
            From my activities
          </Link>
          <Link to="/planner?mode=hand" aria-current={mode === 'hand' ? 'page' : undefined}>
            By hand
          </Link>
        </nav>
        {mode === 'hand' ? <QuickPlan /> : <RoutePlanner />}
      </Main>
    </>
  )
}
