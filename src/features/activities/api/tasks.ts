import { apiJson } from '@/shared/api/http'
import {
  asList,
  asObject,
  readBoolean,
  readId,
  readOptionalId,
  readOptionalNumber,
  readOptionalString,
  readString,
} from '@/shared/api/decode'

// The tasks of an activity, on compass-backend. The members of an activity share one list of tasks: every member
// can add, change, assign, complete and delete them. Each task has an assignee, the member whose route it goes
// into. All of these need a login (apiJson sends the token).

export type Task = {
  id: string
  activityId: string
  title: string
  details: string
  dueDate: string // YYYY-MM-DD, or '' when the task has no deadline
  estimatedMinutes: number | null // null when nobody has estimated it; used by the route planner
  assigneeId: string | null // user id of the member who will do it; null while nobody took it
  done: boolean
  doneBy: string | null // user id of the member who completed it
}

export type TaskInput = {
  title: string
  details: string
  dueDate: string // YYYY-MM-DD, or '' when the task has no deadline
  estimatedMinutes: number | null
}

// What PATCH /tasks/<id> may change. Only the fields given are sent, so two students editing
// different fields of the same task never overwrite each other.
export type TaskChanges = Partial<TaskInput & { done: boolean; assigneeId: string | null }>

// GET /activities/<activityId>/tasks: the activity's tasks in the order they were created.
export async function listTasks(activityId: string): Promise<Task[]> {
  return asList(await apiJson(`/activities/${activityId}/tasks`), 'tasks', toTask)
}

// GET /tasks: every task of every activity in the atlas, whoever it is assigned to, with one request
// (the route planner and the home page need them all).
export async function listAtlasTasks(): Promise<Task[]> {
  return asList(await apiJson('/tasks'), 'tasks', toTask)
}

// The tasks that go into the student's own route.
export function assignedTo(tasks: Task[], userId: string): Task[] {
  return tasks.filter((task) => task.assigneeId === userId)
}

// POST /activities/<activityId>/tasks: 201 -> the created task, assigned to the student. 400 -> ApiError with fieldErrors.
export async function createTask(activityId: string, input: TaskInput): Promise<Task> {
  const body = {
    title: input.title.trim(),
    details: input.details.trim(),
    dueDate: input.dueDate || null,
    estimatedMinutes: input.estimatedMinutes,
  }
  return toTask(await apiJson(`/activities/${activityId}/tasks`, { method: 'POST', body }))
}

// PATCH /tasks/<id>: 200 -> the updated task. An assignee who is not a member answers 400.
export async function updateTask(id: string, changes: TaskChanges): Promise<Task> {
  const body: Record<string, unknown> = { ...changes }
  if (changes.title !== undefined) body.title = changes.title.trim()
  if (changes.details !== undefined) body.details = changes.details.trim()
  if (changes.dueDate !== undefined) body.dueDate = changes.dueDate || null
  if (changes.assigneeId !== undefined)
    body.assigneeId = changes.assigneeId === null ? null : Number(changes.assigneeId)
  return toTask(await apiJson(`/tasks/${id}`, { method: 'PATCH', body }))
}

// DELETE /tasks/<id>: 204.
export async function deleteTask(id: string): Promise<void> {
  await apiJson(`/tasks/${id}`, { method: 'DELETE' })
}

function toTask(value: unknown): Task {
  const body = asObject(value, 'task')
  return {
    id: readId(body, 'id'),
    activityId: readId(body, 'activityId'),
    title: readString(body, 'title'),
    details: readString(body, 'details'),
    dueDate: readOptionalString(body, 'dueDate') ?? '',
    estimatedMinutes: readOptionalNumber(body, 'estimatedMinutes'),
    assigneeId: readOptionalId(body, 'assigneeId'),
    done: readBoolean(body, 'done'),
    doneBy: readOptionalId(body, 'doneBy'),
  }
}
