import { Navigate, Routes, Route, useLocation } from 'react-router'
import { LandingPage } from '@/features/landing/LandingPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { HomePage } from '@/features/home/HomePage'
import { ActivityPage } from '@/features/activities/ActivityPage'
import { PlannerPage } from '@/features/planner/PlannerPage'
import { JoinPage } from '@/features/collaboration/JoinPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { NotFoundPage } from './NotFoundPage'
import { GuestOnly, RequireAuth } from '@/features/auth/RouteGuards'
import { SkipLink } from '@/shared/layout/SkipLink'

// Pages that moved; old links and bookmarks keep working.
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
          <Route path="/home" element={<HomePage />} />
          <Route path="/activity/:id" element={<ActivityPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/route" element={<MovedTo path="/planner" />} />
          <Route path="/plan" element={<MovedTo path="/planner" search="?mode=hand" />} />
          {/* Shared plans became shared activities, which live in the atlas. */}
          <Route path="/plans/*" element={<MovedTo path="/home" search="" />} />
          {/* The goals page was taken out; the atlas and its progress cards cover what it was for. */}
          <Route path="/goals" element={<MovedTo path="/home" search="" />} />
          <Route path="/join/:token" element={<JoinPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
