// Where tasks are kept until the backend has an endpoint for them: the browser's localStorage.
// Only api/tasks.ts and api/activities.ts should import this file.

export type StoredTask = {
  id: string
  activityId: string
  title: string
  details: string
  dueDate: string // YYYY-MM-DD, or '' when the task has no deadline
  estimatedMinutes?: number | null // how long the task should take; used by the route planner
  done: boolean
}

export type StoredTaskChanges = Partial<Pick<StoredTask, 'title' | 'details' | 'dueDate' | 'estimatedMinutes' | 'done'>>

// The key keeps its old name so tasks saved by earlier versions are not lost.
const STORAGE_KEY = 'compass.mockTasks'

function loadTasks(): StoredTask[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveTasks(tasks: StoredTask[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function findTasksByActivity(activityId: string) {
  return loadTasks().filter((task) => task.activityId === activityId)
}

export function insertTask(
  activityId: string,
  title: string,
  details: string,
  dueDate: string,
  estimatedMinutes: number | null,
) {
  const task: StoredTask = {
    id: crypto.randomUUID(),
    activityId,
    title,
    details,
    dueDate,
    estimatedMinutes,
    done: false,
  }
  saveTasks([...loadTasks(), task])
  return task
}

export function modifyTask(id: string, changes: StoredTaskChanges) {
  const tasks = loadTasks()
  const task = tasks.find((item) => item.id === id)
  if (!task) {
    throw new Error(`Task ${id} not found`)
  }
  Object.assign(task, changes)
  saveTasks(tasks)
  return task
}

export function removeTask(id: string) {
  saveTasks(loadTasks().filter((task) => task.id !== id))
}

export function removeTasksByActivity(activityId: string) {
  saveTasks(loadTasks().filter((task) => task.activityId !== activityId))
}
