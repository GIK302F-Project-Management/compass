import type { StudyPlanRequest, StudyPlanResponse, StudySession } from '@/shared/api/studyPlans'

// Each goal sent to the planner is one task; this links it back to the task and its activity.
export type GoalInfo = {
  activityId: string
  taskTitle: string
  activityTitle: string
  subject: string
}

// A plan as the page keeps it: the answer plus what was asked, so it can be redrawn and re-plotted.
export type SavedRoute = StudyPlanResponse & {
  request: StudyPlanRequest
  goals: Record<string, GoalInfo> // by goal id (= task id)
  checked: number[] // indexes in `sessions` the user has ticked off
  createdAt: string
}

// Whose route it is: a route is personal (the backend does not store it) and made for one plan,
// because its goals are that plan's tasks.
export type RouteScope = {
  ownerEmail: string
  planId: string
}

// The last route is remembered per student and plan in localStorage.
// v3: goals are the tasks of a shared plan (v2 routes used tasks kept in the browser and are ignored).
function storageKey({ ownerEmail, planId }: RouteScope) {
  return `compass.route.v3.${ownerEmail}.${planId}`
}

export function loadRoute(scope: RouteScope): SavedRoute | null {
  try {
    return JSON.parse(localStorage.getItem(storageKey(scope)) ?? 'null')
  } catch {
    return null
  }
}

export function saveRoute(scope: RouteScope, route: SavedRoute) {
  localStorage.setItem(storageKey(scope), JSON.stringify(route))
}

export function clearRoute(scope: RouteScope) {
  localStorage.removeItem(storageKey(scope))
}

// Backend warnings look like "Goal <id>: 45 minutes could not be scheduled ...".
export function parseWarning(warning: string): { goalId: string; minutes: number } | null {
  const [, goalId, minutes] = /^Goal (.+?): (\d+) minutes/.exec(warning) ?? []
  return goalId && minutes ? { goalId, minutes: Number(minutes) } : null
}

// The session at a position of the route. Positions come from the route itself, so a miss is a bug.
export function sessionAt(route: SavedRoute, index: number): StudySession {
  const session = route.sessions[index]
  if (!session) throw new RangeError(`The route has no session at position ${index}`)
  return session
}
