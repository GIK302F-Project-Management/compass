import './App.css'
import { Routes, Route } from "react-router";
import { Landing } from './pages/Landing';
import { Register } from './pages/Register';
import { Home } from './pages/Home';
import { Activity } from './pages/ActivityPage';
import { NotFound } from './pages/NotFound';


function App() {
  return <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
}

export default App
