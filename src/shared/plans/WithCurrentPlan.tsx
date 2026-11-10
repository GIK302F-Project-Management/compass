import { Outlet } from 'react-router'
import { TopBar } from '@/shared/layout/TopBar'
import { UserMenu } from '@/shared/layout/UserMenu'
import { Main } from '@/shared/layout/Main'
import { CurrentPlanProvider } from './CurrentPlanProvider'
import { useCurrentPlan } from './useCurrentPlan'

// Route layout for the pages behind the login: loads the student's plans first, then shows the page.
export function WithCurrentPlan() {
  return (
    <CurrentPlanProvider>
      <WaitForPlan />
    </CurrentPlanProvider>
  )
}

function WaitForPlan() {
  const state = useCurrentPlan()

  if (state?.status === 'ready' && state.plan) return <Outlet />

  const failed = state?.status === 'error'
  return (
    <>
      <TopBar actions={<UserMenu />} />
      <Main>
        {failed ? (
          <div role="alert">
            <p>Could not load your plans. Check your connection and that compass-backend is running.</p>
            <button className="button" onClick={() => void state?.reload()}>
              Try again
            </button>
          </div>
        ) : (
          <p role="status">Loading your plans...</p>
        )}
      </Main>
    </>
  )
}
