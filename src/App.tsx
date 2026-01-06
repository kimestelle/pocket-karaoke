import { Routes, Route } from 'react-router-dom'
import './App.css'

import Room from './pages/Room'
import Corridor from './pages/Corridor'

function App() {

  return (
    <Routes>
      <Route path="/" element={<Corridor />} />
      <Route path="/room" element={<Room />} />
    </Routes>
  )
}

export default App