import { useEffect, useRef, useState } from 'react'
import { listActivities } from '@/features/activities/api/activities'
import { clearLastPlan, loadLastPlan, saveLastPlan, type SavedPlan } from './api/lastPlan'
import { generateStudyPlan, type PlanFailure } from '@/shared/api/studyPlans'
import { useSession } from '@/shared/session/useSession'
import { AppHeader } from '@/shared/layout/AppHeader'
import { PlanForm } from './PlanForm'
import { PlanResult } from './PlanResult'
import { Main } from '@/shared/layout/Main'
import { addDays, toIsoDate } from '@/shared/utils/dates'
import {
  MAX_DEADLINE_DAYS,
  defaultPlanValues,
  hasPlanErrors,
  isPristineGoal,
  toPlanRequest,
  validatePlan,
  type PlanErrors,
  type PlanValues,
} from './validation/plan'
import './PlanPage.css'

const NO_ERRORS: PlanErrors = { goalErrors: {} }

const FAILURE_MESSAGES: Record<PlanFailure, string> = {
  invalid: 'Compass could not accept these details. Check the dates and hours, then try again.',
  'ai-failed': 'The AI planner could not put together a valid plan this time. Please try again.',
  busy: 'The AI planner is busy right now. Please try again in a minute.',
  timeout: 'The AI planner took too long to answer. Please try again.',
  'session-expired': 'Your session has ended. Log in again to continue.',
}
const UNREACHABLE_MESSAGE = 'Compass could not reach the planner. Check your connection and try again.'

// Values to show when the page opens: the last plan's inputs, or a fresh form.
function initialValues(saved: SavedPlan | null): PlanValues {
  if (!saved) return defaultPlanValues()
  const today = toIsoDate(new Date())
  // A start day in the past would be refused, so move it to today and let the checks point at any late deadline.
  return { ...saved.values, startDate: saved.values.startDate < today ? today : saved.values.startDate }
}

export function PlanPage() {
  const session = useSession()
  const ownerEmail = session?.email ?? ''
  const [saved, setSaved] = useState(() => loadLastPlan(ownerEmail))
  const [values, setValues] = useState(() => initialValues(saved))
  const [errors, setErrors] = useState<PlanErrors>(NO_ERRORS)
  const [checkLive, setCheckLive] = useState(false) // after a failed submit, re-check on every change
  const [generating, setGenerating] = useState(false)
  const [prefilledIds, setPrefilledIds] = useState<string[]>([])
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [generatedCount, setGeneratedCount] = useState(0)
  const formRef = useRef<HTMLFormElement>(null)
  const resultHeadingRef = useRef<HTMLHeadingElement>(null)

  // No saved plan (first visit, or after "start over"): offer the student's upcoming activities as goals,
  // so only the hours are left to fill in.
  useEffect(() => {
    if (saved) return
    let cancelled = false
    listActivities(ownerEmail).then((activities) => {
      if (cancelled) return
      const today = toIsoDate(new Date())
      const lastDay = addDays(today, MAX_DEADLINE_DAYS)
      const upcoming = activities.filter((a) => !a.done && a.dueDate >= today && a.dueDate <= lastDay)
      if (upcoming.length === 0) return
      setPrefilledIds(upcoming.map((a) => a.id))
      setValues((current) => {
        // Never overwrite something the student already typed.
        const [onlyGoal] = current.goals
        const untouched = current.goals.length === 1 && onlyGoal !== undefined && isPristineGoal(onlyGoal)
        if (!untouched) return current
        return {
          ...current,
          goals: upcoming.map((a) => ({ id: a.id, title: a.title, deadline: a.dueDate, hours: '' })),
        }
      })
    })
    return () => {
      cancelled = true
    }
  }, [ownerEmail, saved])

  // After a failed submit, move the keyboard to the first field that needs attention.
  useEffect(() => {
    if (failedAttempts === 0) return
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [failedAttempts])

  // After a new plan arrives, move the reader to it.
  useEffect(() => {
    if (generatedCount === 0) return
    resultHeadingRef.current?.focus()
  }, [generatedCount])

  function handleChange(next: PlanValues) {
    setValues(next)
    if (checkLive) {
      setErrors(validatePlan(next))
    } else if (errors.form) {
      setErrors({ ...errors, form: undefined })
    }
  }

  async function handleSubmit() {
    const validation = validatePlan(values)
    setCheckLive(true)
    setErrors(validation)
    if (hasPlanErrors(validation)) {
      setFailedAttempts((count) => count + 1)
      return
    }

    const request = toPlanRequest(values)
    setGenerating(true)
    try {
      const result = await generateStudyPlan(request)
      if (result.ok) {
        const next: SavedPlan = { values, request, plan: result.plan, generatedAt: new Date().toISOString() }
        saveLastPlan(ownerEmail, next)
        setSaved(next)
        setGeneratedCount((count) => count + 1)
      } else {
        setErrors({ goalErrors: {}, form: FAILURE_MESSAGES[result.error] })
      }
    } catch {
      setErrors({ goalErrors: {}, form: UNREACHABLE_MESSAGE })
    } finally {
      setGenerating(false)
    }
  }

  function handleReset() {
    clearLastPlan(ownerEmail)
    setSaved(null)
    setValues(defaultPlanValues())
    setErrors(NO_ERRORS)
    setCheckLive(false)
    setPrefilledIds([])
  }

  const showPrefillNote = values.goals.some((goal) => prefilledIds.includes(goal.id))

  return (
    <>
      <AppHeader title="Study plan" />
      <Main className="plan-page">
        <header className="page-intro">
          <p className="kicker">Plan your route</p>
          <h2>Turn your deadlines into a daily plan.</h2>
          <p>
            Tell Compass how much time you have and what is due. It spreads the work over your days, earliest deadlines
            first.
          </p>
        </header>

        <PlanForm
          values={values}
          errors={errors}
          generating={generating}
          hasPlan={saved !== null}
          showPrefillNote={showPrefillNote}
          formRef={formRef}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onReset={handleReset}
        />

        {saved && <PlanResult saved={saved} headingRef={resultHeadingRef} />}
      </Main>
    </>
  )
}
