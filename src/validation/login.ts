import { isUniversityEmail, UNIVERSITY_EMAIL_DOMAIN } from './register'

export type LoginValues = {
  email: string
  password: string
}

export type LoginErrors = Partial<Record<keyof LoginValues | 'form', string>>

export function validateLogin(values: LoginValues): LoginErrors {
  const errors: LoginErrors = {}

  if (!values.email.trim()) {
    errors.email = 'Please enter your university email.'
  } else if (!isUniversityEmail(values.email)) {
    errors.email = `Use your university email (name@${UNIVERSITY_EMAIL_DOMAIN}).`
  }

  if (!values.password) {
    errors.password = 'Please enter your password.'
  }

  return errors
}
