import { Link } from 'react-router'
import type { SavedRoute } from '../api/studyPlans'
import type { Task } from '../api/tasks'
import { formatDueDate, formatMinutes, todayIso } from '../utils/dates'
import { routeSummary } from '../utils/routeDays'
import { SessionItem } from './SessionItem'

type TodayCardProps = {
  route: SavedRoute
  taskById: Map<string, Task>
  isDone: (index: number) => boolean
  onToggle: (index: number) => void
}

// Home page card for small screens (wide screens get the RouteTrail instead):
// what the saved route asks for today, or the next study day, ticked off in place.
export function TodayCard({ route, taskById, isDone, onToggle }: TodayCardProps) {
  const today = todayIso()
  const { doneCount, total, behind, finished } = routeSummary(route, isDone, today)
  const indexes = route.sessions.map((_, index) => index)

  const hasToday = route.sessions.some((item) => item.date === today)
  const nextDate = route.sessions
    .map((item) => item.date)
    .filter((date) => date > today)
    .sort()[0]
  const shownDate = hasToday ? today : nextDate
  const shown = shownDate ? indexes.filter((index) => route.sessions[index].date === shownDate) : []
  const shownMinutes = shown.reduce((sum, index) => sum + route.sessions[index].durationMinutes, 0)

  let heading: string
  if (finished) heading = 'Route complete'
  else if (shownDate === today) heading = 'Today on your route'
  else if (shownDate) heading = `Next on your route · ${formatDueDate(shownDate)}`
  else heading = 'Your route has ended'

  return (
    <section className="today-card" aria-labelledby="today-card-heading">
      <header className="today-card-head">
        <p className="kicker" id="today-card-heading">
          {heading}
        </p>
        <span className="today-card-count">
          {doneCount} of {total} done
        </span>
      </header>
      <div
        className="progress-track"
        role="progressbar"
        aria-label="Sessions done"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={doneCount}
      >
        <span style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} />
      </div>

      {finished ? (
        <p className="today-card-note">Every session on this route is behind you. Nice work.</p>
      ) : shown.length > 0 ? (
        <>
          <ul className="stop-sessions">
            {shown.map((index) => (
              <SessionItem
                key={index}
                route={route}
                index={index}
                done={isDone(index)}
                disabled={!taskById.has(route.sessions[index].goalId)}
                onToggle={onToggle}
                idPrefix="today"
              />
            ))}
          </ul>
          <p className="today-card-note">
            {formatMinutes(shownMinutes)} planned{shownDate === today ? ' today' : ''}.
          </p>
        </>
      ) : (
        <p className="today-card-note">No more study days left on this route.</p>
      )}

      {behind > 0 && !finished && (
        <p className="today-card-behind">
          {behind} earlier {behind === 1 ? 'session is' : 'sessions are'} not done yet. Re-plotting from today can fit{' '}
          {behind === 1 ? 'it' : 'them'} back in.
        </p>
      )}

      <div className="today-card-actions">
        {(finished || !shownDate) && (
          <Link to="/route?new=1" className="button button-small button-primary">
            Plot a new route
          </Link>
        )}
        <Link to="/route" className="button button-small">
          Open route →
        </Link>
      </div>
    </section>
  )
}
