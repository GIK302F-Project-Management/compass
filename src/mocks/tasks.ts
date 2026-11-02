// Fake task store kept in localStorage until the backend exists.

export type MockTask = {
  id: string
  activityId: string
  title: string
  details: string
  dueDate: string // YYYY-MM-DD, or '' when the task has no deadline
  done: boolean
}

export type MockTaskChanges = Partial<Pick<MockTask, 'title' | 'details' | 'dueDate' | 'done'>>

const STORAGE_KEY = 'compass.mockTasks'

function loadTasks(): MockTask[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveTasks(tasks: MockTask[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function findMockTasksByActivity(activityId: string) {
  return loadTasks().filter((task) => task.activityId === activityId)
}

export function createMockTask(activityId: string, title: string, details: string, dueDate: string) {
  const task: MockTask = {
    id: crypto.randomUUID(),
    activityId,
    title,
    details,
    dueDate,
    done: false,
  }
  saveTasks([...loadTasks(), task])
  return task
}

export function updateMockTask(id: string, changes: MockTaskChanges) {
  const tasks = loadTasks()
  const task = tasks.find((item) => item.id === id)
  if (!task) {
    throw new Error(`Task ${id} not found`)
  }
  Object.assign(task, changes)
  saveTasks(tasks)
  return task
}

export function deleteMockTask(id: string) {
  saveTasks(loadTasks().filter((task) => task.id !== id))
}

export function deleteMockTasksByActivity(activityId: string) {
  saveTasks(loadTasks().filter((task) => task.activityId !== activityId))
}
