export const UNIVERSITY_EMAIL_DOMAIN = 'alumni.mondragon.edu'
export const MIN_PASSWORD_LENGTH = 8

export type RegisterValues = {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export type RegisterErrors = Partial<Record<keyof RegisterValues | 'form', string>>

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isUniversityEmail(email: string) {
  const [user, domain, ...rest] = normalizeEmail(email).split('@')
  return rest.length === 0 && /^[^\s@]+$/.test(user ?? '') && domain === UNIVERSITY_EMAIL_DOMAIN
}

export function validateRegister(values: RegisterValues): RegisterErrors {
  const errors: RegisterErrors = {}

  if (!values.name.trim()) {
    errors.name = 'Please enter your name.'
  }

  if (!values.email.trim()) {
    errors.email = 'Please enter your university email.'
  } else if (!isUniversityEmail(values.email)) {
    errors.email = `Use your university email (name@${UNIVERSITY_EMAIL_DOMAIN}).`
  }

  if (values.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `The password must have at least ${MIN_PASSWORD_LENGTH} characters.`
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = 'The passwords do not match.'
  }

  return errors
}
