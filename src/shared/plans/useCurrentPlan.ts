import { useContext } from 'react'
import type { Plan } from '@/shared/api/plans'
import { CurrentPlanContext, type CurrentPlanState } from './currentPlanContext'

// The plans of the student and the one they work in, or null when used outside CurrentPlanProvider.
export function useCurrentPlan(): CurrentPlanState | null {
  return useContext(CurrentPlanContext)
}

// For pages behind the login: WithCurrentPlan only shows them once a plan is chosen, so there always is one.
export function useActivePlan(): Plan {
  const plan = useCurrentPlan()?.plan
  if (!plan) throw new Error('useActivePlan needs a page inside WithCurrentPlan')
  return plan
}

export type ReadyPlanState = CurrentPlanState & { plan: Plan }

// The plans and the current one, for pages behind the login (see useActivePlan).
export function usePlanState(): ReadyPlanState {
  const state = useCurrentPlan()
  if (!state?.plan) throw new Error('usePlanState needs a page inside WithCurrentPlan')
  return { ...state, plan: state.plan }
}
