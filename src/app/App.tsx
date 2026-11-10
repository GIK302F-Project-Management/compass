import { Routes, Route } from 'react-router'
import { LandingPage } from '@/features/landing/LandingPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { HomePage } from '@/features/activities/HomePage'
import { ActivityPage } from '@/features/activities/ActivityPage'
import { PlanPage } from '@/features/plan/PlanPage'
import { GoalsPage } from '@/features/goals/GoalsPage'
import { RoutePlannerPage } from '@/features/route/RoutePlannerPage'
import { NotFoundPage } from './NotFoundPage'
import { GuestOnly, RequireAuth } from '@/features/auth/RouteGuards'
import { SkipLink } from '@/shared/layout/SkipLink'

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
          <Route path="/home" element={<HomePage />} />
          <Route path="/activity/:id" element={<ActivityPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/plan" element={<PlanPage />} />
          <Route path="/route" element={<RoutePlannerPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
