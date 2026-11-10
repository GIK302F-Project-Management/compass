import { useEffect, useState } from 'react'
import {
  createInvitation,
  invitationLink,
  listInvitations,
  revokeInvitation,
  type Invitation,
} from '@/shared/api/plans'
import './InvitationsPanel.css'

const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' })

// The owner's tools to bring people in: make an invitation link, copy it, take it back.
export function InvitationsPanel({ planId }: { planId: string }) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [problem, setProblem] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listInvitations(planId)
      .then((loaded) => {
        if (!cancelled) setInvitations(loaded)
      })
      .catch(() => {
        if (!cancelled) setProblem('Could not load the invitation links.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [planId])

  async function handleCreate() {
    setProblem('')
    try {
      const created = await createInvitation(planId)
      setInvitations((current) => [created, ...current])
    } catch {
      setProblem('Could not create an invitation link. Please try again.')
    }
  }

  async function handleRevoke(invitation: Invitation) {
    if (!window.confirm('Revoke this link? Nobody will be able to join with it anymore.')) return
    setProblem('')
    try {
      await revokeInvitation(planId, invitation.id)
      setInvitations((current) => current.filter((item) => item.id !== invitation.id))
    } catch {
      setProblem('Could not revoke the link. Please try again.')
    }
  }

  async function handleCopy(invitation: Invitation) {
    try {
      await navigator.clipboard.writeText(invitationLink(invitation.token))
      setCopiedId(invitation.id)
    } catch {
      setCopiedId(null)
      setProblem('Could not copy the link. Select it and copy it by hand.')
    }
  }

  return (
    <section className="invitations" aria-labelledby="invitations-heading">
      <h3 id="invitations-heading">Invite students</h3>
      <p>
        Send an invitation link to a classmate. They log in, open the link and join the plan. Each link works for a
        week, and you can revoke it at any time.
      </p>

      {problem && (
        <p className="form-error" role="alert">
          {problem}
        </p>
      )}

      <div>
        <button type="button" className="button button-small" onClick={handleCreate}>
          Create invitation link
        </button>
      </div>

      {loading && <p role="status">Loading the links...</p>}

      {!loading && invitations.length === 0 && <p>No active links.</p>}

      <p role="status">{copiedId ? 'Link copied. Send it to the student you want to invite.' : ''}</p>

      {invitations.length > 0 && (
        <ul className="invitation-list">
          {invitations.map((invitation) => (
            <li key={invitation.id}>
              <input
                type="text"
                readOnly
                value={invitationLink(invitation.token)}
                aria-label="Invitation link"
                onFocus={(event) => event.target.select()}
              />
              <span className="invitation-expiry">Expires {dateFormat.format(new Date(invitation.expiresAt))}</span>
              <button type="button" className="button button-small" onClick={() => handleCopy(invitation)}>
                {copiedId === invitation.id ? 'Copied' : 'Copy link'}
              </button>
              <button
                type="button"
                className="button button-small button-danger"
                onClick={() => handleRevoke(invitation)}
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
