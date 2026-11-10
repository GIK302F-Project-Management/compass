import { useState, type FormEvent } from 'react'
import { createGoal, updateGoal, type Goal } from './api/goals'
import { useFormState } from '@/shared/hooks/useFormState'
import { MAX_GOAL_DESCRIPTION_LENGTH, validateGoal, type GoalValues } from './validation/goal'
import { FormField } from '@/shared/ui/FormField'
import { TextAreaField } from '@/shared/ui/TextAreaField'

type GoalFormProps = {
  // When given, the form edits this goal instead of creating a new one.
  goal?: Goal
  onSaved: (goal: Goal) => void
  // The goal being edited was deleted meanwhile.
  onGone: () => void
  onCancel: () => void
}

export function GoalForm({ goal, onSaved, onGone, onCancel }: GoalFormProps) {
  const initialValues: GoalValues = { title: goal?.title ?? '', description: goal?.description ?? '' }
  const { values, errors, setErrors, bind } = useFormState(initialValues)
  const [submitting, setSubmitting] = useState(false)
  const idPrefix = goal ? `goal-${goal.id}` : 'goal-new'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validateGoal(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      const result = goal ? await updateGoal(goal.id, values) : await createGoal(values)
      if (result.ok) {
        onSaved(result.goal)
        return
      }
      if (result.error === 'not-found') {
        onGone()
        return
      }
      // The backend checks the same rules as the form; show its message next to the field it names.
      setErrors(
        Object.keys(result.fieldErrors).length > 0
          ? result.fieldErrors
          : { form: 'Compass could not accept these details. Check them and try again.' },
      )
    } catch {
      setErrors({ form: 'Could not save the goal. Please try again.' })
    }
    setSubmitting(false)
  }

  return (
    <form className="sheet sheet-form" onSubmit={handleSubmit} noValidate>
      <div className="sheet-header">
        <span>{goal ? 'Edit goal' : 'New goal'}</span>
      </div>
      <div className="sheet-body">
        <FormField
          id={`${idPrefix}-title`}
          label="Title"
          value={values.title}
          onChange={bind('title')}
          error={errors.title}
          autoFocus
        />
        <TextAreaField
          id={`${idPrefix}-description`}
          label="Description"
          value={values.description}
          onChange={bind('description')}
          hint={`Optional. Up to ${MAX_GOAL_DESCRIPTION_LENGTH} characters.`}
          error={errors.description}
        />
        {errors.form && (
          <p className="form-error" role="alert">
            {errors.form}
          </p>
        )}
      </div>
      <div className="sheet-actions">
        <button type="submit" className="button button-small button-primary" disabled={submitting}>
          {submitting ? 'Saving...' : goal ? 'Save changes' : 'Add goal'}
        </button>
        <button type="button" className="text-link button-link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
