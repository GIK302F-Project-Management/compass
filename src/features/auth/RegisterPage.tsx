import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { registerUser } from './api/auth'
import { ContourBackground } from './ContourBackground'
import { FormField } from '@/shared/ui/FormField'
import { Main } from '@/shared/layout/Main'
import { TopBar } from '@/shared/layout/TopBar'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useFormState } from '@/shared/hooks/useFormState'
import {
  MIN_PASSWORD_LENGTH,
  UNIVERSITY_EMAIL_DOMAIN,
  validateRegister,
  type RegisterValues,
} from './validation/register'
import './AuthPage.css'

const INVALID_MESSAGE = 'Compass could not accept these details. Check them and try again.'
const EMPTY_VALUES: RegisterValues = { name: '', email: '', password: '', confirmPassword: '' }

export function RegisterPage() {
  useDocumentTitle('Create account')
  const { values, errors, setErrors, bind } = useFormState(EMPTY_VALUES)
  const [submitting, setSubmitting] = useState(false)
  const [registered, setRegistered] = useState(false)

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
      } else {
        // The backend checks the same rules as the form; show its message next to the field it names.
        setErrors(Object.keys(result.fieldErrors).length > 0 ? result.fieldErrors : { form: INVALID_MESSAGE })
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
      <Main className="auth-page">
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
              <p>Log in with your email and password to plot your first route.</p>
              <p className="auth-note">Already had an account with this email? Your original password still works.</p>
              <Link to="/login" className="button button-primary">
                Log in
              </Link>
            </section>
          ) : (
            <form className="auth-card" onSubmit={handleSubmit} noValidate>
              <h1>Create your account</h1>
              <FormField
                id="name"
                label="Name"
                value={values.name}
                onChange={bind('name')}
                autoComplete="name"
                error={errors.name}
              />
              <FormField
                id="email"
                label="University email"
                type="email"
                value={values.email}
                onChange={bind('email')}
                autoComplete="email"
                error={errors.email}
              />
              <FormField
                id="password"
                label="Password"
                hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
                type="password"
                value={values.password}
                onChange={bind('password')}
                autoComplete="new-password"
                error={errors.password}
              />
              <FormField
                id="confirmPassword"
                label="Repeat password"
                type="password"
                value={values.confirmPassword}
                onChange={bind('confirmPassword')}
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
      </Main>
    </>
  )
}
