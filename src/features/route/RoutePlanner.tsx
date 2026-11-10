import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { listActivities, type Activity } from '@/features/activities/api/activities'
import type { Plan } from '@/shared/api/plans'
import { useActivePlan } from '@/shared/plans/useCurrentPlan'
import {
  generateStudyPlan,
  type PlanFailure,
  type StudyGoal,
  type StudyPlanRequest,
  type StudySession,
} from '@/shared/api/studyPlans'
import { getSession } from '@/shared/session/session'
import { loadRoute, parseWarning, saveRoute, type GoalInfo, type RouteScope, type SavedRoute } from './api/savedRoute'
import { isSessionDone, toggleSession } from './api/routeProgress'
import { listPlanTasks, updateTask, type Task } from '@/features/activities/api/tasks'
import { ContourHill } from '@/shared/ui/MapShapes'
import { SessionItem } from './SessionItem'
import { daysBetween, formatDueDate, todayIso } from '@/shared/utils/dates'
import { formatMinutes } from '@/shared/utils/duration'
import { estimateToHours, MAX_ESTIMATE_HOURS, parseEstimate } from '@/features/activities/validation/task'
import './RoutePlanner.css'

const MAX_DAYS_AHEAD = 365 // the backend rejects deadlines further than this from the start date
const MAX_GOALS = 100 // the backend accepts at most 100 goals per plan
const PACE_MIN = 15
const PACE_MAX = 600
const PACE_STEP = 15
const MAX_PREFERENCES = 500

// The AI is unreliable at telling which date is a Sunday, so this preset is also sent as a rest
// day: the backend then removes any session it places on a Sunday.
const NO_SUNDAYS = 'No study on Sundays.'

// One click adds the sentence to the preferences box; another click removes it.
const PREFERENCE_PRESETS = [
  NO_SUNDAYS,
  'Split big tasks across several days.',
  'Finish one task before starting the next.',
  'Mix different subjects on the same day.',
  'Keep sessions under 1 hour.',
  'Leave the day before each deadline for review.',
]

// Why the planner said no, in the words of this page.
const FAILURE_MESSAGES: Record<Exclude<PlanFailure, 'session-expired'>, string> = {
  invalid: 'The route could not be planned with these details. Check the dates and hours and try again.',
  'ai-failed': 'The AI could not generate a route this time. Please try again.',
  busy: 'The AI route planner is busy or out of quota right now. Try again in a few minutes.',
  timeout: 'The AI took too long to answer. Try again, or plan fewer activities at once.',
}
const UNREACHABLE_MESSAGE = 'Could not reach the server. Is compass-backend running?'

type Phase = 'briefing' | 'plotting' | 'itinerary'

type Pick = { selected: boolean; hours: string }
const NO_PICK: Pick = { selected: false, hours: '' }

// A task without its own due date has to be finished by its activity's due date.
function taskDeadline(task: Task, activity: Activity) {
  return task.dueDate || activity.dueDate
}

// Why a task cannot be sent to the planner, or null when it can.
function unreachableReason(deadline: string, startDate: string) {
  const days = daysBetween(startDate, deadline)
  if (days < 0) return 'Deadline before start'
  if (days > MAX_DAYS_AHEAD) return 'More than a year away'
  return null
}

function preferenceLines(preferences: string) {
  return preferences
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function sheetLabel(index: number) {
  return index < 0 ? '··' : String(index + 1).padStart(2, '0')
}

// The route is made for one plan, so switching plans starts the page over (hence the key).
export function RoutePlanner() {
  const plan = useActivePlan()
  return <RoutePlannerForPlan key={plan.id} plan={plan} />
}

function RoutePlannerForPlan({ plan }: { plan: Plan }) {
  const [session] = useState(getSession)
  const ownerEmail = session?.email ?? ''
  const scope: RouteScope = { ownerEmail, planId: plan.id }
  const [searchParams] = useSearchParams()
  const focusActivityId = searchParams.get('activity')
  // ?new=1 opens the briefing even when a route is saved ("Plot a new route").
  const startNew = searchParams.has('new')

  const [activities, setActivities] = useState<Activity[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [route, setRoute] = useState<SavedRoute | null>(() => loadRoute(scope))
  const [phase, setPhase] = useState<Phase>(() => (route && !focusActivityId && !startNew ? 'itinerary' : 'briefing'))

  const [startDate, setStartDate] = useState(() => todayIso())
  const [dailyMinutes, setDailyMinutes] = useState(() => route?.request.dailyAvailableMinutes ?? 120)
  // Preferences start from the last route, so they do not have to be typed again.
  const [preferences, setPreferences] = useState(() => route?.request.preferences ?? '')
  const [picks, setPicks] = useState<Record<string, Pick>>({})
  const [error, setError] = useState<string | null>(null)
  const [expired, setExpired] = useState(false)
  const [plotting, setPlotting] = useState({ goals: 1, dailyMinutes: 120 })
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!ownerEmail) return
    Promise.all([listActivities(plan.id), listPlanTasks(plan.id)])
      .then(([foundActivities, foundTasks]) => {
        setActivities(foundActivities)
        setTasks(foundTasks)

        const activityById = new Map(foundActivities.map((activity) => [activity.id, activity]))
        const initial: Record<string, Pick> = {}
        for (const task of foundTasks) {
          const activity = activityById.get(task.activityId)
          if (!activity || task.done || activity.done) continue
          const reachable = unreachableReason(taskDeadline(task, activity), todayIso()) === null
          initial[task.id] = {
            selected: reachable && (focusActivityId ? task.activityId === focusActivityId : true),
            hours: estimateToHours(task.estimatedMinutes),
          }
        }
        setPicks(initial)
      })
      .catch(() => setError('Could not load the tasks of this plan. Refresh the page to try again.'))
      .finally(() => setLoading(false))
  }, [ownerEmail, plan.id, focusActivityId])

  // Stop waiting for the AI if the user leaves the page.
  useEffect(() => () => abortRef.current?.abort(), [])

  if (!session || expired) {
    return (
      <>
        <div className="route-page">
          <p className="kicker">Off the map</p>
          <h2 className="route-title">Log in to plot a route.</h2>
          <p>
            The AI route planner needs to know who you are. {expired && 'Your session has expired. '}
            <Link to="/login" className="text-link">
              Log in
            </Link>{' '}
            and come back here.
          </p>
        </div>
      </>
    )
  }

  const sheetIndex = new Map(activities.map((activity, index) => [activity.id, index]))
  const activityById = new Map(activities.map((activity) => [activity.id, activity]))
  const taskById = new Map(tasks.map((task) => [task.id, task]))
  const plannable = activities.filter((activity) => !activity.done)
  const pendingTasksOf = (activityId: string) => tasks.filter((task) => task.activityId === activityId && !task.done)
  const isReachable = (task: Task) => {
    const activity = activityById.get(task.activityId)
    return !!activity && unreachableReason(taskDeadline(task, activity), startDate) === null
  }
  const selectedTasks = tasks.filter((task) => picks[task.id]?.selected && isReachable(task))

  function updatePick(id: string, change: Partial<Pick>) {
    setPicks((current) => ({ ...current, [id]: { ...(current[id] ?? NO_PICK), ...change } }))
    setError(null)
  }

  function setGroup(activityId: string, selected: boolean) {
    setPicks((current) => {
      const next = { ...current }
      for (const task of pendingTasksOf(activityId)) {
        if (isReachable(task)) next[task.id] = { ...(next[task.id] ?? NO_PICK), selected }
      }
      return next
    })
    setError(null)
  }

  function goalFor(task: Task, estimatedMinutes: number): { goal: StudyGoal; info: GoalInfo } {
    const activity = activityById.get(task.activityId)!
    const context = activity.subject ? `${activity.title}, ${activity.subject}` : activity.title
    return {
      goal: {
        id: task.id,
        title: `${task.title} (${context})`.slice(0, 200),
        deadline: taskDeadline(task, activity),
        estimatedMinutes,
      },
      info: {
        activityId: activity.id,
        taskTitle: task.title,
        activityTitle: activity.title,
        subject: activity.subject,
      },
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (selectedTasks.length === 0) {
      setError('Pick at least one task.')
      return
    }
    if (selectedTasks.length > MAX_GOALS) {
      setError(`The planner takes at most ${MAX_GOALS} tasks at once. Unselect some and try again.`)
      return
    }

    const goals: StudyGoal[] = []
    const info: Record<string, GoalInfo> = {}
    for (const task of selectedTasks) {
      const minutes = parseEstimate(picks[task.id]?.hours ?? '')
      if (minutes === null || Number.isNaN(minutes)) {
        setError(`Give "${task.title}" an estimate between 0.25 and ${MAX_ESTIMATE_HOURS} hours.`)
        return
      }
      const built = goalFor(task, minutes)
      goals.push(built.goal)
      info[task.id] = built.info
    }

    // Keep the estimates on the tasks, so the next route (and the task list) already has them.
    const changed = selectedTasks.filter((task) => {
      const goal = goals.find((item) => item.id === task.id)!
      return task.estimatedMinutes !== goal.estimatedMinutes
    })
    if (changed.length > 0) {
      try {
        const updated = await Promise.all(
          changed.map((task) =>
            updateTask(task.id, { estimatedMinutes: goals.find((item) => item.id === task.id)!.estimatedMinutes }),
          ),
        )
        const updatedById = new Map(updated.map((task) => [task.id, task]))
        setTasks((current) => current.map((task) => updatedById.get(task.id) ?? task))
      } catch {
        setError('Could not save the estimates on the tasks. Please try again.')
        return
      }
    }

    const request: StudyPlanRequest = { startDate, dailyAvailableMinutes: dailyMinutes, goals }
    if (preferences.trim()) request.preferences = preferences.trim()
    if (preferenceLines(preferences).includes(NO_SUNDAYS)) request.restDays = ['SUNDAY']
    plot(request, info)
  }

  function togglePreset(preset: string) {
    const lines = preferenceLines(preferences)
    const next = lines.includes(preset) ? lines.filter((line) => line !== preset) : [...lines, preset]
    setPreferences(next.join('\n').slice(0, MAX_PREFERENCES))
  }

  async function plot(request: StudyPlanRequest, goals: Record<string, GoalInfo>) {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setError(null)
    setPlotting({ goals: request.goals.length, dailyMinutes: request.dailyAvailableMinutes })
    setPhase('plotting')
    try {
      const result = await generateStudyPlan(request, controller.signal)
      if (!result.ok) {
        // The session is already over (the request ended it), so the page just says why it cannot go on.
        if (result.error === 'session-expired') {
          setExpired(true)
          return
        }
        setError(FAILURE_MESSAGES[result.error])
        setPhase('briefing')
        return
      }
      const saved: SavedRoute = { ...result.plan, request, goals, checked: [], createdAt: new Date().toISOString() }
      saveRoute(scope, saved)
      setRoute(saved)
      setPhase('itinerary')
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') {
        setPhase(route ? 'itinerary' : 'briefing')
        return
      }
      setError(UNREACHABLE_MESSAGE)
      setPhase('briefing')
    }
  }

  // Plot again with the same briefing, leaving out tasks finished in the meantime.
  function replot() {
    if (!route) return
    const goals = route.request.goals.filter((goal) => {
      const task = taskById.get(goal.id)
      return task && !task.done
    })
    if (goals.length === 0) {
      setError('Every task on this route is done. Pick new ones to plan.')
      setPhase('briefing')
      return
    }
    plot({ ...route.request, startDate: todayIso(), goals }, route.goals)
  }

  function isDone(index: number) {
    return !!route && isSessionDone(route, index, taskById)
  }

  async function handleToggle(index: number) {
    if (!route) return
    try {
      const result = await toggleSession(scope, route, index, taskById)
      setRoute(result.route)
      const updated = result.task
      if (updated) setTasks((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      setError(null)
    } catch {
      setError('Could not save that change. Please try again.')
    }
  }

  if (phase === 'plotting') {
    return (
      <>
        <div className="route-page">
          <Plotting
            goals={plotting.goals}
            dailyMinutes={plotting.dailyMinutes}
            onCancel={() => abortRef.current?.abort()}
          />
        </div>
      </>
    )
  }

  if (phase === 'itinerary' && route) {
    return (
      <>
        <div className="route-page">
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <Itinerary
            route={route}
            taskExists={(goalId) => taskById.has(goalId)}
            isDone={isDone}
            onToggle={handleToggle}
            onReplot={replot}
            onNewBriefing={() => setPhase('briefing')}
          />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="route-page">
        <header className="route-header">
          <p className="kicker">Route briefing</p>
          <h2 className="route-title">
            Where are you <em>heading?</em>
          </h2>
          <p>
            Pick the tasks to plan from every activity, check how long each one needs, and the AI will mix them into one
            day-by-day route.
          </p>
        </header>

        <form className="briefing" onSubmit={handleSubmit} noValidate>
          <div className="briefing-row">
            <div className="form-field">
              <label htmlFor="route-start">Start</label>
              <input
                id="route-start"
                type="date"
                value={startDate}
                min={todayIso()}
                onChange={(event) => setStartDate(event.target.value || todayIso())}
              />
            </div>
            <div className="form-field briefing-pace">
              <label htmlFor="route-pace">Daily pace</label>
              <div className="pace-control">
                <input
                  id="route-pace"
                  type="range"
                  min={PACE_MIN}
                  max={PACE_MAX}
                  step={PACE_STEP}
                  value={dailyMinutes}
                  onChange={(event) => setDailyMinutes(Number(event.target.value))}
                />
                <output htmlFor="route-pace">
                  {formatMinutes(dailyMinutes)} <span>/ day</span>
                </output>
              </div>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="route-preferences">Preferences</label>
            <div className="preset-chips" role="group" aria-label="Common preferences">
              {PREFERENCE_PRESETS.map((preset) => {
                const active = preferenceLines(preferences).includes(preset)
                return (
                  <button
                    key={preset}
                    type="button"
                    className="preset-chip"
                    aria-pressed={active}
                    onClick={() => togglePreset(preset)}
                  >
                    {preset.replace(/\.$/, '')}
                  </button>
                )
              })}
            </div>
            <textarea
              id="route-preferences"
              rows={3}
              maxLength={MAX_PREFERENCES}
              placeholder="Anything else? e.g. Do the hardest tasks early in the week."
              value={preferences}
              onChange={(event) => setPreferences(event.target.value)}
              aria-describedby="route-preferences-hint"
            />
            <p id="route-preferences-hint" className="field-hint">
              The AI follows these when it can. Deadlines and your daily pace always come first.
              <span className="char-count">
                {preferences.length}/{MAX_PREFERENCES}
              </span>
            </p>
          </div>

          <fieldset className="destinations">
            <legend>Tasks to plan · {selectedTasks.length} selected</legend>
            {loading && <p className="field-hint">Loading your atlas…</p>}
            {!loading && plannable.length === 0 && (
              <p className="field-hint">
                No open activities.{' '}
                <Link to="/home" className="text-link">
                  Add an activity
                </Link>{' '}
                and its tasks first.
              </p>
            )}
            {plannable.map((activity) => {
              const pending = pendingTasksOf(activity.id)
              const reachable = pending.filter(isReachable)
              const allPicked = reachable.length > 0 && reachable.every((task) => picks[task.id]?.selected)
              return (
                <section key={activity.id} className="dest-group">
                  <div className="dest-group-head">
                    <input
                      type="checkbox"
                      id={`group-${activity.id}`}
                      checked={allPicked}
                      disabled={reachable.length === 0}
                      onChange={(event) => setGroup(activity.id, event.target.checked)}
                      aria-label={`Select all tasks of ${activity.title}`}
                    />
                    <label htmlFor={`group-${activity.id}`}>
                      <span className="kicker">
                        Sheet {sheetLabel(sheetIndex.get(activity.id) ?? -1)}
                        {activity.subject && ` · ${activity.subject}`}
                      </span>
                      <span className="dest-group-title">{activity.title}</span>
                    </label>
                    <span className="destination-due">Due {formatDueDate(activity.dueDate)}</span>
                  </div>
                  {pending.length === 0 && (
                    <p className="dest-empty">
                      No open tasks.{' '}
                      <Link to={`/activity/${activity.id}`} className="text-link">
                        Add tasks
                      </Link>{' '}
                      to plan this activity.
                    </p>
                  )}
                  {pending.map((task) => {
                    const deadline = taskDeadline(task, activity)
                    const reason = unreachableReason(deadline, startDate)
                    const pick = picks[task.id] ?? { selected: false, hours: '' }
                    const checked = pick.selected && reason === null
                    return (
                      <div
                        key={task.id}
                        className={`destination${reason ? ' unreachable' : ''}${checked ? ' picked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          id={`dest-${task.id}`}
                          checked={checked}
                          disabled={reason !== null}
                          onChange={(event) => updatePick(task.id, { selected: event.target.checked })}
                        />
                        <label htmlFor={`dest-${task.id}`}>
                          <span className="destination-title">{task.title}</span>
                          <span className="destination-due">
                            {reason ?? `Due ${formatDueDate(deadline)}${task.dueDate ? '' : ' (activity)'}`}
                          </span>
                        </label>
                        {reason === null && (
                          <div className="destination-hours">
                            <input
                              type="text"
                              inputMode="decimal"
                              placeholder="–"
                              aria-label={`Estimated hours for ${task.title}`}
                              value={pick.hours}
                              disabled={!checked}
                              onChange={(event) => updatePick(task.id, { hours: event.target.value })}
                            />
                            <span aria-hidden="true">h</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </section>
              )
            })}
          </fieldset>

          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}

          <div className="briefing-actions">
            {route && (
              <button type="button" className="button" onClick={() => setPhase('itinerary')}>
                ← Back to my route
              </button>
            )}
            <button type="submit" className="button button-primary" disabled={selectedTasks.length === 0}>
              Plot route with AI →
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

// Waiting screen: the route is "being drawn" while the AI works (it can take up to a minute and a half).
function Plotting({ goals, dailyMinutes, onCancel }: { goals: number; dailyMinutes: number; onCancel: () => void }) {
  return (
    <section className="plotting" aria-live="polite">
      <svg className="plotting-map" viewBox="0 0 480 220" aria-hidden="true">
        <ContourHill x={330} y={90} width={150} height={110} rotate={-14} />
        <ContourHill x={120} y={170} width={90} height={64} rotate={22} />
        <path
          className="route plotting-route"
          d="M40 180 C110 170, 110 110, 180 112 C250 114, 250 60, 320 58 C370 56, 390 40, 430 34"
        />
        <circle className="waypoint-pulse" cx={40} cy={180} r={7} />
        <circle className="waypoint-start" cx={40} cy={180} r={7} />
        <line className="map-pole" x1={430} y1={34} x2={430} y2={6} />
        <path className="map-flag" d="M431 6 L452 13 L431 20 Z" />
      </svg>
      <p className="kicker">Plotting your route…</p>
      <p>
        The AI is fitting {goals} {goals === 1 ? 'task' : 'tasks'} into {formatMinutes(dailyMinutes)} a day. This can
        take up to a minute.
      </p>
      <button type="button" className="button button-small" onClick={onCancel}>
        Cancel
      </button>
    </section>
  )
}

type Stop = { date: string; sessions: { item: StudySession; index: number }[]; deadlines: StudyGoal[] }

// One stop per day that has study sessions or a deadline, in date order.
function buildStops(route: SavedRoute): Stop[] {
  const stops = new Map<string, Stop>()
  const stopFor = (date: string) => {
    if (!stops.has(date)) stops.set(date, { date, sessions: [], deadlines: [] })
    return stops.get(date)!
  }
  route.sessions.forEach((item, index) => stopFor(item.date).sessions.push({ item, index }))
  for (const goal of route.request.goals) stopFor(goal.deadline).deadlines.push(goal)
  return [...stops.values()].sort((a, b) => a.date.localeCompare(b.date))
}

type ItineraryProps = {
  route: SavedRoute
  taskExists: (goalId: string) => boolean
  isDone: (index: number) => boolean
  onToggle: (index: number) => void
  onReplot: () => void
  onNewBriefing: () => void
}

function Itinerary({ route, taskExists, isDone, onToggle, onReplot, onNewBriefing }: ItineraryProps) {
  const stops = buildStops(route)
  const daily = route.request.dailyAvailableMinutes
  const goalTitles = new Map(route.request.goals.map((goal) => [goal.id, goal.title]))
  const totalMinutes = route.sessions.reduce((sum, item) => sum + item.durationMinutes, 0)
  const studyDays = new Set(route.sessions.map((item) => item.date)).size
  const doneCount = route.sessions.filter((_, index) => isDone(index)).length
  const taskName = (goalId: string) => route.goals[goalId]?.taskTitle ?? goalTitles.get(goalId) ?? goalId
  const today = todayIso()

  // Open the itinerary at today (or the next stop after it) instead of at the first day.
  const hereIndex = stops.findIndex((stop) => stop.date >= today)
  const hereRef = useRef<HTMLLIElement | null>(null)
  useEffect(() => {
    if (hereIndex > 0) hereRef.current?.scrollIntoView({ block: 'start' })
  }, [hereIndex])

  return (
    <>
      <header className="route-header">
        <p className="kicker">
          Your route · <span className="route-source">{route.source === 'llm' ? 'Plotted by AI' : 'Rule-based'}</span>
        </p>
        <h2 className="route-title">
          {route.status === 'ready' ? (
            <>
              Every deadline <em>covered.</em>
            </>
          ) : (
            <>
              Some ground <em>left uncharted.</em>
            </>
          )}
        </h2>
        <p className="route-stats">
          <em>{route.sessions.length}</em> sessions · <em>{formatMinutes(totalMinutes)}</em> over {studyDays}{' '}
          {studyDays === 1 ? 'day' : 'days'} · up to {formatMinutes(daily)} a day{' '}
        </p>
        {route.request.preferences && (
          <p className="route-preferences">
            {route.source === 'llm' ? (
              <>
                Planned with your preferences: <q>{route.request.preferences.split('\n').join(' ')}</q>
              </>
            ) : (
              <>Your preferences were not used: this route was planned by the basic rules, without the AI.</>
            )}
          </p>
        )}
        {route.sessions.length > 0 && (
          <div
            className="progress-track"
            role="progressbar"
            aria-label="Sessions done"
            aria-valuemin={0}
            aria-valuemax={route.sessions.length}
            aria-valuenow={doneCount}
          >
            <span style={{ width: `${(doneCount / route.sessions.length) * 100}%` }} />
          </div>
        )}
      </header>

      {route.warnings.length > 0 && (
        <aside className="uncharted" role="note">
          <p className="kicker">Uncharted</p>
          <ul>
            {route.warnings.map((warning) => {
              const parsed = parseWarning(warning)
              return (
                <li key={warning}>
                  {parsed ? (
                    <>
                      <strong>{formatMinutes(parsed.minutes)}</strong> of “{taskName(parsed.goalId)}” did not fit before
                      its deadline.
                    </>
                  ) : (
                    warning
                  )}
                </li>
              )
            })}
          </ul>
          <p className="field-hint">Raise your daily pace or move the start date earlier, then plot again.</p>
        </aside>
      )}

      <ol className="itinerary">
        {stops.map((stop, stopIndex) => {
          const used = stop.sessions.reduce((sum, { item }) => sum + item.durationMinutes, 0)
          const onlyDeadline = stop.sessions.length === 0
          const allDone = !onlyDeadline && stop.sessions.every(({ index }) => isDone(index))
          const isToday = stop.date === today
          const isPast = stop.date < today
          const classes = ['stop']
          if (onlyDeadline) classes.push('stop-flag')
          if (allDone) classes.push('stop-done')
          if (isToday) classes.push('stop-today')
          if (isPast) classes.push('stop-past')
          return (
            <li
              key={stop.date}
              ref={stopIndex === hereIndex ? hereRef : undefined}
              className={classes.join(' ')}
              aria-current={isToday ? 'date' : undefined}
            >
              <span className="stop-marker" aria-hidden="true" />
              <div className="stop-head">
                <span className="kicker">
                  {isToday && <span className="today-badge">Today</span>}
                  {formatDueDate(stop.date)}
                </span>
                {!onlyDeadline && (
                  <span className="stop-load">
                    {formatMinutes(used)} / {formatMinutes(daily)}
                    <span className="load-track" aria-hidden="true">
                      <span style={{ width: `${Math.min(100, (used / daily) * 100)}%` }} />
                    </span>
                  </span>
                )}
              </div>
              {stop.sessions.length > 0 && (
                <ul className="stop-sessions">
                  {stop.sessions.map(({ item, index }) => (
                    <SessionItem
                      key={index}
                      route={route}
                      index={index}
                      done={isDone(index)}
                      disabled={!taskExists(item.goalId)}
                      onToggle={onToggle}
                    />
                  ))}
                </ul>
              )}
              {stop.deadlines.length > 0 && (
                <p className="stop-deadline">
                  <span aria-hidden="true">⚑</span> Due: {stop.deadlines.map((goal) => taskName(goal.id)).join(', ')}
                </p>
              )}
            </li>
          )
        })}
      </ol>

      <div className="itinerary-actions">
        <button type="button" className="button button-primary" onClick={onReplot}>
          Re-plot from today
        </button>
        <button type="button" className="button-link text-link" onClick={onNewBriefing}>
          Change briefing
        </button>
      </div>
    </>
  )
}
