import { Navigate, Routes, Route, useLocation } from 'react-router'
import { LandingPage } from '@/features/landing/LandingPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { HomePage } from '@/features/home/HomePage'
import { ActivityPage } from '@/features/activities/ActivityPage'
import { GoalsPage } from '@/features/goals/GoalsPage'
import { PlannerPage } from '@/features/planner/PlannerPage'
import { PlansPage } from '@/features/collaboration/PlansPage'
import { PlanDetailPage } from '@/features/collaboration/PlanDetailPage'
import { JoinPage } from '@/features/collaboration/JoinPage'
import { NotFoundPage } from './NotFoundPage'
import { GuestOnly, RequireAuth } from '@/features/auth/RouteGuards'
import { SkipLink } from '@/shared/layout/SkipLink'
import { WithCurrentPlan } from '@/shared/plans/WithCurrentPlan'

// The two planners became one page; old links and bookmarks keep working.
function MovedTo({ path, search }: { path: string; search?: string }) {
  const location = useLocation()
  return <Navigate to={{ pathname: path, search: search ?? location.search }} replace />
}

function App() {
  return (
    <>
      <SkipLink />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<GuestOnly />}>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<WithCurrentPlan />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/activity/:id" element={<ActivityPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/route" element={<MovedTo path="/planner" />} />
            <Route path="/plan" element={<MovedTo path="/planner" search="?mode=hand" />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/plans/:id" element={<PlanDetailPage />} />
            <Route path="/join/:token" element={<JoinPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
