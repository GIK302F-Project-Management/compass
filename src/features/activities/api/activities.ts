import { ApiError, apiJson } from '@/shared/api/http'
import { asList, asObject, readBoolean, readId, readNumber, readOptionalId, readString } from '@/shared/api/decode'

// The activities of the student's atlas, on compass-backend: their own and the ones classmates shared with them.
// Every member of an activity can edit and complete it; only its owner deletes it and invites others.
// All of these need a login (apiJson sends the token). An activity the student is not in answers 404.

export type ActivityRole = 'OWNER' | 'MEMBER'

export type Activity = {
  id: string
  ownerId: string
  role: ActivityRole // the logged-in student's role in it
  memberCount: number // above 1 means the activity is shared
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

export const isShared = (activity: Activity) => activity.memberCount > 1

// GET /activities: the whole atlas in the order the activities were created (new ones go at the end).
export async function listActivities(): Promise<Activity[]> {
  return asList(await apiJson('/activities'), 'activities', toActivity)
}

// GET /activities/<id>: the activity, or null when it does not exist (or the student is not in it).
export async function getActivity(id: string): Promise<Activity | null> {
  try {
    return toActivity(await apiJson(`/activities/${id}`))
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

// POST /activities: 201 -> the created activity, owned by the student. 400 -> ApiError with fieldErrors.
export async function createActivity(changes: ActivityChanges): Promise<Activity> {
  return toActivity(await apiJson('/activities', { method: 'POST', body: trimmed(changes) }))
}

// PUT /activities/<id>: 200 -> the updated activity. Any member can do it.
export async function updateActivity(id: string, changes: ActivityChanges): Promise<Activity> {
  return toActivity(await apiJson(`/activities/${id}`, { method: 'PUT', body: trimmed(changes) }))
}

// PUT /activities/<id>/done: completing an activity completes its open tasks too; reopening leaves them as they are.
export async function setActivityDone(id: string, done: boolean): Promise<Activity> {
  return toActivity(await apiJson(`/activities/${id}/done`, { method: 'PUT', body: { done } }))
}

// DELETE /activities/<id>: 204, owner only (403 for the other members). Removes it, with its tasks, for everyone.
export async function deleteActivity(id: string): Promise<void> {
  await apiJson(`/activities/${id}`, { method: 'DELETE' })
}

function trimmed(changes: ActivityChanges): ActivityChanges {
  return { title: changes.title.trim(), subject: changes.subject.trim(), dueDate: changes.dueDate }
}

function toActivity(value: unknown): Activity {
  const body = asObject(value, 'activity')
  const role = readString(body, 'role')
  if (role !== 'OWNER' && role !== 'MEMBER') throw new Error('Unexpected response: unknown role')
  return {
    id: readId(body, 'id'),
    ownerId: readId(body, 'ownerId'),
    role,
    memberCount: readNumber(body, 'memberCount'),
    title: readString(body, 'title'),
    subject: readString(body, 'subject'),
    dueDate: readString(body, 'dueDate'),
    done: readBoolean(body, 'done'),
    doneBy: readOptionalId(body, 'doneBy'),
  }
}
