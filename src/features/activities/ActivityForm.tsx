import { useState, type ChangeEvent, type FormEvent } from 'react'
import { createActivity, updateActivity, type Activity } from './api/activities'
import { validateNewActivity, type NewActivityErrors, type NewActivityValues } from './validation/activity'
import { FormField } from '@/shared/ui/FormField'

type ActivityFormProps = {
  planId: string
  // When given, the form edits this activity instead of creating a new one.
  activity?: Activity
  onSaved: (activity: Activity) => void
  onCancel: () => void
}

// Shown in the atlas as a sheet being filled in.
export function ActivityForm({ planId, activity, onSaved, onCancel }: ActivityFormProps) {
  const [values, setValues] = useState<NewActivityValues>({
    title: activity?.title ?? '',
    subject: activity?.subject ?? '',
    dueDate: activity?.dueDate ?? '',
  })
  const [errors, setErrors] = useState<NewActivityErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const idPrefix = activity ? `activity-${activity.id}` : 'activity-new'

  function handleChange(field: keyof NewActivityValues) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [field]: event.target.value })
      if (errors[field] || errors.form) {
        setErrors({ ...errors, [field]: undefined, form: undefined })
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validateNewActivity(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      onSaved(activity ? await updateActivity(activity.id, values) : await createActivity(planId, values))
    } catch {
      setErrors({ form: 'Could not save the activity. Please try again.' })
      setSubmitting(false)
    }
  }

  return (
    <form className="sheet sheet-form" onSubmit={handleSubmit} noValidate>
      <div className="sheet-header">
        <span>{activity ? 'Edit sheet' : 'New sheet'}</span>
      </div>
      <div className="sheet-body">
        <FormField
          id={`${idPrefix}-title`}
          label="Name"
          value={values.title}
          onChange={handleChange('title')}
          error={errors.title}
          autoFocus
        />
        <FormField
          id={`${idPrefix}-subject`}
          label="Subject"
          value={values.subject}
          onChange={handleChange('subject')}
          error={errors.subject}
        />
        <FormField
          id={`${idPrefix}-due`}
          label="Due date"
          type="date"
          value={values.dueDate}
          onChange={handleChange('dueDate')}
          error={errors.dueDate}
        />
        {errors.form && (
          <p className="form-error" role="alert">
            {errors.form}
          </p>
        )}
      </div>
      <div className="sheet-actions">
        <button type="submit" className="button button-small button-primary" disabled={submitting}>
          {submitting ? 'Saving...' : activity ? 'Save changes' : 'Add activity'}
        </button>
        <button type="button" className="text-link button-link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
