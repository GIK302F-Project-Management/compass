import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { sessionLabel } from './api/routeProgress'
import { sessionAt, type SavedRoute } from './api/savedRoute'
import type { Task } from '@/features/activities/api/tasks'
import { formatDueDate, todayIso } from '@/shared/utils/dates'
import { formatMinutes } from '@/shared/utils/duration'
import { routeDays, routeSummary, type RouteDay } from './routeDays'
import { ContourHill } from '@/shared/ui/MapShapes'
import { SessionItem } from './SessionItem'
import './RouteTrail.css'

type RouteTrailProps = {
  route: SavedRoute
  taskById: Map<string, Task>
  isDone: (index: number) => boolean
  onToggle: (index: number) => void
}

// Home page side panel: the saved route as a straight dotted trail down a faint map, one waypoint
// per day and a flag on the days a task is due. Today's stop is open with its sessions; any other
// stop opens on click.
export function RouteTrail({ route, taskById, isDone, onToggle }: RouteTrailProps) {
  const today = todayIso()
  const days: RouteDay[] = routeDays(route)
  const first = days[0]?.date
  const last = days[days.length - 1]?.date
  // Mark today on the trail even when nothing is planned for it.
  if (first && last && today > first && today < last && !days.some((day) => day.date === today)) {
    days.push({ date: today, sessions: [], deadlines: [], minutes: 0 })
    days.sort((a, b) => a.date.localeCompare(b.date))
  }
  const hereIndex = days.findIndex((day) => day.date >= today) // -1 when the whole route is behind
  const { doneCount, total, behind, finished } = routeSummary(route, isDone, today)

  const [openDate, setOpenDate] = useState<string | null>(() => days[hereIndex]?.date ?? null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const hereRef = useRef<HTMLLIElement | null>(null)

  // Start the panel scrolled to today, without moving the page itself.
  useEffect(() => {
    const scroller = scrollRef.current
    const here = hereRef.current
    if (!scroller || !here || hereIndex <= 0) return
    scroller.scrollTop = here.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 72
    // Only when the route is first shown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.createdAt])

  const taskName = (goalId: string) => route.goals[goalId]?.taskTitle ?? goalId

  return (
    <aside className="route-trail" aria-labelledby="route-trail-heading">
      <svg className="trail-terrain" viewBox="0 0 340 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <ContourHill x={250} y={130} width={190} height={150} rotate={-18} />
        <ContourHill x={70} y={360} width={150} height={120} rotate={24} />
        <ContourHill x={290} y={560} width={170} height={140} rotate={8} />
        <ContourHill x={90} y={780} width={160} height={120} rotate={-12} />
      </svg>

      <header className="trail-head">
        <div className="trail-head-row">
          <p className="kicker" id="route-trail-heading">
            {finished ? 'Route complete' : 'Your route'}
          </p>
          <span className="today-card-count">
            {doneCount} of {total} done
          </span>
        </div>
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
      </header>

      <div className="trail-scroll" ref={scrollRef}>
        <ol className="trail">
          {days.map((day, n) => {
            const isToday = day.date === today
            const open = openDate === day.date && day.sessions.length > 0
            const doneHere = day.sessions.filter(isDone).length
            const firstIndex = day.sessions[0]
            const firstLabel = firstIndex === undefined ? '' : sessionLabel(route, sessionAt(route, firstIndex)).title
            return (
              <li
                key={day.date}
                ref={n === hereIndex ? hereRef : undefined}
                className={`trail-stop${day.deadlines.length > 0 ? ' trail-deadline' : ''}${isToday ? ' trail-today' : ''}`}
                aria-current={isToday ? 'date' : undefined}
              >
                <span className="trail-marker" aria-hidden="true">
                  {day.deadlines.length > 0 && (
                    <svg viewBox="0 0 18 18">
                      <line className="map-pole" x1="5" y1="2" x2="5" y2="17" />
                      <path className="map-flag" d="M6 2 L16 5.5 L6 9 Z" />
                    </svg>
                  )}
                </span>

                {day.sessions.length > 0 ? (
                  <button
                    type="button"
                    className="trail-stop-head"
                    aria-expanded={open}
                    onClick={() => setOpenDate(open ? null : day.date)}
                  >
                    <span className="kicker">
                      {isToday ? 'Today · ' : ''}
                      {formatDueDate(day.date)}
                    </span>
                    <span className="trail-minutes">
                      {doneHere > 0 ? `${doneHere}/${day.sessions.length} · ` : ''}
                      {formatMinutes(day.minutes)}
                    </span>
                  </button>
                ) : (
                  <div className="trail-stop-head">
                    <span className="kicker">
                      {isToday ? 'Today · ' : ''}
                      {formatDueDate(day.date)}
                    </span>
                  </div>
                )}

                {open ? (
                  <ul className="stop-sessions trail-sessions">
                    {day.sessions.map((index) => (
                      <SessionItem
                        key={index}
                        route={route}
                        index={index}
                        done={isDone(index)}
                        disabled={!taskById.has(sessionAt(route, index).goalId)}
                        onToggle={onToggle}
                        idPrefix="trail"
                      />
                    ))}
                  </ul>
                ) : day.sessions.length > 0 ? (
                  <p className="trail-summary">
                    {firstLabel}
                    {day.sessions.length > 1 && <span> +{day.sessions.length - 1} more</span>}
                  </p>
                ) : isToday ? (
                  <p className="trail-summary">Nothing planned today.</p>
                ) : null}

                {day.deadlines.length > 0 && (
                  <p className="stop-deadline">{day.deadlines.map(taskName).join(', ')} due</p>
                )}
              </li>
            )
          })}
        </ol>
      </div>

      <footer className="trail-foot">
        {behind > 0 && !finished && (
          <p className="trail-behind">
            {behind} earlier {behind === 1 ? 'session' : 'sessions'} not done. Re-plot from today to fit{' '}
            {behind === 1 ? 'it' : 'them'} back in.
          </p>
        )}
        <div className="today-card-actions">
          {(finished || hereIndex === -1) && (
            <Link to="/route?new=1" className="button button-small button-primary">
              Plot a new route
            </Link>
          )}
          <Link to="/route" className="button button-small">
            Open route →
          </Link>
        </div>
      </footer>
    </aside>
  )
}
