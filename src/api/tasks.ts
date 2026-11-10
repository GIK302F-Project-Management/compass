import {
  createMockTask,
  deleteMockTask,
  findMockTasksByActivity,
  updateMockTask,
  type MockTask,
  type MockTaskChanges,
} from '../mocks/tasks'

export type Task = MockTask

export type TaskInput = {
  title: string
  details: string
  dueDate: string // YYYY-MM-DD, or '' when the task has no deadline
  estimatedMinutes: number | null // null when the user has not estimated it
}

// Mock implementation. When the backend is ready, replace the body with
// GET /activity/<activityId>/task, which returns the activity's tasks in the order they were created.
export async function listTasks(activityId: string): Promise<Task[]> {
  return findMockTasksByActivity(activityId)
}

// Mock implementation. When the backend is ready, replace the body with
// POST /activity/<activityId>/task with { title, details, dueDate, estimatedMinutes },
// which returns 201 and the created task.
export async function createTask(activityId: string, input: TaskInput): Promise<Task> {
  return createMockTask(activityId, input.title.trim(), input.details.trim(), input.dueDate, input.estimatedMinutes)
}

// Mock implementation. When the backend is ready, replace the body with
// PATCH /task/<id> with the changed fields (title, details, dueDate, estimatedMinutes, done),
// which returns 200 and the updated task.
export async function updateTask(id: string, changes: MockTaskChanges): Promise<Task> {
  const trimmed = { ...changes }
  if (trimmed.title !== undefined) trimmed.title = trimmed.title.trim()
  if (trimmed.details !== undefined) trimmed.details = trimmed.details.trim()
  return updateMockTask(id, trimmed)
}

// Mock implementation. When the backend is ready, replace the body with
// DELETE /task/<id>, which returns 204.
export async function deleteTask(id: string): Promise<void> {
  deleteMockTask(id)
}
