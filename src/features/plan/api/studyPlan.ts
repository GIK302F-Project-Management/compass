import { apiFetch } from '@/shared/api/http'

export type PlanGoal = {
  id: string
  title: string
  deadline: string // YYYY-MM-DD
  estimatedMinutes: number
}

export type PlanRequest = {
  startDate: string // YYYY-MM-DD
  dailyAvailableMinutes: number
  goals: PlanGoal[]
}

export type PlanSession = {
  goalId: string
  title: string
  date: string // YYYY-MM-DD
  durationMinutes: number
}

export type StudyPlan = {
  source: string // 'llm' when the AI drafted it, 'rule-based' otherwise
  status: 'ready' | 'partial' // partial: some minutes did not fit before their deadline
  sessions: PlanSession[]
  warnings: string[]
}

// Failures the page can explain to the student. Anything else throws.
export type PlanFailure = 'invalid' | 'ai-failed' | 'busy' | 'timeout' | 'session-expired'

export type GeneratePlanResult = { ok: true; plan: StudyPlan } | { ok: false; error: PlanFailure }

// The backend waits up to 90 seconds for the AI provider, so give it a little longer than that.
const REQUEST_TIMEOUT_MS = 120_000

// POST /api/study-plans on compass-backend: 200 -> the plan, 401 -> not logged in (or token expired),
// 400 -> request refused,
// 502 -> the AI answered badly, 503 -> the AI is rate limited, 504 -> the AI took too long.
// The backend does not send readable error messages in production, so the status is all we use.
export async function generateStudyPlan(request: PlanRequest): Promise<GeneratePlanResult> {
  const response = await apiFetch('/api/study-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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
