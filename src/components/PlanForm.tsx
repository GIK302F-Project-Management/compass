import type { ChangeEvent, FormEvent, RefObject } from 'react'
import { TrashIcon } from './Icons'
import { FormField } from './FormField'
import { toIsoDate } from '../utils/dates'
import {
  MAX_DAILY_HOURS,
  MAX_GOALS,
  emptyGoal,
  lastAllowedDeadline,
  type GoalValues,
  type PlanErrors,
  type PlanValues,
} from '../validation/studyPlan'

type PlanFormProps = {
  values: PlanValues
  errors: PlanErrors
  generating: boolean
  hasPlan: boolean // a plan is already shown, so the button says "again"
  showPrefillNote: boolean
  formRef: RefObject<HTMLFormElement | null>
  onChange: (values: PlanValues) => void
  onSubmit: () => void
  onReset: () => void
}

// The inputs of the study plan, drawn as a sheet of the atlas.
export function PlanForm({
  values,
  errors,
  generating,
  hasPlan,
  showPrefillNote,
  formRef,
  onChange,
  onSubmit,
  onReset,
}: PlanFormProps) {
  const today = toIsoDate(new Date())
  const latestDeadline = values.startDate ? lastAllowedDeadline(values.startDate) : undefined

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  function setField(field: 'startDate' | 'dailyHours') {
    return (event: ChangeEvent<HTMLInputElement>) => onChange({ ...values, [field]: event.target.value })
  }

  function setGoalField(id: string, field: keyof Omit<GoalValues, 'id'>) {
    return (event: ChangeEvent<HTMLInputElement>) =>
      onChange({
        ...values,
        goals: values.goals.map((goal) => (goal.id === id ? { ...goal, [field]: event.target.value } : goal)),
      })
  }

  function addGoal() {
    onChange({ ...values, goals: [...values.goals, emptyGoal()] })
  }

  function removeGoal(id: string) {
    onChange({ ...values, goals: values.goals.filter((goal) => goal.id !== id) })
  }

  return (
    <form ref={formRef} className="sheet plan-form" onSubmit={handleSubmit} noValidate>
      <div className="sheet-header">
        <span>Sheet 01 · Your inputs</span>
      </div>

      <fieldset className="plan-fieldset" disabled={generating}>
        <section className="sheet-body plan-section" aria-labelledby="plan-time-heading">
          <h2 id="plan-time-heading" className="plan-section-title">
            Your time
          </h2>
          <div className="plan-row">
            <FormField
              id="plan-start"
              label="Start day"
              type="date"
              min={today}
              value={values.startDate}
              onChange={setField('startDate')}
              error={errors.startDate}
            />
            <FormField
              id="plan-daily"
              label="Hours per day"
              inputMode="decimal"
              placeholder="2"
              hint={`How long you can study each day, up to ${MAX_DAILY_HOURS}. Decimals are fine: 1.5.`}
              value={values.dailyHours}
              onChange={setField('dailyHours')}
              error={errors.dailyHours}
            />
          </div>
        </section>

        <section className="sheet-body plan-section" aria-labelledby="plan-goals-heading">
          <h2 id="plan-goals-heading" className="plan-section-title">
            Your goals
          </h2>
          <p className="plan-help">
            What needs to get done, by when, and how many hours it will take. The earliest deadlines are planned first.
          </p>
          {showPrefillNote && (
            <p className="plan-note">
              We added your upcoming activities as goals. Tell us how many hours each one needs, or remove the ones you
              don't want to plan.
            </p>
          )}

          {values.goals.length === 0 && <p className="plan-help">No goals yet. Add the first one below.</p>}

          <ol className="plan-goals">
            {values.goals.map((goal, index) => {
              const goalErrors = errors.goalErrors[goal.id] ?? {}
              return (
                <li key={goal.id} className="plan-goal">
                  <div className="plan-goal-header">
                    <span className="kicker">Goal {String(index + 1).padStart(2, '0')}</span>
                    <button
                      type="button"
                      className="button button-small button-icon button-danger"
                      onClick={() => removeGoal(goal.id)}
                      aria-label={`Remove goal ${index + 1}${goal.title.trim() ? `: ${goal.title.trim()}` : ''}`}
                      title="Remove goal"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                  <FormField
                    id={`goal-${goal.id}-title`}
                    label="What do you need to get done?"
                    placeholder="e.g. Revise chapters 3 to 5"
                    value={goal.title}
                    onChange={setGoalField(goal.id, 'title')}
                    error={goalErrors.title}
                  />
                  <div className="plan-row">
                    <FormField
                      id={`goal-${goal.id}-deadline`}
                      label="Deadline"
                      type="date"
                      min={values.startDate || undefined}
                      max={latestDeadline}
                      value={goal.deadline}
                      onChange={setGoalField(goal.id, 'deadline')}
                      error={goalErrors.deadline}
                    />
                    <FormField
                      id={`goal-${goal.id}-hours`}
                      label="Hours needed"
                      inputMode="decimal"
                      placeholder="3"
                      hint="The total time this goal needs."
                      value={goal.hours}
                      onChange={setGoalField(goal.id, 'hours')}
                      error={goalErrors.hours}
                    />
                  </div>
                </li>
              )
            })}
          </ol>

          {errors.goals && (
            <p className="field-error" role="alert">
              {errors.goals}
            </p>
          )}

          <button
            type="button"
            className="button button-small plan-add"
            onClick={addGoal}
            disabled={values.goals.length >= MAX_GOALS}
          >
            + Add goal
          </button>
        </section>
      </fieldset>

      <div className="sheet-actions plan-actions">
        <button type="submit" className="button button-primary" disabled={generating}>
          {generating ? 'Drawing your route...' : hasPlan ? 'Generate the plan again' : 'Generate my plan'}
        </button>
        {hasPlan && !generating && (
          <button type="button" className="text-link button-link" onClick={onReset}>
            Clear and start over
          </button>
        )}
      </div>

      {generating && (
        <p className="plan-progress" role="status">
          Compass is spreading your goals across your days. This usually takes a few seconds, and up to a minute when
          the AI planner is on.
        </p>
      )}
      {errors.form && (
        <p className="form-error plan-form-error" role="alert">
          {errors.form}
        </p>
      )}
    </form>
  )
}
