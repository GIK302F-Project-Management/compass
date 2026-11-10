export type NewActivityValues = {
  title: string
  subject: string
  dueDate: string
}

export type NewActivityErrors = Partial<Record<keyof NewActivityValues | 'form', string>>

export function validateNewActivity(values: NewActivityValues): NewActivityErrors {
  const errors: NewActivityErrors = {}

  if (!values.title.trim()) {
    errors.title = 'Please give the activity a name.'
  }

  if (!values.subject.trim()) {
    errors.subject = 'Please enter the subject or area.'
  }

  if (!values.dueDate) {
    errors.dueDate = 'Please pick a due date.'
  }

  return errors
}
