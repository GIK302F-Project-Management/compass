import { useCurrentPlan } from '@/shared/plans/useCurrentPlan'
import './PlanSwitcher.css'

// Which plan the student is working in, as a menu to switch between plans. It only shows up once
// the student is in more than one plan: with just their own plan there is nothing to choose.
export function PlanSwitcher() {
  const state = useCurrentPlan()
  if (!state?.plan || state.plans.length < 2) return null

  const { plan, plans, select } = state
  return (
    <div className="plan-switcher">
      <select aria-label="Plan" value={plan.id} onChange={(event) => select(event.target.value)}>
        {plans.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
            {item.memberCount > 1 ? ` (${item.memberCount})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
