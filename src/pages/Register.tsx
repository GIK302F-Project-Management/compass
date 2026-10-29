import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link } from 'react-router'
import { registerUser } from '../api/auth'
import { ContourBackground } from '../components/ContourBackground'
import { FormField } from '../components/FormField'
import { TopBar } from '../components/TopBar'
import {
  MIN_PASSWORD_LENGTH,
  UNIVERSITY_EMAIL_DOMAIN,
  validateRegister,
  type RegisterErrors,
  type RegisterValues,
} from '../validation/register'

const EMPTY_VALUES: RegisterValues = { name: '', email: '', password: '', confirmPassword: '' }

export function Register() {
  const [values, setValues] = useState<RegisterValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [registered, setRegistered] = useState(false)

  function handleChange(field: keyof RegisterValues) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [field]: event.target.value })
      if (errors[field] || errors.form) {
        setErrors({ ...errors, [field]: undefined, form: undefined })
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validateRegister(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      const result = await registerUser({ name: values.name, email: values.email, password: values.password })
      if (result.ok) {
        setRegistered(true)
      } else if (result.error === 'email-taken') {
        setErrors({ email: 'An account with this email already exists. Try logging in instead.' })
      } else {
        setErrors({ email: `Use your university email (name@${UNIVERSITY_EMAIL_DOMAIN}).` })
      }
    } catch {
      setErrors({ form: 'Something went wrong while creating your account. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <TopBar
        actions={
          <Link to="/login" className="text-link">
            Log in
          </Link>
        }
      />
      <main className="auth-page">
        <aside className="auth-aside">
          <ContourBackground />
          <p className="kicker">Waypoint 00</p>
          <h2>
            Every route starts <em>here.</em>
          </h2>
          <p>Create your account with your {UNIVERSITY_EMAIL_DOMAIN} email and start plotting your semester.</p>
        </aside>
        <div className="auth-main">
          {registered ? (
            <section className="auth-card" role="status">
              <p className="kicker">Waypoint 01 reached</p>
              <h1>You're on the map, {values.name.trim()}.</h1>
              <p>Your account is ready. Log in to plot your first route.</p>
              <Link to="/login" className="button button-primary">
                Log in
              </Link>
            </section>
          ) : (
            <form className="auth-card" onSubmit={handleSubmit} noValidate>
              <h1>Create your account</h1>
              <FormField id="name" label="Name" value={values.name} onChange={handleChange('name')} autoComplete="name" error={errors.name} />
              <FormField
                id="email"
                label="University email"
                type="email"
                value={values.email}
                onChange={handleChange('email')}
                autoComplete="email"
                error={errors.email}
              />
              <FormField
                id="password"
                label="Password"
                hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
                type="password"
                value={values.password}
                onChange={handleChange('password')}
                autoComplete="new-password"
                error={errors.password}
              />
              <FormField
                id="confirmPassword"
                label="Repeat password"
                type="password"
                value={values.confirmPassword}
                onChange={handleChange('confirmPassword')}
                autoComplete="new-password"
                error={errors.confirmPassword}
              />
              {errors.form && (
                <p className="form-error" role="alert">
                  {errors.form}
                </p>
              )}
              <button type="submit" className="button button-primary" disabled={submitting}>
                {submitting ? 'Creating account...' : 'Create account'}
              </button>
              <p className="auth-switch">
                Already have an account?{' '}
                <Link to="/login" className="text-link">
                  Log in
                </Link>
              </p>
            </form>
          )}
        </div>
      </main>
    </>
  )
}
