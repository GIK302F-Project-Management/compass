import { apiFetch, UnauthorizedError } from './http'

// Shapes of POST /api/study-plans on compass-backend.

export type StudyGoal = {
  id: string // the activity id, so each session can be linked back to its sheet
  title: string
  deadline: string // YYYY-MM-DD, between startDate and 365 days after it
  estimatedMinutes: number // 1..10080
}

export type Weekday = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export type StudyPlanRequest = {
  startDate: string // YYYY-MM-DD
  dailyAvailableMinutes: number // 1..1440, shared by all goals
  goals: StudyGoal[]
  preferences?: string // up to 500 characters; only the AI planner uses it
  restDays?: Weekday[] // at most 6; no study on these days (both planners)
}

export type StudySession = {
  goalId: string
  title: string
  date: string // YYYY-MM-DD
  durationMinutes: number
}

export type StudyPlanResponse = {
  source: 'llm' | 'rule-based'
  status: 'ready' | 'partial'
  sessions: StudySession[]
  warnings: string[]
}

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

export class StudyPlanError extends Error {}

// The backend does not send the error text in the body by default, so the messages come from the status.
function messageFor(status: number) {
  switch (status) {
    case 400:
      return 'The route could not be planned with these details. Check the dates and hours and try again.'
    case 502:
      return 'The AI could not generate a route this time. Please try again.'
    case 503:
      return 'The AI route planner is busy or out of quota right now. Try again in a few minutes.'
    case 504:
      return 'The AI took too long to answer. Try again, or plan fewer activities at once.'
    default:
      return `Something went wrong while plotting the route (HTTP ${status}).`
  }
}

export async function generateStudyPlan(request: StudyPlanRequest, signal?: AbortSignal): Promise<StudyPlanResponse> {
  let response: Response
  try {
    response = await apiFetch('/api/study-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new StudyPlanError('Could not reach the server. Is compass-backend running?')
  }

  // apiFetch has already ended the session; the caller only needs to know why the request failed.
  if (response.status === 401) {
    throw new UnauthorizedError()
  }
  if (!response.ok) {
    throw new StudyPlanError(messageFor(response.status))
  }
  return response.json()
}

// The last route is remembered per user in localStorage (the backend does not store plans).
// v2: goals are tasks (v1 routes planned whole activities and are ignored).
function storageKey(ownerEmail: string) {
  return `compass.route.v2.${ownerEmail}`
}

export function loadRoute(ownerEmail: string): SavedRoute | null {
  try {
    return JSON.parse(localStorage.getItem(storageKey(ownerEmail)) ?? 'null')
  } catch {
    return null
  }
}

export function saveRoute(ownerEmail: string, route: SavedRoute) {
  localStorage.setItem(storageKey(ownerEmail), JSON.stringify(route))
}

export function clearRoute(ownerEmail: string) {
  localStorage.removeItem(storageKey(ownerEmail))
}

// Backend warnings look like "Goal <id>: 45 minutes could not be scheduled ...".
export function parseWarning(warning: string): { goalId: string; minutes: number } | null {
  const match = /^Goal (.+?): (\d+) minutes/.exec(warning)
  return match ? { goalId: match[1], minutes: Number(match[2]) } : null
}
