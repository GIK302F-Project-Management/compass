import './App.css'
import { Routes, Route } from 'react-router'
import { Landing } from './pages/Landing'
import { Register } from './pages/Register'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { Activity } from './pages/ActivityPage'
import { PlanPage } from './pages/PlanPage'
import { NotFound } from './pages/NotFound'
import { GuestOnly, RequireAuth } from './components/RouteGuards'
import { RoutePlanner } from './pages/RoutePlanner'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<GuestOnly />}>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route path="/home" element={<Home />} />
        <Route path="/activity/:id" element={<Activity />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/route" element={<RoutePlanner />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
