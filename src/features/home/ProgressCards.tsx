import { Link } from 'react-router'
import type { Activity } from '@/features/activities/api/activities'
import { mostUrgent, type DeadlineStatus } from '@/features/activities/deadlines'
import type { SavedRoute } from '@/features/route/api/savedRoute'
import { routePace } from '@/features/route/pace'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { formatDueDate, todayIso } from '@/shared/utils/dates'
import { formatMinutes } from '@/shared/utils/duration'
import './ProgressCards.css'

type ProgressCardsProps = {
  route: SavedRoute | null // only once its tasks are loaded, so ticked tasks count
  isDone: (index: number) => boolean
  activities: Activity[]
  statuses: Map<string, DeadlineStatus>
}

// The top of the home page: how the student is doing, in color. Green is fine, amber is tight, red needs action.
export function ProgressCards({ route, isDone, activities, statuses }: ProgressCardsProps) {
  return (
    <div className="progress-cards">
      {route && <PaceCard route={route} isDone={isDone} />}
      <DeadlinesCard activities={activities} statuses={statuses} />
    </div>
  )
}

function PaceCard({ route, isDone }: { route: SavedRoute; isDone: (index: number) => boolean }) {
  const pace = routePace(route, isDone, todayIso())
  let headline: string
  if (pace.behindMinutes > 0) headline = `${formatMinutes(pace.behindMinutes)} behind`
  else if (pace.aheadMinutes > 0) headline = `${formatMinutes(pace.aheadMinutes)} ahead`
  else headline = 'Right on schedule'

  // Where the student should be by now, as a mark on the bar.
  const expectedAt = pace.totalMinutes > 0 ? (pace.expectedMinutes / pace.totalMinutes) * 100 : 0

  return (
    <section className={`progress-card level-${pace.level}`} aria-labelledby="pace-heading">
      <header className="progress-card-head">
        <h2 id="pace-heading" className="kicker">
          Route pace
        </h2>
        <span className={`status-badge level-${pace.level}`}>{pace.label}</span>
      </header>
      <p className="progress-card-headline">{headline}</p>
      <div className="pace-bar">
        <ProgressBar
          value={pace.doneMinutes}
          max={pace.totalMinutes}
          label="Route done"
          valueText={`${formatMinutes(pace.doneMinutes)} of ${formatMinutes(pace.totalMinutes)} done`}
          level={pace.level}
        />
        {pace.expectedMinutes > 0 && (
          <span
            className="pace-mark"
            style={{ left: `${expectedAt}%` }}
            aria-hidden="true"
            title="Where the route expected you to be"
          />
        )}
      </div>
      <p className="progress-card-text">
        {formatMinutes(pace.doneMinutes)} of {formatMinutes(pace.totalMinutes)} done
        {pace.missedSessions > 0 &&
          ` · ${pace.missedSessions} ${pace.missedSessions === 1 ? 'session' : 'sessions'} missed`}
      </p>
      {pace.level !== 'good' && (
        <Link to="/planner?new=1" className="button button-small">
          Re-plot from today
        </Link>
      )}
    </section>
  )
}

type DeadlinesCardProps = {
  activities: Activity[]
  statuses: Map<string, DeadlineStatus>
}

function DeadlinesCard({ activities, statuses }: DeadlinesCardProps) {
  const ranked = mostUrgent(activities, statuses).filter(({ status }) => status.level !== 'none')
  const worst = ranked[0]
  const atRisk = ranked.filter(({ status }) => status.level === 'bad' || status.level === 'tight')
  const level = worst?.status.level ?? 'none'

  return (
    <section className={`progress-card level-${level}`} aria-labelledby="deadlines-heading">
      <header className="progress-card-head">
        <h2 id="deadlines-heading" className="kicker">
          Deadlines
        </h2>
        {worst && (
          <span className={`status-badge level-${level}`}>
            {atRisk.length === 0 ? 'All on track' : `${atRisk.length} need attention`}
          </span>
        )}
      </header>

      {!worst && (
        <p className="progress-card-text">No deadlines to check yet. Add tasks with an estimate to your activities.</p>
      )}

      {worst && atRisk.length === 0 && (
        <>
          <p className="progress-card-headline">Every deadline fits your time</p>
          <p className="progress-card-text">
            Next: <Link to={`/activity/${worst.activity.id}`}>{worst.activity.title}</Link>, due{' '}
            {formatDueDate(worst.activity.dueDate)}.
          </p>
        </>
      )}

      {atRisk.length > 0 && (
        <>
          <ul className="deadline-list">
            {atRisk.slice(0, 3).map(({ activity, status }) => (
              <li key={activity.id}>
                <span className={`status-badge level-${status.level}`}>{status.label}</span>
                <Link to={`/activity/${activity.id}`} className="deadline-title">
                  {activity.title}
                </Link>
                <span className="deadline-numbers">
                  {status.label === 'Overdue'
                    ? `${formatMinutes(status.remainingMinutes)} left, was due ${formatDueDate(activity.dueDate)}`
                    : `${formatMinutes(status.remainingMinutes)} of work left, due ${formatDueDate(activity.dueDate)}`}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
