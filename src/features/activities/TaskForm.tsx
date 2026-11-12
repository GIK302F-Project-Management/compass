import { useState, type ChangeEvent, type FormEvent } from 'react'
import { createTask, updateTask, type Task, type TaskChanges, type TaskInput } from './api/tasks'
import { estimateToHours, parseEstimate, validateTask, type TaskErrors, type TaskValues } from './validation/task'
import { FormField } from '@/shared/ui/FormField'
import './TaskForm.css'

type TaskFormProps = {
  activityId: string
  // When given, the form edits this task instead of creating a new one.
  task?: Task
  onSaved: (task: Task) => void
  onCancel: () => void
}

// Shown inside the task route as a draft waypoint while the user fills it in.
export function TaskForm({ activityId, task, onSaved, onCancel }: TaskFormProps) {
  const [values, setValues] = useState<TaskValues>({
    title: task?.title ?? '',
    details: task?.details ?? '',
    dueDate: task?.dueDate ?? '',
    estimate: estimateToHours(task?.estimatedMinutes),
  })
  const [errors, setErrors] = useState<TaskErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const idPrefix = task ? `task-${task.id}` : 'task-new'

  function handleChange(field: keyof TaskValues) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [field]: event.target.value })
      if (errors[field] || errors.form) {
        setErrors({ ...errors, [field]: undefined, form: undefined })
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validateTask(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      const input = {
        title: values.title.trim(),
        details: values.details.trim(),
        dueDate: values.dueDate,
        estimatedMinutes: parseEstimate(values.estimate),
      }
      onSaved(task ? await saveChanges(task, input) : await createTask(activityId, input))
    } catch {
      setErrors({ form: 'Could not save the task. Please try again.' })
      setSubmitting(false)
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit} noValidate>
      <p className="kicker">{task ? 'Edit task' : 'New task'}</p>
      <FormField
        id={`${idPrefix}-title`}
        label="Task"
        value={values.title}
        onChange={handleChange('title')}
        error={errors.title}
        autoFocus
      />
      <FormField
        id={`${idPrefix}-estimate`}
        label="Time needed (hours)"
        hint="How long it should take, e.g. 1.5. Your route and your progress are counted with it."
        value={values.estimate}
        onChange={handleChange('estimate')}
        inputMode="decimal"
        error={errors.estimate}
      />
      <FormField
        id={`${idPrefix}-details`}
        label="Details"
        hint="Optional."
        value={values.details}
        onChange={handleChange('details')}
      />
      <FormField
        id={`${idPrefix}-due`}
        label="Due date"
        hint="Optional."
        type="date"
        value={values.dueDate}
        onChange={handleChange('dueDate')}
      />
      {errors.form && (
        <p className="form-error" role="alert">
          {errors.form}
        </p>
      )}
      <div className="task-form-actions">
        <button type="submit" className="button button-small button-primary" disabled={submitting}>
          {submitting ? 'Saving...' : task ? 'Save changes' : 'Add task'}
        </button>
        <button type="button" className="text-link button-link" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  )
}

// Sends only what the student changed, so an edit never overwrites what another member changed meanwhile.
async function saveChanges(task: Task, input: TaskInput): Promise<Task> {
  const changes: TaskChanges = {}
  if (input.title !== task.title) changes.title = input.title
  if (input.details !== task.details) changes.details = input.details
  if (input.dueDate !== task.dueDate) changes.dueDate = input.dueDate
  if (input.estimatedMinutes !== task.estimatedMinutes) changes.estimatedMinutes = input.estimatedMinutes
  return Object.keys(changes).length === 0 ? task : updateTask(task.id, changes)
}
