import type { FormErrors } from '@/shared/hooks/useFormState'

// The same limits as GoalRequest in compass-backend, which checks them again.
export const MAX_GOAL_TITLE_LENGTH = 100
export const MAX_GOAL_DESCRIPTION_LENGTH = 1000

export type GoalValues = {
  title: string
  description: string
}

export type GoalErrors = FormErrors<GoalValues>

export function validateGoal(values: GoalValues): GoalErrors {
  const errors: GoalErrors = {}
  const title = values.title.trim()

  if (!title) {
    errors.title = 'Please give the goal a title.'
  } else if (title.length > MAX_GOAL_TITLE_LENGTH) {
    errors.title = `The title must have at most ${MAX_GOAL_TITLE_LENGTH} characters.`
  }

  if (values.description.trim().length > MAX_GOAL_DESCRIPTION_LENGTH) {
    errors.description = `The description must have at most ${MAX_GOAL_DESCRIPTION_LENGTH} characters.`
  }

  return errors
}
