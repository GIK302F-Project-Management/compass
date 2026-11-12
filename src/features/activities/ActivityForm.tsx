import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { tokenFromLink } from '@/features/collaboration/api/sharing'
import { createActivity, updateActivity, type Activity } from './api/activities'
import { validateNewActivity, type NewActivityErrors, type NewActivityValues } from './validation/activity'
import { FormField } from '@/shared/ui/FormField'

type ActivityFormProps = {
  // When given, the form edits this activity instead of creating a new one.
  activity?: Activity
  onSaved: (activity: Activity) => void
  onCancel: () => void
}

// Shown in the atlas as a sheet being filled in. A new sheet can also come from a classmate: pasting the
// invitation link they sent opens it, to join their activity instead of creating one.
export function ActivityForm({ activity, onSaved, onCancel }: ActivityFormProps) {
  const [joining, setJoining] = useState(false)
  if (!activity && joining) return <JoinWithLink onBack={() => setJoining(false)} onCancel={onCancel} />
  return <ActivityFields activity={activity} onSaved={onSaved} onCancel={onCancel} onJoin={() => setJoining(true)} />
}

function ActivityFields({ activity, onSaved, onCancel, onJoin }: ActivityFormProps & { onJoin: () => void }) {
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
      onSaved(activity ? await updateActivity(activity.id, values) : await createActivity(values))
    } catch {
      setErrors({ form: 'Could not save the activity. Please try again.' })
      setSubmitting(false)
    }
  }

  return (
    <form className="sheet sheet-form" onSubmit={handleSubmit} noValidate>
      <div className="sheet-header">
        <span>{activity ? 'Edit sheet' : 'New sheet'}</span>
        {!activity && (
          <button type="button" className="text-link button-link sheet-header-link" onClick={onJoin}>
            Have an invitation link?
          </button>
        )}
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

type JoinWithLinkProps = {
  onBack: () => void // back to creating an activity
  onCancel: () => void
}

// Pasting the link a classmate sent opens its invitation, where the student sees the activity and joins it.
function JoinWithLink({ onBack, onCancel }: JoinWithLinkProps) {
  const navigate = useNavigate()
  const [link, setLink] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const token = tokenFromLink(link)
    if (!token) {
      setError('Paste the whole invitation link, like https://…/join/…')
      return
    }
    navigate(`/join/${token}`)
  }

  return (
    <form className="sheet sheet-form" onSubmit={handleSubmit} noValidate>
      <div className="sheet-header">
        <span>Join a shared sheet</span>
        <button type="button" className="text-link button-link sheet-header-link" onClick={onBack}>
          Create one instead
        </button>
      </div>
      <div className="sheet-body">
        <FormField
          id="activity-join-link"
          label="Invitation link"
          value={link}
          onChange={(event) => {
            setLink(event.target.value)
            setError('')
          }}
          error={error}
          autoFocus
        />
        <p className="field-hint">A classmate sends it from their activity. It works for a week.</p>
      </div>
      <div className="sheet-actions">
        <button type="submit" className="button button-small button-primary">
          Open invitation
        </button>
        <button type="button" className="text-link button-link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}
