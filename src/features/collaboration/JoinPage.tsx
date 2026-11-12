import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError } from '@/shared/api/http'
import { acceptInvitation, previewInvitation, type InvitationPreview } from './api/sharing'
import { AppHeader } from '@/shared/layout/AppHeader'
import { Main } from '@/shared/layout/Main'
import { formatDueDate } from '@/shared/utils/dates'
import './JoinPage.css'

type Preview =
  | { status: 'loading' }
  | { status: 'ready'; invitation: InvitationPreview }
  | { status: 'invalid' } // unknown, expired or revoked
  | { status: 'error' }

// Where an invitation link lands (the student has to be logged in). It says which activity the link is for and
// lets the student join it, so it shows up in their atlas, or just open it when they are in it already.
export function JoinPage() {
  const { token = '' } = useParams()
  const navigate = useNavigate()
  const [preview, setPreview] = useState<Preview>({ status: 'loading' })
  const [joining, setJoining] = useState(false)
  const [problem, setProblem] = useState('')

  useEffect(() => {
    let cancelled = false
    previewInvitation(token)
      .then((invitation) => {
        if (!cancelled) setPreview({ status: 'ready', invitation })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setPreview(error instanceof ApiError && error.status === 404 ? { status: 'invalid' } : { status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function handleJoin() {
    setJoining(true)
    setProblem('')
    try {
      const activityId = await acceptInvitation(token)
      navigate(`/activity/${activityId}`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 409)
        setProblem('This activity is full, so nobody else can join.')
      else if (error instanceof ApiError && error.status === 404) setPreview({ status: 'invalid' })
      else setProblem('Could not join the activity. Please try again.')
      setJoining(false)
    }
  }

  return (
    <>
      <AppHeader title="Join an activity" />
      <Main className="join-page">
        {preview.status === 'loading' && <p role="status">Checking the invitation...</p>}

        {preview.status === 'error' && (
          <p className="form-error" role="alert">
            Could not check the invitation. Please try again later.
          </p>
        )}

        {preview.status === 'invalid' && (
          <section className="sheet join-sheet">
            <header className="sheet-header">
              <span>Invitation</span>
            </header>
            <div className="sheet-body">
              <h2>This link does not work</h2>
              <p>It may have expired or been revoked. Ask the owner of the activity for a new one.</p>
            </div>
            <div className="sheet-actions">
              <Link to="/home" className="button button-small">
                Back to your atlas
              </Link>
            </div>
          </section>
        )}

        {preview.status === 'ready' && (
          <section className="sheet join-sheet">
            <header className="sheet-header">
              <span>Invitation{preview.invitation.subject && ` · ${preview.invitation.subject}`}</span>
              <span>
                {preview.invitation.memberCount} {preview.invitation.memberCount === 1 ? 'member' : 'members'}
              </span>
            </header>
            <div className="sheet-body">
              <p className="kicker">{preview.invitation.ownerName} invited you to</p>
              <h2>{preview.invitation.activityTitle}</h2>
              <p className="sheet-due">Due {formatDueDate(preview.invitation.dueDate)}</p>
              {preview.invitation.alreadyMember ? (
                <p>This activity is already in your atlas.</p>
              ) : (
                <p>
                  It joins your atlas with the same list of tasks as the other members. The tasks you take go into your
                  own route.
                </p>
              )}
              {problem && (
                <p className="form-error" role="alert">
                  {problem}
                </p>
              )}
            </div>
            <div className="sheet-actions">
              <button type="button" className="button" onClick={handleJoin} disabled={joining}>
                {preview.invitation.alreadyMember ? 'Open the activity' : joining ? 'Joining...' : 'Join the activity'}
              </button>
              <Link to="/home" className="text-link">
                Not now
              </Link>
            </div>
          </section>
        )}
      </Main>
    </>
  )
}
