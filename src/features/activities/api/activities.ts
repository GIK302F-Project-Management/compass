import { ApiError, apiJson } from '@/shared/api/http'
import { asList, asObject, readBoolean, readId, readOptionalId, readString } from '@/shared/api/decode'

// The activities of a plan, on compass-backend. Every member of the plan can add, edit, complete and delete them,
// so what one student changes is what the others see the next time they load the plan.
// All of these need a login (apiJson sends the token). A plan or activity the student cannot see answers 404.

export type Activity = {
  id: string
  planId: string
  title: string
  subject: string // the student's subject or area, e.g. "Physics"
  dueDate: string // YYYY-MM-DD
  done: boolean
  doneBy: string | null // user id of the member who completed it
}

export type ActivityChanges = {
  title: string
  subject: string
  dueDate: string // YYYY-MM-DD
}

// GET /plans/<planId>/activities: the plan's activities in the order they were created (new ones go at the end).
export async function listActivities(planId: string): Promise<Activity[]> {
  return asList(await apiJson(`/plans/${planId}/activities`), 'activities', toActivity)
}

// GET /activities/<id>: the activity, or null when it does not exist (or is in a plan the student is not in).
export async function getActivity(id: string): Promise<Activity | null> {
  try {
    return toActivity(await apiJson(`/activities/${id}`))
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

// POST /plans/<planId>/activities: 201 -> the created activity, 400 -> ApiError with fieldErrors.
export async function createActivity(planId: string, changes: ActivityChanges): Promise<Activity> {
  return toActivity(await apiJson(`/plans/${planId}/activities`, { method: 'POST', body: trimmed(changes) }))
}

// PUT /activities/<id>: 200 -> the updated activity.
export async function updateActivity(id: string, changes: ActivityChanges): Promise<Activity> {
  return toActivity(await apiJson(`/activities/${id}`, { method: 'PUT', body: trimmed(changes) }))
}

// PUT /activities/<id>/done: completing an activity completes its open tasks too; reopening leaves them as they are.
export async function setActivityDone(id: string, done: boolean): Promise<Activity> {
  return toActivity(await apiJson(`/activities/${id}/done`, { method: 'PUT', body: { done } }))
}

// DELETE /activities/<id>: 204. The backend also removes the activity's tasks.
export async function deleteActivity(id: string): Promise<void> {
  await apiJson(`/activities/${id}`, { method: 'DELETE' })
}

function trimmed(changes: ActivityChanges): ActivityChanges {
  return { title: changes.title.trim(), subject: changes.subject.trim(), dueDate: changes.dueDate }
}

function toActivity(value: unknown): Activity {
  const body = asObject(value, 'activity')
  return {
    id: readId(body, 'id'),
    planId: readId(body, 'planId'),
    title: readString(body, 'title'),
    subject: readString(body, 'subject'),
    dueDate: readString(body, 'dueDate'),
    done: readBoolean(body, 'done'),
    doneBy: readOptionalId(body, 'doneBy'),
  }
}
