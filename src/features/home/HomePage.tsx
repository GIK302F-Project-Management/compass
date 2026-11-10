import { PlanSummaryStrip } from '@/features/collaboration/PlanSummaryStrip'
import { Atlas } from '@/features/activities/Atlas'
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
  const showRoute = route !== null && progress.ready // the tasks it schedules have loaded

  return (
    <>
      <AppHeader title="Your atlas" />
      <Main>
        <div className={route ? 'home-layout with-trail' : 'home-layout'}>
          <div className="home-main">
            <PlanSummaryStrip plan={plan} />
            {route && showRoute && (
              <TodayCard
                route={route}
                taskById={progress.taskById}
                isDone={progress.isDone}
                onToggle={progress.toggle}
              />
            )}
            {progress.problem && <p role="alert">{progress.problem}</p>}
            <Atlas />
          </div>
          {route && showRoute && (
            <RouteTrail
              route={route}
              taskById={progress.taskById}
              isDone={progress.isDone}
              onToggle={progress.toggle}
            />
          )}
        </div>
      </Main>
    </>
  )
}
