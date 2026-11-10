import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '@/shared/api/http'
import { createPlan } from '@/shared/api/plans'
import { AppHeader } from '@/shared/layout/AppHeader'
import { Main } from '@/shared/layout/Main'
import { usePlanState } from '@/shared/plans/useCurrentPlan'
import { FormField } from '@/shared/ui/FormField'
import { PlanCard } from './PlanCard'
import { parseInvitationToken, validatePlanName } from './validation/plan'
import './PlansPage.css'

// Every plan of the student, a form for a new shared plan, and a place to paste an invitation link.
export function PlansPage() {
  const { plans, plan: current, select, reload } = usePlanState()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [creating, setCreating] = useState(false)
  const [createFailed, setCreateFailed] = useState(false)

  const [link, setLink] = useState('')
  const [linkError, setLinkError] = useState('')

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    const problem = validatePlanName(name)
    setNameError(problem ?? '')
    setCreateFailed(false)
    if (problem) return

    setCreating(true)
    try {
      const created = await createPlan(name)
      await reload(created.id) // work in the new plan right away
      navigate(`/plans/${created.id}`)
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.name) setNameError(error.fieldErrors.name)
      else setCreateFailed(true)
      setCreating(false)
    }
  }

  function handleJoin(event: FormEvent) {
    event.preventDefault()
    const token = parseInvitationToken(link)
    if (!token) {
      setLinkError('That does not look like an invitation link. Paste the whole link you were sent.')
      return
    }
    navigate(`/join/${token}`)
  }

  return (
    <>
      <AppHeader title="Shared plans" />
      <Main className="plans-page">
        <header className="page-intro">
          <p className="kicker">Study together</p>
          <h2>Your study plans</h2>
          <p>
            Every activity lives in a plan. Share a plan with other students and you all work on the same activities,
            and see the progress of the whole group.
          </p>
        </header>

        <section className="plan-list" aria-label="Your plans">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} current={plan.id === current.id} onUse={() => select(plan.id)} />
          ))}
        </section>

        <div className="plan-forms">
          <form className="plan-form" onSubmit={handleCreate} noValidate>
            <h3>Start a shared plan</h3>
            <FormField
              id="plan-name"
              label="Plan name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={nameError}
              hint="For example: Statistics exam group"
            />
            {createFailed && (
              <p className="form-error" role="alert">
                Could not create the plan. Please try again.
              </p>
            )}
            <button type="submit" className="button" disabled={creating}>
              {creating ? 'Creating...' : 'Create plan'}
            </button>
          </form>

          <form className="plan-form" onSubmit={handleJoin} noValidate>
            <h3>Join with an invitation</h3>
            <FormField
              id="invitation-link"
              label="Invitation link"
              value={link}
              onChange={(event) => setLink(event.target.value)}
              error={linkError}
              hint="Paste the link another student sent you."
            />
            <button type="submit" className="button">
              Continue
            </button>
          </form>
        </div>
      </Main>
    </>
  )
}
