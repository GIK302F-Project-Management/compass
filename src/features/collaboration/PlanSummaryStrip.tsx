import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getPlanProgress, type Plan, type PlanProgress } from '@/shared/api/plans'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import './PlanSummaryStrip.css'

// A line at the top of the home page: the plan the student works in, how far along it is, and who shares it.
// Give it a `key` of the plan id so it starts fresh when the student switches plans.
export function PlanSummaryStrip({ plan }: { plan: Plan }) {
  const [progress, setProgress] = useState<PlanProgress | null>(null)

  useEffect(() => {
    let cancelled = false
    getPlanProgress(plan.id)
      .then((loaded) => {
        if (!cancelled) setProgress(loaded)
      })
      .catch(() => undefined) // the strip is a summary: without the numbers it just shows the plan
    return () => {
      cancelled = true
    }
  }, [plan.id])

  return (
    <section className="plan-strip" aria-label="Plan summary">
      <p className="plan-strip-line">
        <strong>{plan.name}</strong>
        <span>
          {plan.memberCount} {plan.memberCount === 1 ? 'member' : 'members'}
        </span>
        {progress && (progress.tasksTotal > 0 || progress.activitiesTotal > 0) && <span>{progress.percent}% done</span>}
        <Link to={`/plans/${plan.id}`} className="text-link">
          {plan.memberCount > 1 ? 'Progress and members' : 'Share this plan'}
        </Link>
      </p>
      {progress && <ProgressBar value={progress.percent} max={100} label="Plan progress" />}
    </section>
  )
}
