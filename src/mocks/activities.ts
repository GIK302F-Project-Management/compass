// Fake activity store kept in localStorage until the backend exists.

export type MockActivity = {
  id: string
  title: string
  subject: string
  dueDate: string
  ownerEmail: string
  done: boolean
}

const STORAGE_KEY = 'compass.mockActivities'

function loadActivities(): MockActivity[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveActivities(activities: MockActivity[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities))
}

export function findMockActivitiesByOwner(ownerEmail: string) {
  return loadActivities().filter((activity) => activity.ownerEmail === ownerEmail)
}

export function findMockActivityById(id: string) {
  return loadActivities().find((activity) => activity.id === id)
}

export function createMockActivity(title: string, subject: string, dueDate: string, ownerEmail: string) {
  const activity: MockActivity = {
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

export function updateMockActivity(id: string, title: string, subject: string, dueDate: string) {
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

export function deleteMockActivity(id: string) {
  saveActivities(loadActivities().filter((activity) => activity.id !== id))
}
