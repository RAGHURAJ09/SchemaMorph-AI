import { useState, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import Landing from './pages/Landing'
import Upload from './pages/Upload'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import History from './pages/History'
import ProfileSettings from './pages/ProfileSettings'
import Team from './pages/Team'

import useAuthStore from './store/authStore'
import WebGLLoader from './components/WebGLLoader'
import AppLayout from './components/AppLayout'

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
      {!loaded && <WebGLLoader onComplete={onLoaderDone} />}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1d26',
            color: '#fff',
            border: '1px solid rgba(29,158,117,0.25)',
            fontFamily: 'Space Grotesk, sans-serif',
            fontSize: 13,
          },
        }}
      />
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ── Protected routes inside AppLayout ── */}
        <Route path="/upload" element={
          <ProtectedRoute>
            <AppLayout><Upload /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/dashboard/:sessionId" element={
          <ProtectedRoute>
            <AppLayout><Dashboard /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/history" element={
          <ProtectedRoute>
            <AppLayout><History /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <AppLayout><ProfileSettings /></AppLayout>
          </ProtectedRoute>
        } />

        <Route path="/team" element={
          <ProtectedRoute>
            <AppLayout><Team /></AppLayout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
