import { Routes, Route } from 'react-router-dom'
import Upload from './pages/Upload'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/"                       element={<Upload />} />
      <Route path="/dashboard/:sessionId"   element={<Dashboard />} />
    </Routes>
  )
}
