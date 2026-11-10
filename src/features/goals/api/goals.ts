import { apiFetch } from '@/shared/api/http'

export type Goal = {
  id: number
  title: string
  description: string // empty when the student wrote none
  createdAt: string // ISO timestamp
}

export type GoalInput = {
  title: string
  description: string
}

export type GoalField = 'title' | 'description'

export type SaveGoalResult =
  | { ok: true; goal: Goal }
  | { ok: false; error: 'invalid'; fieldErrors: Partial<Record<GoalField, string>> }
  | { ok: false; error: 'not-found' } // the goal was deleted meanwhile (or is not this student's)

// All of these need a login: apiFetch sends the token, and ends the session if the backend refuses it.
// A student only ever gets their own goals; compass-backend decides that from the token.

// GET /goals: 200 -> the student's goals, oldest first (new ones go at the end).
export async function listGoals(): Promise<Goal[]> {
  const response = await apiFetch('/goals')
  if (!response.ok) throw new Error(`Unexpected goals response: ${response.status}`)

  const body: unknown = await response.json()
  if (!Array.isArray(body)) throw new Error('Unexpected goals response: not a list')
  return body.map(toGoal)
}

// POST /goals: 201 -> the created goal, 400 -> validation failed ({ errors: { field: message } }).
export async function createGoal(input: GoalInput): Promise<SaveGoalResult> {
  return saveGoal('/goals', 'POST', input, 201)
}

// PUT /goals/<id>: 200 -> the updated goal, 400 -> validation failed, 404 -> the goal no longer exists.
export async function updateGoal(id: number, input: GoalInput): Promise<SaveGoalResult> {
  return saveGoal(`/goals/${id}`, 'PUT', input, 200)
}

// DELETE /goals/<id>: 204 -> deleted. A 404 means it is already gone, which is what the student wanted.
export async function deleteGoal(id: number): Promise<void> {
  const response = await apiFetch(`/goals/${id}`, { method: 'DELETE' })
  if (response.status === 204 || response.status === 404) return
  throw new Error(`Unexpected goal delete response: ${response.status}`)
}

async function saveGoal(
  path: string,
  method: 'POST' | 'PUT',
  input: GoalInput,
  successStatus: number,
): Promise<SaveGoalResult> {
  const response = await apiFetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: input.title.trim(), description: input.description.trim() }),
  })

  if (response.status === successStatus) return { ok: true, goal: toGoal(await response.json()) }
  if (response.status === 404) return { ok: false, error: 'not-found' }
  if (response.status === 400) {
    const body: unknown = await response.json().catch(() => null)
    return { ok: false, error: 'invalid', fieldErrors: readFieldErrors(body) }
  }
  throw new Error(`Unexpected goal response: ${response.status}`)
}

// Keeps only the messages the form has a field for: { errors: { title: "..." } } -> { title: "..." }
function readFieldErrors(body: unknown): Partial<Record<GoalField, string>> {
  const errors = isRecord(body) && isRecord(body.errors) ? body.errors : {}
  const fieldErrors: Partial<Record<GoalField, string>> = {}
  for (const field of ['title', 'description'] as const) {
    const message = errors[field]
    if (typeof message === 'string') fieldErrors[field] = message
  }
  return fieldErrors
}

// Never trust the shape of a response blindly: a wrong one must fail here, not deep inside a page.
function toGoal(body: unknown): Goal {
  if (
    isRecord(body) &&
    typeof body.id === 'number' &&
    typeof body.title === 'string' &&
    typeof body.description === 'string' &&
    typeof body.createdAt === 'string'
  ) {
    return { id: body.id, title: body.title, description: body.description, createdAt: body.createdAt }
  }
  throw new Error('Unexpected goals response: not a goal')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
