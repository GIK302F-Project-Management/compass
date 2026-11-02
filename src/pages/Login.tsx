import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { loginUser } from '../api/auth'
import { saveSession } from '../api/session'
import { ContourBackground } from '../components/ContourBackground'
import { FormField } from '../components/FormField'
import { TopBar } from '../components/TopBar'
import { validateLogin, type LoginErrors, type LoginValues } from '../validation/login'
import { normalizeEmail } from '../validation/register'

const EMPTY_VALUES: LoginValues = { email: '', password: '' }

export function Login() {
  const navigate = useNavigate()
  const [values, setValues] = useState<LoginValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [submitting, setSubmitting] = useState(false)

  function handleChange(field: keyof LoginValues) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setValues({ ...values, [field]: event.target.value })
      if (errors[field] || errors.form) {
        setErrors({ ...errors, [field]: undefined, form: undefined })
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const validationErrors = validateLogin(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setSubmitting(true)
    try {
      const result = await loginUser(values)
      if (result.ok) {
        saveSession({ name: result.name, email: normalizeEmail(values.email) })
        navigate('/home')
      } else if (result.error === 'not-found') {
        setErrors({ email: 'There is no account with this email. Create one first.' })
      } else {
        setErrors({ password: 'Incorrect password.' })
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
      <main className="auth-page">
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
              type="password"
              value={values.password}
              onChange={handleChange('password')}
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
      </main>
    </>
  )
}
