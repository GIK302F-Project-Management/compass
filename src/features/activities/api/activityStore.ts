// Where activities are kept until the backend has an endpoint for them: the browser's localStorage.
// Only api/activities.ts should import this file, so swapping in the backend touches one place.

export type StoredActivity = {
  id: string
  title: string
  subject: string
  dueDate: string
  ownerEmail: string
  done: boolean
}

// The key keeps its old name so activities saved by earlier versions are not lost.
const STORAGE_KEY = 'compass.mockActivities'

function loadActivities(): StoredActivity[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveActivities(activities: StoredActivity[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities))
}

export function findActivitiesByOwner(ownerEmail: string) {
  return loadActivities().filter((activity) => activity.ownerEmail === ownerEmail)
}

export function findActivityById(id: string) {
  return loadActivities().find((activity) => activity.id === id)
}

export function insertActivity(title: string, subject: string, dueDate: string, ownerEmail: string) {
  const activity: StoredActivity = {
    id: crypto.randomUUID(),
    title,
    subject,
    dueDate,
    ownerEmail,
    done: false,
  }
  saveActivities([...loadActivities(), activity])
  return activity
}

export function modifyActivity(id: string, title: string, subject: string, dueDate: string) {
  const activities = loadActivities()
  const activity = activities.find((item) => item.id === id)
  if (!activity) {
    throw new Error(`Activity ${id} not found`)
  }
  activity.title = title
  activity.subject = subject
  activity.dueDate = dueDate
  saveActivities(activities)
  return activity
}

export function removeActivity(id: string) {
  saveActivities(loadActivities().filter((activity) => activity.id !== id))
}
