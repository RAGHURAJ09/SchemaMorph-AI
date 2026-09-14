import { useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const PAGE_TITLES = {
  '/upload': { title: 'New Analysis', subtitle: 'Upload your schema to get started' },
  '/history': { title: 'Analysis History', subtitle: 'Browse all past schema analyses' },
  '/team': { title: 'Team', subtitle: 'Manage your team members' },
  '/profile': { title: 'Profile & Settings', subtitle: 'Manage your account preferences' },
}

export default function TopBar({ sidebarCollapsed }) {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)

  const isDashboard = location.pathname.startsWith('/dashboard')
  const pageInfo = isDashboard
    ? { title: 'Analysis Dashboard', subtitle: 'Detailed breakdown of your schema analysis' }
    : PAGE_TITLES[location.pathname] || { title: 'SchemaMorph AI', subtitle: '' }

  const initial = user?.email?.charAt(0)?.toUpperCase() || 'U'

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(9,12,20,0.85)',
      backdropFilter: 'blur(18px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      padding: '0 28px',
      height: 60,
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      {/* Page title */}
      <div style={{ flex: 1 }}>
        <h1 style={{
          margin: 0, fontSize: 17, fontWeight: 700,
          color: '#fff', fontFamily: 'Space Grotesk, sans-serif',
          lineHeight: 1.2,
        }}>{pageInfo.title}</h1>
        {pageInfo.subtitle && (
          <p style={{
            margin: 0, fontSize: 11,
            color: 'rgba(255,255,255,0.35)',
            fontFamily: 'Inter, sans-serif',
          }}>{pageInfo.subtitle}</p>
        )}
      </div>

      {/* Right side: badges + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Status badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 12px',
          borderRadius: 20,
          background: 'rgba(29,158,117,0.1)',
          border: '1px solid rgba(29,158,117,0.2)',
          fontSize: 11, fontWeight: 500,
          color: '#1D9E75',
          fontFamily: 'Space Grotesk, sans-serif',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#1D9E75',
            boxShadow: '0 0 6px #1D9E75',
            animation: 'pulse-dot 2s ease-in-out infinite',
          }} />
          System Online
        </div>

        {/* Notification bell */}
        <button style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 8, width: 34, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>

        {/* User avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg, #1D9E75, #0d6e52)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 700, color: '#fff',
          fontFamily: 'Space Grotesk, sans-serif',
          cursor: 'pointer',
          boxShadow: '0 0 12px rgba(29,158,117,0.25)',
        }}>
          {initial}
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #1D9E75; }
          50% { opacity: 0.7; box-shadow: 0 0 12px #1D9E75; }
        }
      `}</style>
    </header>
  )
}
