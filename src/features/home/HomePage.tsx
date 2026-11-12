import { PlanSummaryStrip } from '@/features/collaboration/PlanSummaryStrip'
import { Atlas } from '@/features/activities/Atlas'
import { RouteNotice } from '@/features/route/RouteNotice'
import { RouteTrail } from '@/features/route/RouteTrail'
import { TodayCard } from '@/features/route/TodayCard'
import { useRouteProgress } from '@/features/route/useRouteProgress'
import { AppHeader } from '@/shared/layout/AppHeader'
import { Main } from '@/shared/layout/Main'
import { useActivePlan } from '@/shared/plans/useCurrentPlan'
import type { Plan } from '@/shared/api/plans'
import { useSession } from '@/shared/session/useSession'
import './HomePage.css'

// The landing page after login. It brings two features together: the atlas of activities (activities)
// and what the saved route asks for (route), as a card on small screens and a trail on wide ones.
export function HomePage() {
  const plan = useActivePlan()
  // The route is made for one plan, so switching plans starts the page over (hence the key).
  return <Home key={plan.id} plan={plan} />
}

function Home({ plan }: { plan: Plan }) {
  const session = useSession()
  const progress = useRouteProgress({ ownerEmail: session?.email ?? '', planId: plan.id })
  const route = progress.route

  // The route always has its place: the route itself once its tasks have loaded, otherwise a notice
  // (no route yet, loading, or could not load).
  return (
    <>
      <AppHeader title="Your atlas" />
      <Main>
        <div className="home-layout with-trail">
          <div className="home-main">
            <PlanSummaryStrip plan={plan} />
            {route && progress.status === 'ready' ? (
              <TodayCard
                route={route}
                taskById={progress.taskById}
                isDone={progress.isDone}
                onToggle={progress.toggle}
              />
            ) : (
              progress.status !== 'ready' && (
                <RouteNotice status={progress.status} onRetry={progress.retry} variant="card" />
              )
            )}
            {progress.problem && <p role="alert">{progress.problem}</p>}
            <Atlas />
          </div>
          {route && progress.status === 'ready' ? (
            <RouteTrail
              route={route}
              taskById={progress.taskById}
              isDone={progress.isDone}
              onToggle={progress.toggle}
            />
          ) : (
            progress.status !== 'ready' && (
              <RouteNotice status={progress.status} onRetry={progress.retry} variant="trail" />
            )
          )}
        </div>
      </Main>
    </>
  )
}
