import { createContext } from 'react'
import type { Plan } from '@/shared/api/plans'

export type CurrentPlanState = {
  status: 'loading' | 'ready' | 'error'
  plans: Plan[] // every plan the student is in
  plan: Plan | null // the one the student is working in (null until the plans are loaded)
  select: (planId: string) => void
  // Loads the plans again, after one was created, joined, renamed, left or deleted.
  // `choose` picks which plan to work in afterwards (for example the one just joined).
  reload: (choose?: string) => Promise<void>
}

// null outside CurrentPlanProvider (the login pages), where there is no plan to speak of.
export const CurrentPlanContext = createContext<CurrentPlanState | null>(null)
