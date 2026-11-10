import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { getPlanProgress, type Plan, type PlanProgress } from '@/shared/api/plans'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import './PlanCard.css'

type PlanCardProps = {
  plan: Plan
  current: boolean // the plan the student is working in
  onUse: () => void
}

// One plan of the student, as a sheet of the atlas: who is in it, how far along it is, and where to go from here.
export function PlanCard({ plan, current, onUse }: PlanCardProps) {
  const [progress, setProgress] = useState<PlanProgress | null>(null)

  useEffect(() => {
    let cancelled = false
    getPlanProgress(plan.id)
      .then((loaded) => {
        if (!cancelled) setProgress(loaded)
      })
      .catch(() => undefined) // the card still works without its numbers
    return () => {
      cancelled = true
    }
  }, [plan.id])

  const tracked = progress !== null && (progress.tasksTotal > 0 || progress.activitiesTotal > 0)

  return (
    <article className={`sheet plan-card${current ? ' current' : ''}`}>
      <header className="sheet-header">
        <span>{plan.role === 'OWNER' ? 'Owner' : 'Member'}</span>
        <span>
          {plan.memberCount} {plan.memberCount === 1 ? 'member' : 'members'}
        </span>
      </header>
      <div className="sheet-body">
        <h3>{plan.name}</h3>
        {current && <p className="kicker">You are working in this plan</p>}
        {tracked && (
          <>
            <p className="plan-card-progress">{progress.percent}% done</p>
            <ProgressBar value={progress.percent} max={100} label={`Progress of ${plan.name}`} />
          </>
        )}
        {progress !== null && !tracked && <p className="plan-card-progress">No activities yet</p>}
      </div>
      <div className="sheet-actions">
        <Link to={`/plans/${plan.id}`} className="button button-small">
          Open
        </Link>
        {!current && (
          <button type="button" className="button button-small" onClick={onUse}>
            Work in this plan
          </button>
        )}
      </div>
    </article>
  )
}
