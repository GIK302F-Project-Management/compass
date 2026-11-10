import { useCurrentPlan } from '@/shared/plans/useCurrentPlan'
import './PlanSwitcher.css'

// Which plan the student is working in. With several plans it is a menu to switch between them;
// with one it is just a label, so the student always knows whose activities they are looking at.
export function PlanSwitcher() {
  const state = useCurrentPlan()
  if (!state?.plan) return null

  const { plan, plans, select } = state
  return (
    <div className="plan-switcher">
      <label htmlFor="plan-switcher-select">Plan</label>
      {plans.length > 1 ? (
        <select id="plan-switcher-select" value={plan.id} onChange={(event) => select(event.target.value)}>
          {plans.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.memberCount > 1 ? ` (${item.memberCount})` : ''}
            </option>
          ))}
        </select>
      ) : (
        <span id="plan-switcher-select" className="plan-switcher-name">
          {plan.name}
        </span>
      )}
    </div>
  )
}
