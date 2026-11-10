import { useState, type FormEvent } from 'react'
import { Link, useLocation } from 'react-router'
import { loginUser } from './api/auth'
import { saveSession } from '@/shared/session/session'
import { ContourBackground } from './ContourBackground'
import { FormField } from '@/shared/ui/FormField'
import { Main } from '@/shared/layout/Main'
import type { LoginRedirectState } from './RouteGuards'
import { TopBar } from '@/shared/layout/TopBar'
import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { useFormState } from '@/shared/hooks/useFormState'
import { validateLogin, type LoginValues } from './validation/login'
import './AuthPage.css'

const EMPTY_VALUES: LoginValues = { email: '', password: '' }

export function LoginPage() {
  useDocumentTitle('Log in')
  const sessionExpired = (useLocation().state as LoginRedirectState | null)?.expired === true
  const { values, setValues, errors, setErrors, bind } = useFormState(EMPTY_VALUES)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validateLogin(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      const result = await loginUser(values)
      if (result.ok) {
        // Saving the session is all it takes: GuestOnly sees it and moves the student to the page they wanted.
        saveSession(result.session)
      } else {
        // One message for both cases, like the backend, so it never reveals which emails have an account.
        setValues((current) => ({ ...current, password: '' }))
        setErrors({ form: 'Incorrect email or password.' })
      }
    } catch {
      setErrors({ form: 'Could not reach the server. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <TopBar
        actions={
          <Link to="/register" className="text-link">
            Create account
          </Link>
        }
      />
      <Main className="auth-page">
        <aside className="auth-aside">
          <ContourBackground />
          <p className="kicker">Waypoint 01</p>
          <h2>
            Back on the <em>route.</em>
          </h2>
          <p>Log in to pick up where you left off and check your bearing for the week.</p>
        </aside>
        <div className="auth-main">
          <form className="auth-card" onSubmit={handleSubmit} noValidate>
            <h1>Log in</h1>
            {sessionExpired && (
              <p className="form-notice" role="status">
                Your session has ended. Log in again to continue.
              </p>
            )}
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
              type="password"
              value={values.password}
              onChange={bind('password')}
              autoComplete="current-password"
              error={errors.password}
            />
            {errors.form && (
              <p className="form-error" role="alert">
                {errors.form}
              </p>
            )}
            <button type="submit" className="button button-primary" disabled={submitting}>
              {submitting ? 'Logging in...' : 'Log in'}
            </button>
            <p className="auth-switch">
              New to Compass?{' '}
              <Link to="/register" className="text-link">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </Main>
    </>
  )
}
