import { useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '@/shared/api/http'
import { AppHeader } from '@/shared/layout/AppHeader'
import { Main } from '@/shared/layout/Main'
import { getSession, saveSession } from '@/shared/session/session'
import { FormField } from '@/shared/ui/FormField'
import { getProfile, updateName, type Profile } from './api/profile'
import './ProfilePage.css'

const MAX_NAME = 100 // the same limit as at registration
const sinceFormat = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })

type Load = { status: 'loading' } | { status: 'ready'; profile: Profile } | { status: 'error' }

// The student's profile: who they are on Compass. Their name is what classmates see on shared activities,
// so it can be changed here; the email is how they log in, so it stays.
export function ProfilePage() {
  const [load, setLoad] = useState<Load>({ status: 'loading' })
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getProfile()
      .then((profile) => {
        setLoad({ status: 'ready', profile })
        setName(profile.name)
      })
      .catch(() => setLoad({ status: 'error' }))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Please enter your name.')
    if (trimmed.length > MAX_NAME) return setError(`The name must have at most ${MAX_NAME} characters.`)

    setSaving(true)
    setError('')
    try {
      const profile = await updateName(trimmed)
      setLoad({ status: 'ready', profile })
      setName(profile.name)
      setSaved(true)
      // The name in the top bar comes from the session, so it changes at once.
      const session = getSession()
      if (session) saveSession({ ...session, name: profile.name })
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.fieldErrors.name
          ? caught.fieldErrors.name
          : 'Could not save your name. Please try again.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <AppHeader title="Profile" />
      <Main className="profile-page">
        <header className="page-intro">
          <p className="kicker">Your profile</p>
          <h2>{load.status === 'ready' ? load.profile.name : 'Profile'}</h2>
        </header>

        {load.status === 'loading' && <p role="status">Loading your profile...</p>}
        {load.status === 'error' && (
          <p className="form-error" role="alert">
            Could not load your profile. Refresh the page to try again.
          </p>
        )}

        {load.status === 'ready' && (
          <section className="sheet profile-sheet" aria-label="Profile information">
            <div className="sheet-header">
              <span>Profile information</span>
            </div>
            <form className="sheet-body" onSubmit={handleSubmit} noValidate>
              <FormField
                id="profile-name"
                label="Name"
                hint="Classmates see it on the activities you share."
                value={name}
                onChange={(event) => {
                  setName(event.target.value)
                  setError('')
                  setSaved(false)
                }}
                error={error}
              />
              <dl className="profile-facts">
                <div>
                  <dt className="kicker">University email</dt>
                  <dd>{load.profile.email}</dd>
                </div>
                <div>
                  <dt className="kicker">Member since</dt>
                  <dd>{sinceFormat.format(new Date(load.profile.createdAt))}</dd>
                </div>
              </dl>
              <div className="profile-actions">
                <button
                  type="submit"
                  className="button button-small button-primary"
                  disabled={saving || name.trim() === load.profile.name}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <p role="status">{saved ? 'Saved.' : ''}</p>
              </div>
            </form>
          </section>
        )}
      </Main>
    </>
  )
}
