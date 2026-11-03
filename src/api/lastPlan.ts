// The last plan the student generated, kept in localStorage so a refresh does not throw it away
// (the backend does not store plans, and the AI planner can take a while to answer).
import type { PlanRequest, StudyPlan } from './studyPlan'
import type { PlanValues } from '../validation/studyPlan'

export type SavedPlan = {
  values: PlanValues // what was typed in the form
  request: PlanRequest // what was sent to the backend
  plan: StudyPlan
  generatedAt: string // ISO timestamp
}

const STORAGE_KEY = 'compass.lastPlan'

export function loadLastPlan(): SavedPlan | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    const looksValid =
      Array.isArray(saved?.plan?.sessions) && Array.isArray(saved?.request?.goals) && Array.isArray(saved?.values?.goals)
    return looksValid ? saved : null
  } catch {
    return null
  }
}

export function saveLastPlan(saved: SavedPlan) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
}

export function clearLastPlan() {
  localStorage.removeItem(STORAGE_KEY)
}
