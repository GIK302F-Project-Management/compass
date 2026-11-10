import { apiFetch } from './http'

// Shapes of POST /api/study-plans on compass-backend. Both planner pages (a typed-in plan and the AI route)
// talk to this one endpoint, so the contract lives here, once.

export type StudyGoal = {
  id: string // the planner hands it back on every session; the route page uses the task id
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
  source: 'llm' | 'rule-based' // 'llm' when the AI drafted it
  status: 'ready' | 'partial' // partial: some minutes did not fit before their deadline
  sessions: StudySession[]
  warnings: string[] // "Goal <id>: 45 minutes could not be scheduled ..."
}

// Failures a page can explain to the student. Anything else throws.
export type PlanFailure = 'invalid' | 'ai-failed' | 'busy' | 'timeout' | 'session-expired'

export type GeneratePlanResult = { ok: true; plan: StudyPlanResponse } | { ok: false; error: PlanFailure }

// The backend waits up to 90 seconds for the AI provider, so give it a little longer than that.
const REQUEST_TIMEOUT_MS = 120_000

// POST /api/study-plans: 200 -> the plan, 401 -> not logged in (or token expired), 400 -> request refused,
// 502 -> the AI answered badly, 503 -> the AI is rate limited, 504 -> the AI took too long.
// The backend does not send readable error messages in production, so the status is all we use.
// Pass a signal to let the student cancel: that rejects with an AbortError, like fetch does.
export async function generateStudyPlan(request: StudyPlanRequest, signal?: AbortSignal): Promise<GeneratePlanResult> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const response = await apiFetch('/api/study-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  })

  if (response.ok) {
    return { ok: true, plan: await response.json() }
  }
  if (response.status === 401) return { ok: false, error: 'session-expired' }
  if (response.status === 400) return { ok: false, error: 'invalid' }
  if (response.status === 502) return { ok: false, error: 'ai-failed' }
  if (response.status === 503) return { ok: false, error: 'busy' }
  if (response.status === 504) return { ok: false, error: 'timeout' }
  throw new Error(`Unexpected study plan response: ${response.status}`)
}
