import type { PlanRequest } from '../api/studyPlan'
import { addDays, daysBetween, toIsoDate } from '@/shared/utils/dates'
import { hoursToMinutes, parseHours } from '@/shared/utils/duration'

// These limits mirror the rules of POST /api/study-plans, so the backend never has to refuse a form we accepted.
export const MAX_GOALS = 100
export const MAX_TITLE_LENGTH = 200
export const MAX_DAILY_HOURS = 24
export const MAX_GOAL_HOURS = 168 // one week
export const MAX_DEADLINE_DAYS = 365

export type GoalValues = {
  id: string
  title: string
  deadline: string // YYYY-MM-DD
  hours: string // as typed, e.g. "1,5"
}

export type PlanValues = {
  startDate: string // YYYY-MM-DD
  dailyHours: string // as typed
  goals: GoalValues[]
}

export type GoalErrors = Partial<Record<'title' | 'deadline' | 'hours', string>>

export type PlanErrors = {
  startDate?: string
  dailyHours?: string
  goals?: string
  form?: string
  goalErrors: Record<string, GoalErrors>
}

export function emptyGoal(): GoalValues {
  return { id: crypto.randomUUID(), title: '', deadline: '', hours: '' }
}

export function isPristineGoal(goal: GoalValues) {
  return !goal.title && !goal.deadline && !goal.hours
}

export function defaultPlanValues(): PlanValues {
  return { startDate: toIsoDate(new Date()), dailyHours: '2', goals: [emptyGoal()] }
}

export function validatePlan(values: PlanValues): PlanErrors {
  const errors: PlanErrors = { goalErrors: {} }
  const today = toIsoDate(new Date())

  if (!values.startDate) {
    errors.startDate = 'Pick the day you want to start studying.'
  } else if (values.startDate < today) {
    errors.startDate = 'Pick today or a later day.'
  }

  const daily = parseHours(values.dailyHours)
  if (daily === null) {
    errors.dailyHours = 'Enter the hours you can study per day, like 2 or 1.5.'
  } else if (hoursToMinutes(daily) < 1) {
    errors.dailyHours = 'This has to be more than zero.'
  } else if (daily > MAX_DAILY_HOURS) {
    errors.dailyHours = `A day only has ${MAX_DAILY_HOURS} hours.`
  }

  if (values.goals.length === 0) {
    errors.goals = 'Add at least one goal to plan.'
  } else if (values.goals.length > MAX_GOALS) {
    errors.goals = `You can plan up to ${MAX_GOALS} goals at a time.`
  }

  for (const goal of values.goals) {
    const goalErrors: GoalErrors = {}

    if (!goal.title.trim()) {
      goalErrors.title = 'Give this goal a name.'
    } else if (goal.title.trim().length > MAX_TITLE_LENGTH) {
      goalErrors.title = `Keep the name under ${MAX_TITLE_LENGTH} characters.`
    }

    if (!goal.deadline) {
      goalErrors.deadline = 'Pick a deadline.'
    } else if (values.startDate) {
      const days = daysBetween(values.startDate, goal.deadline)
      if (days < 0) {
        goalErrors.deadline = 'The deadline is before your start day.'
      } else if (days > MAX_DEADLINE_DAYS) {
        goalErrors.deadline = 'Deadlines can be at most a year after your start day.'
      }
    }

    const hours = parseHours(goal.hours)
    if (hours === null) {
      goalErrors.hours = 'Enter the hours needed, like 3 or 1.5.'
    } else if (hoursToMinutes(hours) < 1) {
      goalErrors.hours = 'This has to be more than zero.'
    } else if (hours > MAX_GOAL_HOURS) {
      goalErrors.hours = `One goal can take at most ${MAX_GOAL_HOURS} hours.`
    }

    if (Object.keys(goalErrors).length > 0) {
      errors.goalErrors[goal.id] = goalErrors
    }
  }

  return errors
}

export function hasPlanErrors(errors: PlanErrors) {
  return Boolean(errors.startDate || errors.dailyHours || errors.goals || Object.keys(errors.goalErrors).length > 0)
}

// Only call this with values that passed validatePlan.
export function toPlanRequest(values: PlanValues): PlanRequest {
  return {
    startDate: values.startDate,
    dailyAvailableMinutes: hoursToMinutes(parseHours(values.dailyHours) ?? 0),
    goals: values.goals.map((goal) => ({
      id: goal.id,
      title: goal.title.trim(),
      deadline: goal.deadline,
      estimatedMinutes: hoursToMinutes(parseHours(goal.hours) ?? 0),
    })),
  }
}

export function lastAllowedDeadline(startDate: string) {
  return addDays(startDate, MAX_DEADLINE_DAYS)
}
