import { createActivity, deleteActivity, setActivityDone } from './activities'
import { createTask, updateTask } from './tasks'

// Before activities lived in the backend, they were kept in this browser (localStorage), one list for every
// account that logged in here. This file finds that old data and moves it into the atlas on the backend.
// The keys keep the names the old stores used.
const ACTIVITIES_KEY = 'compass.mockActivities'
const TASKS_KEY = 'compass.mockTasks'
const oldRouteKey = (email: string) => `compass.route.v2.${email}`

type LegacyActivity = { id: string; title: string; subject: string; dueDate: string; ownerEmail: string; done: boolean }
type LegacyTask = {
  id: string
  activityId: string
  title: string
  details: string
  dueDate: string
  estimatedMinutes: number | null
  done: boolean
}

export type ImportResult = { imported: number; failed: number }

function readList(key: string): Record<string, unknown>[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? value.filter((item) => typeof item === 'object' && item !== null) : []
  } catch {
    return []
  }
}

const text = (value: unknown) => (typeof value === 'string' ? value : '')

function readActivities(): LegacyActivity[] {
  return readList(ACTIVITIES_KEY).map((item) => ({
    id: text(item.id),
    title: text(item.title),
    subject: text(item.subject),
    dueDate: text(item.dueDate),
    ownerEmail: text(item.ownerEmail),
    done: item.done === true,
  }))
}

function readTasks(): LegacyTask[] {
  return readList(TASKS_KEY).map((item) => ({
    id: text(item.id),
    activityId: text(item.activityId),
    title: text(item.title),
    details: text(item.details),
    dueDate: text(item.dueDate),
    estimatedMinutes: typeof item.estimatedMinutes === 'number' ? item.estimatedMinutes : null,
    done: item.done === true,
  }))
}

// Removes the given activities and their tasks from the old lists, leaving other accounts' data alone.
function forget(activityIds: string[]) {
  const gone = new Set(activityIds)
  localStorage.setItem(
    ACTIVITIES_KEY,
    JSON.stringify(readList(ACTIVITIES_KEY).filter((item) => !gone.has(text(item.id)))),
  )
  localStorage.setItem(
    TASKS_KEY,
    JSON.stringify(readList(TASKS_KEY).filter((item) => !gone.has(text(item.activityId)))),
  )
}

function forgetOldRoute(email: string) {
  localStorage.removeItem(oldRouteKey(email))
}

/** How many activities this account still has in the browser from before they were kept on the server. */
export function countLegacyActivities(ownerEmail: string): number {
  return readActivities().filter((activity) => activity.ownerEmail === ownerEmail).length
}

/**
 * Copies the account's old activities and tasks into the atlas, one activity at a time. An activity that was
 * moved is removed from the browser; one that could not be moved (the backend refused it) stays, and is counted.
 */
export async function importLegacyActivities(ownerEmail: string): Promise<ImportResult> {
  const mine = readActivities().filter((activity) => activity.ownerEmail === ownerEmail)
  let imported = 0
  let failed = 0

  for (const legacy of mine) {
    const tasks = readTasks().filter((task) => task.activityId === legacy.id)
    let createdId: string | null = null
    try {
      const created = await createActivity({
        title: legacy.title,
        subject: legacy.subject,
        dueDate: legacy.dueDate,
      })
      createdId = created.id
      for (const task of tasks) {
        const copy = await createTask(created.id, {
          title: task.title,
          details: task.details,
          dueDate: task.dueDate,
          estimatedMinutes: task.estimatedMinutes,
        })
        if (task.done) await updateTask(copy.id, { done: true })
      }
      // Completing an activity completes its open tasks, so only do it when nothing would change.
      if (legacy.done && tasks.every((task) => task.done)) await setActivityDone(created.id, true)
      forget([legacy.id])
      imported++
    } catch {
      failed++
      // Do not leave half an activity behind: it would show up twice after a retry.
      if (createdId) await deleteActivity(createdId).catch(() => undefined)
    }
  }

  if (failed === 0) forgetOldRoute(ownerEmail)
  return { imported, failed }
}

/** Throws the account's old activities, tasks and route away, for a student who does not want them. */
export function discardLegacyActivities(ownerEmail: string) {
  forget(
    readActivities()
      .filter((activity) => activity.ownerEmail === ownerEmail)
      .map((activity) => activity.id),
  )
  forgetOldRoute(ownerEmail)
}
