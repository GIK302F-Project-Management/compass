import type { RefObject } from 'react'
import type { SavedPlan } from '../api/lastPlan'
import type { PlanSession } from '../api/studyPlan'
import { daysBetween, formatDueDate, toIsoDate } from '../utils/dates'
import { formatMinutes } from '../utils/duration'

type PlanResultProps = {
  saved: SavedPlan
  headingRef: RefObject<HTMLHeadingElement | null>
}

type Day = { date: string; sessions: PlanSession[]; minutes: number }

// Sessions of the same date go under one heading, in calendar order.
function groupByDay(sessions: PlanSession[]): Day[] {
  const days = new Map<string, Day>()
  for (const session of [...sessions].sort((a, b) => a.date.localeCompare(b.date))) {
    const day = days.get(session.date) ?? { date: session.date, sessions: [], minutes: 0 }
    day.sessions.push(session)
    day.minutes += session.durationMinutes
    days.set(session.date, day)
  }
  return [...days.values()]
}

function dayLabel(date: string) {
  const offset = daysBetween(toIsoDate(new Date()), date)
  const relative = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : null
  return { relative, text: formatDueDate(date) }
}

// The generated plan, drawn as a route: one waypoint per study day.
export function PlanResult({ saved, headingRef }: PlanResultProps) {
  const { request, plan } = saved
  const days = groupByDay(plan.sessions)
  const totalMinutes = days.reduce((sum, day) => sum + day.minutes, 0)

  const scheduled = new Map<string, number>()
  for (const session of plan.sessions) {
    scheduled.set(session.goalId, (scheduled.get(session.goalId) ?? 0) + session.durationMinutes)
  }
  const coverage = request.goals.map((goal) => ({
    goal,
    scheduled: Math.min(scheduled.get(goal.id) ?? 0, goal.estimatedMinutes),
  }))
  const shortfalls = coverage.filter((item) => item.scheduled < item.goal.estimatedMinutes)
  const complete = shortfalls.length === 0
  const goalTitles = new Map(request.goals.map((goal) => [goal.id, goal.title]))

  return (
    <section className="sheet plan-result" aria-labelledby="plan-result-heading">
      <div className="sheet-header">
        <span>Sheet 02 · Your route</span>
        <span className="sheet-badge">{complete ? 'Complete' : 'Partial'}</span>
      </div>

      <div className="sheet-body plan-result-body">
        <div className="plan-result-intro">
          <h2 id="plan-result-heading" ref={headingRef} tabIndex={-1}>
            {complete ? 'Your plan is ready.' : 'Your plan only fits in part.'}
          </h2>
          <p>
            {days.length > 0
              ? `${formatMinutes(totalMinutes)} of study over ${days.length} ${days.length === 1 ? 'day' : 'days'}, from ${formatDueDate(days[0].date)} to ${formatDueDate(days[days.length - 1].date)}.`
              : 'None of your goals could be scheduled.'}
          </p>
          <p className="kicker">
            {plan.source === 'llm' ? 'Drafted by the AI planner' : 'Built by Compass from your deadlines'}
          </p>
        </div>

        {!complete && (
          <div className="plan-notice" role="status">
            <p className="plan-notice-title">Not everything fits before its deadline.</p>
            <ul>
              {shortfalls.map(({ goal, scheduled: done }) => (
                <li key={goal.id}>
                  <strong>{goal.title}</strong>: {formatMinutes(goal.estimatedMinutes - done)} left out of{' '}
                  {formatMinutes(goal.estimatedMinutes)}, due {formatDueDate(goal.deadline)}.
                </li>
              ))}
            </ul>
            <p>Try more hours per day, an earlier start or a later deadline, then generate the plan again.</p>
          </div>
        )}

        <div>
          <h3 className="plan-subtitle">Goals</h3>
          <ul className="plan-coverage">
            {coverage.map(({ goal, scheduled: done }) => (
              <li key={goal.id}>
                <div className="plan-coverage-row">
                  <span className="plan-coverage-title">{goal.title}</span>
                  <span className="plan-coverage-amount">
                    {formatMinutes(done)} of {formatMinutes(goal.estimatedMinutes)}
                  </span>
                </div>
                <div
                  className="progress-track"
                  role="progressbar"
                  aria-label={`${goal.title}: time scheduled`}
                  aria-valuemin={0}
                  aria-valuemax={goal.estimatedMinutes}
                  aria-valuenow={done}
                  aria-valuetext={`${formatMinutes(done)} of ${formatMinutes(goal.estimatedMinutes)} scheduled`}
                >
                  <span style={{ width: `${(done / goal.estimatedMinutes) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {days.length > 0 && (
          <div>
            <h3 className="plan-subtitle">Day by day</h3>
            <ol className="plan-days">
              {days.map((day) => {
                const label = dayLabel(day.date)
                return (
                  <li key={day.date} className="plan-day">
                    <span className="plan-day-marker" aria-hidden="true" />
                    <div className="plan-day-header">
                      <h4>
                        {label.relative && <span className="plan-day-relative">{label.relative} · </span>}
                        {label.text}
                      </h4>
                      <span className="plan-day-total">{formatMinutes(day.minutes)}</span>
                    </div>
                    <ul className="plan-sessions">
                      {day.sessions.map((session, index) => {
                        const goalTitle = goalTitles.get(session.goalId)
                        const showGoal = goalTitle && goalTitle !== session.title
                        return (
                          <li key={`${session.goalId}-${index}`} className="plan-session">
                            <div>
                              {showGoal && <p className="kicker">{goalTitle}</p>}
                              <p className="plan-session-title">{session.title}</p>
                            </div>
                            <span className="plan-session-time">{formatMinutes(session.durationMinutes)}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </li>
                )
              })}
            </ol>
          </div>
        )}
      </div>
    </section>
  )
}
