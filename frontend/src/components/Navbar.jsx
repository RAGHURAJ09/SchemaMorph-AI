import { useLocation, useNavigate } from 'react-router-dom'
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

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const initial = user?.email?.charAt(0)?.toUpperCase() || 'U'

  const isActive = (item) => {
    if (item.id === 'dashboard') return location.pathname.startsWith('/dashboard')
    return location.pathname === item.to
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  }

  return (
    <div style={{
      position: 'fixed',
      top: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      background: 'rgba(15, 20, 30, 0.75)',
      backdropFilter: 'blur(24px)',
      border: '1px solid rgba(29, 158, 117, 0.3)',
      borderRadius: 9999,
      padding: '8px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(29,158,117,0.15), inset 0 0 20px rgba(255,255,255,0.02)',
      transition: 'all 0.3s ease',
    }}>
      {/* Logo */}
      <div 
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          cursor: 'pointer',
          paddingRight: 16,
          borderRight: '1px solid rgba(255,255,255,0.1)',
          transition: 'transform 0.2s'
        }}
        onClick={() => navigate('/upload')}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
         <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1D9E75, #0d6e52)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: '#fff',
            fontFamily: 'Space Grotesk, sans-serif',
            boxShadow: '0 0 16px rgba(29,158,117,0.5)',
          }}>S</div>
         <span style={{
            fontFamily: 'Space Grotesk, sans-serif',
            fontWeight: 700, fontSize: 15, color: '#fff',
            whiteSpace: 'nowrap'
         }}>
            Schema<span style={{ color: '#1D9E75' }}>Morph</span> AI
         </span>
      </div>

      {/* Nav items */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {NAV_ITEMS.map((item) => {
           const active = isActive(item)
           return (
              <button
                key={item.id}
                onMouseMove={handleMouseMove}
                onClick={() => {
                  if (item.id === 'dashboard') {
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
                      navigate('/upload')
                    }
                  } else {
                    navigate(item.to)
                  }
                }}
                className={`nav-item-glow ${active ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px',
                  borderRadius: 9999,
                  border: '1px solid transparent',
                  background: active ? 'rgba(29,158,117,0.2)' : 'transparent',
                  color: active ? '#1D9E75' : 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  fontSize: 14, fontWeight: active ? 600 : 500,
                  fontFamily: 'Space Grotesk, sans-serif',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <span style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'none' }}>
                  {item.icon}
                  {item.label}
                </span>
                {active && (
                  <span style={{
                    position: 'absolute', inset: 0,
                    boxShadow: 'inset 0 0 20px rgba(29,158,117,0.3)',
                    borderRadius: 9999, zIndex: 0, pointerEvents: 'none'
                  }} />
                )}
              </button>
           )
        })}
      </nav>

      {/* Divider */}
      <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

      {/* User / Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
         <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(29,158,117,0.8), rgba(13,110,82,0.8))',
            border: '1px solid rgba(29,158,117,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
            fontFamily: 'Space Grotesk, sans-serif',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          className="avatar-glow"
          >
            {initial}
         </div>
         <button
            onClick={handleLogout}
            title="Log out"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32,
              borderRadius: '50%', border: 'none',
              background: 'transparent',
              color: 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.15)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(248,113,113,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'transparent'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
      </div>

      <style>{`
        .nav-item-glow {
          position: relative;
        }
        
        .nav-item-glow::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: radial-gradient(circle 50px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(29, 158, 117, 0.5), transparent 100%);
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 0;
          pointer-events: none;
        }
        
        .nav-item-glow:hover::before {
          opacity: 1;
        }

        .nav-item-glow:hover {
          color: #fff !important;
          background: rgba(29, 158, 117, 0.1) !important;
          border-color: rgba(29, 158, 117, 0.4) !important;
          box-shadow: 0 0 15px rgba(29, 158, 117, 0.3), inset 0 0 10px rgba(29, 158, 117, 0.2) !important;
        }

        .nav-item-glow.active {
          border-color: rgba(29, 158, 117, 0.6) !important;
          box-shadow: 0 0 20px rgba(29, 158, 117, 0.4), inset 0 0 15px rgba(29, 158, 117, 0.2) !important;
        }

        .avatar-glow:hover {
          box-shadow: 0 0 20px rgba(29, 158, 117, 0.6);
          transform: scale(1.05);
        }
      `}</style>
    </div>
  )
}
