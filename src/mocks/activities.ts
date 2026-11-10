// Fake activity store kept in localStorage until the backend exists.

export type MockActivity = {
  id: string
  title: string
  subject: string
  dueDate: string
  ownerEmail: string
  collaborators: string[]
  shared: boolean
  done: boolean
}

const STORAGE_KEY = 'compass.mockActivities'

function normalizeActivity(activity: Partial<MockActivity>): MockActivity {
  return {
    id: activity.id ?? crypto.randomUUID(),
    title: activity.title ?? 'Untitled activity',
    subject: activity.subject ?? '',
    dueDate: activity.dueDate ?? '',
    ownerEmail: activity.ownerEmail ?? '',
    collaborators: Array.isArray(activity.collaborators) ? activity.collaborators : [],
    shared: Boolean(activity.shared) || (Array.isArray(activity.collaborators) && activity.collaborators.length > 0),
    done: Boolean(activity.done),
  }
}

function loadActivities(): MockActivity[] {
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as Partial<MockActivity>[]).map((activity) => normalizeActivity(activity))
  } catch {
    return []
  }
}

function saveActivities(activities: MockActivity[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(activities))
}

export function findMockActivitiesByOwner(ownerEmail: string) {
  return loadActivities().filter((activity) => {
    const participants = new Set([activity.ownerEmail, ...(activity.collaborators ?? [])])
    return participants.has(ownerEmail)
  })
}

export function findMockActivityById(id: string) {
  return loadActivities().find((activity) => activity.id === id)
}

export function listMockCollaborators(activityId: string) {
  const activity = findMockActivityById(activityId)
  if (!activity) return []
  return Array.from(new Set([activity.ownerEmail, ...activity.collaborators]))
}

export function createMockActivity(title: string, subject: string, dueDate: string, ownerEmail: string) {
  const activity: MockActivity = {
    id: crypto.randomUUID(),
    title,
    subject,
    dueDate,
    ownerEmail,
    collaborators: [],
    shared: false,
    done: false,
  }
  saveActivities([...loadActivities(), activity])
  return activity
}

export function inviteMockCollaborator(activityId: string, collaboratorEmail: string) {
  const normalizedEmail = collaboratorEmail.trim().toLowerCase()
  const activities = loadActivities()
  const activity = activities.find((item) => item.id === activityId)

  if (!activity) {
    throw new Error(`Activity ${activityId} not found`)
  }

  if (!normalizedEmail) {
    return activity
  }

  if (!activity.collaborators.includes(normalizedEmail)) {
    activity.collaborators.push(normalizedEmail)
    activity.shared = true
  }

  saveActivities(activities)
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
