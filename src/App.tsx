import './App.css'
import { Routes, Route } from "react-router";
import { Landing } from './pages/Landing';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Activity } from './pages/ActivityPage';
import { NotFound } from './pages/NotFound';
import { GoalsPage } from './pages/GoalsPage'


function App() {
  return <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
          <Route path="/activity/:id" element={<Activity />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/goals" element={<GoalsPage />} />
        </Routes>
}

export default App
