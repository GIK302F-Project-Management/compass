import { useMemo } from 'react'
import { Atlas } from '@/features/activities/Atlas'
import { deadlineStatuses } from '@/features/activities/deadlines'
import { useAtlas } from '@/features/activities/useAtlas'
import { RouteNotice } from '@/features/route/RouteNotice'
import { TodayCard } from '@/features/route/TodayCard'
import { useRouteProgress } from '@/features/route/useRouteProgress'
import { AppHeader } from '@/shared/layout/AppHeader'
import { Main } from '@/shared/layout/Main'
import { useSession } from '@/shared/session/useSession'
import { todayIso } from '@/shared/utils/dates'
import { ProgressCards } from './ProgressCards'
import './HomePage.css'

// Without a route, deadlines are checked at the planner's default pace.
const DEFAULT_DAILY_MINUTES = 120

// The landing page after login. It brings the features together: how the student is doing (the progress cards),
// their one atlas of activities, and what the route asks for today, on a sticky note beside them. The whole route
// lives in the planner.
export function HomePage() {
  const session = useSession()
  const atlas = useAtlas()
  const progress = useRouteProgress({ ownerEmail: session?.email ?? '' }, atlas.replaceTask)
  const route = progress.route
  const ready = !!route && progress.status === 'ready'

  const dailyMinutes = route?.request.dailyAvailableMinutes ?? DEFAULT_DAILY_MINUTES
  const statuses = useMemo(
    () => deadlineStatuses(atlas.activities, atlas.tasks, session?.userId ?? '', dailyMinutes, todayIso()),
    [atlas.activities, atlas.tasks, session?.userId, dailyMinutes],
  )

  // Today always has its place: today's sessions once the route's tasks have loaded, otherwise a notice
  // (no route yet, or it could not load).
  return (
    <>
      <AppHeader title="Your atlas" />
      <Main>
        <div className="home-layout">
          {/* First in the page, so it sits above the atlas on narrow screens; on wide ones it moves to the side. */}
          <aside className="home-side" aria-label="Today">
            {ready ? (
              <TodayCard
                route={route}
                taskById={progress.taskById}
                isDone={progress.isDone}
                onToggle={progress.toggle}
              />
            ) : (
              progress.status !== 'ready' && <RouteNotice status={progress.status} onRetry={progress.retry} />
            )}
            {progress.problem && <p role="alert">{progress.problem}</p>}
          </aside>
          <div className="home-main">
            {!atlas.loading && (
              <ProgressCards
                route={ready ? route : null}
                isDone={progress.isDone}
                activities={atlas.activities}
                statuses={statuses}
              />
            )}
            <Atlas atlas={atlas} statuses={statuses} />
          </div>
        </div>
      </Main>
    </>
  )
}
