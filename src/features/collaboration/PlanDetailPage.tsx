import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ApiError } from '@/shared/api/http'
import {
  deletePlan,
  getPlan,
  getPlanProgress,
  removeMember,
  renamePlan,
  type PlanDetails,
  type PlanMember,
  type PlanProgress,
} from '@/shared/api/plans'
import { AppHeader } from '@/shared/layout/AppHeader'
import { Main } from '@/shared/layout/Main'
import { usePlanState } from '@/shared/plans/useCurrentPlan'
import { FormField } from '@/shared/ui/FormField'
import { InvitationsPanel } from './InvitationsPanel'
import { MembersPanel } from './MembersPanel'
import { PlanProgressPanel } from './PlanProgressPanel'
import { validatePlanName } from './validation/plan'
import './PlanDetailPage.css'

type Loaded = { details: PlanDetails; progress: PlanProgress }
type Load = { status: 'loading' } | { status: 'ready'; data: Loaded } | { status: 'missing' } | { status: 'error' }

// One plan: how far the group has got, who is in it, and (for the owner) the invitation links.
export function PlanDetailPage() {
  const { id = '' } = useParams()
  const { plan: current, select, reload } = usePlanState()
  const navigate = useNavigate()

  const [load, setLoad] = useState<Load>({ status: 'loading' })
  const [refreshCount, setRefreshCount] = useState(0)
  const [problem, setProblem] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([getPlan(id), getPlanProgress(id)])
      .then(([details, progress]) => {
        if (!cancelled) setLoad({ status: 'ready', data: { details, progress } })
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setLoad(error instanceof ApiError && error.status === 404 ? { status: 'missing' } : { status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [id, refreshCount])

  const refresh = useCallback(() => setRefreshCount((count) => count + 1), [])

  function retry() {
    setLoad({ status: 'loading' })
    refresh()
  }

  async function handleRename(event: FormEvent) {
    event.preventDefault()
    const invalid = validatePlanName(name)
    setNameError(invalid ?? '')
    if (invalid) return
    try {
      await renamePlan(id, name)
      setRenaming(false)
      refresh()
      void reload() // the switcher shows the new name
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.name) setNameError(error.fieldErrors.name)
      else setProblem('Could not rename the plan. Please try again.')
    }
  }

  async function handleRemove(member: PlanMember) {
    if (!window.confirm(`Remove ${member.name} from the plan?`)) return
    setProblem('')
    try {
      await removeMember(id, member.userId)
      refresh()
      void reload()
    } catch {
      setProblem('Could not remove the member. Please try again.')
    }
  }

  async function handleLeave(details: PlanDetails, me: PlanMember) {
    if (!window.confirm(`Leave "${details.name}"? You will not see its activities anymore.`)) return
    setProblem('')
    try {
      await removeMember(id, me.userId)
      await reload()
      navigate('/plans')
    } catch {
      setProblem('Could not leave the plan. Please try again.')
    }
  }

  async function handleDelete(details: PlanDetails) {
    if (!window.confirm(`Delete "${details.name}" with all its activities and tasks, for every member?`)) return
    setProblem('')
    try {
      await deletePlan(id)
      await reload()
      navigate('/plans')
    } catch {
      setProblem('Could not delete the plan. Please try again.')
    }
  }

  function handleUse() {
    select(id)
    navigate('/home')
  }

  if (load.status !== 'ready') {
    return (
      <>
        <AppHeader title="Plan" />
        <Main className="plan-detail-page">
          {load.status === 'loading' && <p role="status">Loading the plan...</p>}
          {load.status === 'error' && (
            <p className="form-error" role="alert">
              Could not load the plan.{' '}
              <button type="button" className="text-link button-link" onClick={retry}>
                Try again
              </button>
            </p>
          )}
          {load.status === 'missing' && (
            <>
              <p role="alert">This plan does not exist, or you are not part of it.</p>
              <Link to="/plans" className="text-link">
                Back to your plans
              </Link>
            </>
          )}
        </Main>
      </>
    )
  }

  const { details, progress } = load.data
  const isOwner = details.role === 'OWNER'
  const me = details.members.find((member) => member.you)

  return (
    <>
      <AppHeader title="Plan" />
      <Main className="plan-detail-page">
        <header className="page-intro">
          <p className="kicker">{isOwner ? 'Your plan' : 'Shared with you'}</p>
          {renaming ? (
            <form className="rename-form" onSubmit={handleRename} noValidate>
              <FormField
                id="plan-rename"
                label="Plan name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                error={nameError}
                autoFocus
              />
              <button type="submit" className="button button-small">
                Save
              </button>
              <button type="button" className="button button-small" onClick={() => setRenaming(false)}>
                Cancel
              </button>
            </form>
          ) : (
            <h2>{details.name}</h2>
          )}
          <div className="plan-detail-actions">
            {current.id === details.id ? (
              <span className="kicker">You are working in this plan</span>
            ) : (
              <button type="button" className="button button-small" onClick={handleUse}>
                Work in this plan
              </button>
            )}
            <Link to="/plans" className="text-link">
              All plans
            </Link>
            {isOwner && !renaming && (
              <button
                type="button"
                className="text-link button-link"
                onClick={() => {
                  setName(details.name)
                  setNameError('')
                  setRenaming(true)
                }}
              >
                Rename
              </button>
            )}
          </div>
        </header>

        {problem && (
          <p className="form-error" role="alert">
            {problem}
          </p>
        )}

        <div className="plan-detail-grid">
          <PlanProgressPanel progress={progress} />
          <MembersPanel
            members={details.members}
            isOwner={isOwner}
            onRemove={handleRemove}
            onLeave={() => me && handleLeave(details, me)}
          />
        </div>

        {isOwner && <InvitationsPanel planId={details.id} />}

        {isOwner && (
          <div>
            <button type="button" className="button button-small button-danger" onClick={() => handleDelete(details)}>
              Delete plan
            </button>
          </div>
        )}
      </Main>
    </>
  )
}
