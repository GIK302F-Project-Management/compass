// The last plan the student generated, kept in localStorage so a refresh does not throw it away
// (the backend does not store plans, and the AI planner can take a while to answer).
// It is saved per account, so two students sharing a browser never see each other's plan.
import type { PlanRequest, StudyPlan } from './studyPlan'
import type { PlanValues } from '../validation/studyPlan'

export type SavedPlan = {
  values: PlanValues // what was typed in the form
  request: PlanRequest // what was sent to the backend
  plan: StudyPlan
  generatedAt: string // ISO timestamp
}

const keyFor = (email: string) => `compass.lastPlan.${email}`

export function loadLastPlan(email: string): SavedPlan | null {
  try {
    const saved = JSON.parse(localStorage.getItem(keyFor(email)) ?? 'null')
    const looksValid =
      Array.isArray(saved?.plan?.sessions) &&
      Array.isArray(saved?.request?.goals) &&
      Array.isArray(saved?.values?.goals)
    return looksValid ? saved : null
  } catch {
    return null
  }
}

export function saveLastPlan(email: string, saved: SavedPlan) {
  localStorage.setItem(keyFor(email), JSON.stringify(saved))
}

export function clearLastPlan(email: string) {
  localStorage.removeItem(keyFor(email))
}
