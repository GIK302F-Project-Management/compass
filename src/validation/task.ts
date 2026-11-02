export type TaskValues = {
  title: string
  details: string
  dueDate: string
}

export type TaskErrors = Partial<Record<keyof TaskValues | 'form', string>>

export function validateTask(values: TaskValues): TaskErrors {
  const errors: TaskErrors = {}

  if (!values.title.trim()) {
    errors.title = 'Please give the task a name.'
  }

  return errors
}
