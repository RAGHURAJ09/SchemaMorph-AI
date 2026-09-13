import { useState, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import Upload from './pages/Upload'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import useAuthStore from './store/authStore'
import WebGLLoader from './components/WebGLLoader'
import SidebarNav from './components/SidebarNav'

function ProtectedRoute({ children }) {
  const token = useAuthStore((state) => state.token)
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

export default function App() {
  const [loaded, setLoaded] = useState(false)
  const onLoaderDone = useCallback(() => setLoaded(true), [])

  return (
    <>
      <style>{``}</style>
      {!loaded && <WebGLLoader onComplete={onLoaderDone} />}
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/upload" element={
          <ProtectedRoute>
            <SidebarNav />
            <div className="ml-16">
              <Upload />
            </div>
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard/:sessionId" element={
          <ProtectedRoute>
            <SidebarNav />
            <div className="ml-16">
              <Dashboard />
            </div>
          </ProtectedRoute>
        } />
      </Routes>
    </>
  )
}
