import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { listPlans, type Plan } from '@/shared/api/plans'
import { useSession } from '@/shared/session/useSession'
import { CurrentPlanContext, type CurrentPlanState } from './currentPlanContext'

const storageKey = (email: string) => `compass.currentPlan.${email}`

function readChoice(email: string): string | null {
  try {
    return localStorage.getItem(storageKey(email))
  } catch {
    return null
  }
}

// Keeps the student's plans and which one they are working in. The choice is remembered per account in
// localStorage, so a refresh stays in the same plan; if that plan is gone, the first one is used.
export function CurrentPlanProvider({ children }: { children: ReactNode }) {
  const email = useSession()?.email ?? ''
  const [status, setStatus] = useState<CurrentPlanState['status']>('loading')
  const [plans, setPlans] = useState<Plan[]>([])
  const [chosenId, setChosenId] = useState<string | null>(() => readChoice(email))

  const applyPlans = useCallback(
    (found: Plan[], choose?: string) => {
      setPlans(found)
      setChosenId((current) => {
        const wanted = choose ?? current ?? readChoice(email)
        const next = found.some((plan) => plan.id === wanted) ? wanted : (found[0]?.id ?? null)
        if (next) localStorage.setItem(storageKey(email), next)
        return next
      })
      setStatus('ready')
    },
    [email],
  )

  // Asks the backend again, e.g. after a plan was created, renamed or left. `choose` makes that plan the current one.
  const reload = useCallback(
    async (choose?: string) => {
      try {
        applyPlans(await listPlans(), choose)
      } catch {
        setStatus('error')
      }
    },
    [applyPlans],
  )

  useEffect(() => {
    let cancelled = false
    listPlans()
      .then((found) => {
        if (!cancelled) applyPlans(found)
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [applyPlans])

  const select = useCallback(
    (planId: string) => {
      setChosenId(planId)
      localStorage.setItem(storageKey(email), planId)
    },
    [email],
  )

  const value = useMemo<CurrentPlanState>(() => {
    const plan = plans.find((item) => item.id === chosenId) ?? null
    return { status, plans, plan, select, reload }
  }, [status, plans, chosenId, select, reload])

  return <CurrentPlanContext.Provider value={value}>{children}</CurrentPlanContext.Provider>
}
