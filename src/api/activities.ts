import {
  createMockActivity,
  deleteMockActivity,
  findMockActivitiesByOwner,
  findMockActivityById,
  inviteMockCollaborator,
  listMockCollaborators,
  updateMockActivity,
  type MockActivity,
} from '../mocks/activities'
import { deleteMockTasksByActivity } from '../mocks/tasks'

export type Activity = MockActivity

export type ActivityChanges = {
  title: string
  subject: string // the student's subject or area, e.g. "Physics"
  dueDate: string // YYYY-MM-DD
}

export type NewActivityInput = ActivityChanges & {
  ownerEmail: string
}

// Mock implementation. When the backend is ready, replace the body with
// GET /activity?email=<ownerEmail>, which returns the user's activities as JSON
// in the order they were created (new ones go at the end).
export async function listActivities(ownerEmail: string): Promise<Activity[]> {
  return findMockActivitiesByOwner(ownerEmail)
}

// Mock implementation. When the backend is ready, replace the body with
// GET /activity/<id>, which returns the activity, or 404 (here: null) when it does not exist.
export async function getActivity(id: string): Promise<Activity | null> {
  return findMockActivityById(id) ?? null
}

export async function listCollaborators(activityId: string): Promise<string[]> {
  return listMockCollaborators(activityId)
}

export async function inviteCollaborator(activityId: string, collaboratorEmail: string): Promise<Activity> {
  return inviteMockCollaborator(activityId, collaboratorEmail)
}

// Mock implementation. When the backend is ready, replace the body with
// POST /activity with { title, subject, dueDate, ownerEmail }, which returns 201 and the created activity.
export async function createActivity(input: NewActivityInput): Promise<Activity> {
  return createMockActivity(input.title.trim(), input.subject.trim(), input.dueDate, input.ownerEmail)
}

// Mock implementation. When the backend is ready, replace the body with
// PUT /activity/<id> with { title, subject, dueDate }, which returns 200 and the updated activity.
export async function updateActivity(id: string, changes: ActivityChanges): Promise<Activity> {
  return updateMockActivity(id, changes.title.trim(), changes.subject.trim(), changes.dueDate)
}

// Mock implementation. When the backend is ready, replace the body with
// DELETE /activity/<id>, which returns 204 and also removes the activity's tasks.
export async function deleteActivity(id: string): Promise<void> {
  deleteMockActivity(id)
  deleteMockTasksByActivity(id)
}
