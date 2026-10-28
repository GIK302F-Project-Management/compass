import './App.css'
import { Routes, Route } from "react-router";
import { Home } from './pages/Home';
import { Activity } from './pages/ActivityPage';


function App() {
  return <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/activity" element={<Activity />} />
        </Routes>
}

export default App
