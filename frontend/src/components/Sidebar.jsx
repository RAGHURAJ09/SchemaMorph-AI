import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const NAV_ITEMS = [
  {
    id: 'upload',
    label: 'New Analysis',
    to: '/upload',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    to: '/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'History',
    to: '/history',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 15" />
      </svg>
    ),
  },
  {
    id: 'team',
    label: 'Team',
    to: '/team',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Settings',
    to: '/profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
]

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const isActive = (item) => {
    if (item.id === 'dashboard') return location.pathname.startsWith('/dashboard')
    return location.pathname === item.to
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initial = user?.email?.charAt(0)?.toUpperCase() || 'U'

  return (
    <>
      {/* Overlay for mobile */}
      {!collapsed && (
        <div
          className="sidebar-overlay"
          onClick={onToggle}
          style={{
            display: 'none',
            position: 'fixed', inset: 0, zIndex: 89,
            background: 'rgba(0,0,0,0.5)',
          }}
        />
      )}

      <aside
        style={{
          width: collapsed ? 64 : 240,
          minHeight: '100vh',
          background: 'rgba(10,13,20,0.97)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(29,158,117,0.12)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 90,
          transition: 'width 0.25s cubic-bezier(.4,0,.2,1)',
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: collapsed ? '20px 16px' : '20px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          cursor: 'pointer', flexShrink: 0,
          transition: 'padding 0.25s',
        }} onClick={() => navigate('/upload')}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #1D9E75, #0d6e52)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff',
            fontFamily: 'Space Grotesk, sans-serif',
            flexShrink: 0,
            boxShadow: '0 0 16px rgba(29,158,117,0.35)',
          }}>S</div>
          {!collapsed && (
            <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700, fontSize: 16, color: '#fff',
              whiteSpace: 'nowrap', opacity: collapsed ? 0 : 1,
              transition: 'opacity 0.2s',
            }}>
              Schema<span style={{ color: '#1D9E75' }}>Morph</span> AI
            </span>
          )}
          {/* Toggle button */}
          <button
            onClick={(e) => { e.stopPropagation(); onToggle() }}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 4,
              display: 'flex', alignItems: 'center', flexShrink: 0,
              borderRadius: 6, transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#1D9E75'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {collapsed
                ? <><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></>
                : <><line x1="21" y1="12" x2="9" y2="12" /><line x1="21" y1="6" x2="9" y2="6" /><line x1="21" y1="18" x2="9" y2="18" /></>
              }
            </svg>
          </button>
        </div>

        {/* Section label */}
        {!collapsed && (
          <div style={{
            padding: '16px 20px 8px',
            fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
            color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase',
            fontFamily: 'Space Grotesk, sans-serif',
          }}>
            Navigation
          </div>
        )}

        {/* Nav items */}
        <nav style={{ flex: 1, padding: collapsed ? '16px 8px' : '8px 12px', overflowY: 'auto' }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item)
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'dashboard') {
                    // Check if we have an active session in local storage
                    const stored = localStorage.getItem('schemamorph-analysis-storage')
                    let sid = null
                    try {
                      if (stored) {
                        const parsed = JSON.parse(stored)
                        sid = parsed.state?.analysisData?.session_id
                      }
                    } catch (e) {}
                    
                    if (sid) {
                      navigate(`/dashboard/${sid}`)
                    } else {
                      navigate('/upload') // No active analysis, redirect to upload
                    }
                  } else {
                    navigate(item.to)
                  }
                }}
                title={collapsed ? item.label : undefined}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '10px 13px' : '10px 14px',
                  marginBottom: 3,
                  borderRadius: 10,
                  border: 'none',
                  background: active
                    ? 'rgba(29,158,117,0.15)'
                    : 'transparent',
                  color: active ? '#1D9E75' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  fontFamily: 'Space Grotesk, sans-serif',
                  transition: 'all 0.18s',
                  position: 'relative',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderLeft: active ? '2px solid #1D9E75' : '2px solid transparent',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                  }
                }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
                {active && !collapsed && (
                  <span style={{
                    marginLeft: 'auto',
                    width: 6, height: 6,
                    borderRadius: '50%',
                    background: '#1D9E75',
                    boxShadow: '0 0 8px #1D9E75',
                    flexShrink: 0,
                  }} />
                )}
              </button>
            )
          })}
        </nav>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 12px' }} />

        {/* User section */}
        <div style={{ padding: collapsed ? '12px 8px' : '12px', flexShrink: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: collapsed ? '10px 11px' : '10px 12px',
            borderRadius: 10,
            background: 'rgba(29,158,117,0.08)',
            border: '1px solid rgba(29,158,117,0.12)',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'linear-gradient(135deg, #1D9E75, #0d6e52)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: '#fff',
              fontFamily: 'Space Grotesk, sans-serif', flexShrink: 0,
            }}>{initial}</div>
            {!collapsed && (
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 500, color: '#fff',
                  fontFamily: 'Space Grotesk, sans-serif',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user?.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>
                  Free plan
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Log out' : undefined}
            style={{
              width: '100%', marginTop: 6,
              display: 'flex', alignItems: 'center', gap: 8,
              padding: collapsed ? '8px 13px' : '8px 12px',
              borderRadius: 8, border: 'none',
              background: 'transparent',
              color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer', fontSize: 13,
              fontFamily: 'Space Grotesk, sans-serif',
              transition: 'all 0.2s',
              justifyContent: collapsed ? 'center' : 'flex-start',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && <span>Log out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
