import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const NAV_ITEMS = [
  {
    id: 'upload',
    label: 'New Analysis',
    to: '/upload',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    to: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'History',
    to: '/history',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
]

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const fileInputRef = useRef(null)

  // Load profile image from localStorage if available
  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem('schemamorph-profile-image') || null
  })

  const initial = user?.email?.charAt(0)?.toUpperCase() || 'U'
  const emailPrefix = user?.email?.split('@')[0] || 'User'

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

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result
        setProfileImage(base64String)
        localStorage.setItem('schemamorph-profile-image', base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'rgba(9, 9, 11, 0.7)',
        backdropFilter: 'blur(32px) saturate(150%)',
        WebkitBackdropFilter: 'blur(32px) saturate(150%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 9999,
        padding: '6px 6px 6px 16px',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Logo Section */}
        <div 
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            cursor: 'pointer',
            paddingRight: 16,
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
          onClick={() => navigate('/upload')}
          className="brand-logo"
        >
           <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #047857)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: '#fff',
              fontFamily: 'Space Grotesk, sans-serif',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
            }}>S</div>
           <span style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontWeight: 700, fontSize: 14, color: '#fff',
              letterSpacing: '-0.02em'
           }}>
              Schema<span style={{ color: '#10b981' }}>Morph</span>
           </span>
        </div>

        {/* Navigation Items */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px' }}>
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
                  className={`premium-nav-item ${active ? 'active' : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px',
                    borderRadius: 9999,
                    border: '1px solid transparent',
                    background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    fontSize: 13, fontWeight: active ? 600 : 500,
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <span style={{ zIndex: 1, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
                    <span style={{ color: active ? '#10b981' : 'inherit', transition: 'color 0.3s' }}>
                      {item.icon}
                    </span>
                    {item.label}
                  </span>
                  {active && (
                    <span style={{
                      position: 'absolute', inset: 0,
                      background: 'radial-gradient(circle at top, rgba(255,255,255,0.08) 0%, transparent 100%)',
                      borderRadius: 9999, zIndex: 0, pointerEvents: 'none'
                    }} />
                  )}
                </button>
             )
          })}
        </nav>

        {/* Profile / Settings Dropdown Trigger */}
        <div style={{ position: 'relative' }} ref={profileRef}>
           <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: profileOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.03)',
              border: profileOpen ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              padding: 2
            }}
            onClick={() => setProfileOpen(!profileOpen)}
            className="profile-trigger"
            >
              <div style={{
                width: '100%', height: '100%', borderRadius: '50%',
                background: profileImage ? 'transparent' : 'linear-gradient(135deg, #10b981, #047857)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff',
                fontFamily: 'Space Grotesk, sans-serif',
                overflow: 'hidden'
              }}>
                {profileImage ? (
                  <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : initial}
              </div>
           </div>

           {/* Dropdown Menu */}
           {profileOpen && (
             <div style={{
                position: 'absolute',
                top: 'calc(100% + 12px)',
                right: 0,
                width: 260,
                background: 'rgba(9, 9, 11, 0.85)',
                backdropFilter: 'blur(32px) saturate(150%)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: 6,
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
                animation: 'dropdownFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                transformOrigin: 'top right'
             }}>
                {/* User Info Header with Image Upload */}
                <div style={{
                  padding: '12px 10px',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}>
                  <div 
                    className="dropdown-avatar"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: profileImage ? 'transparent' : 'linear-gradient(135deg, #10b981, #047857)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, fontWeight: 700, color: '#fff',
                      fontFamily: 'Space Grotesk, sans-serif',
                      cursor: 'pointer',
                      flexShrink: 0,
                      overflow: 'hidden',
                      position: 'relative'
                    }}
                    title="Change Profile Photo"
                  >
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : initial}
                    
                    {/* Hover overlay for upload indication */}
                    <div className="avatar-upload-overlay" style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(0,0,0,0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: 0, transition: 'opacity 0.2s'
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Hidden File Input */}
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }}
                    onChange={handleImageUpload}
                  />

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>{emailPrefix}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                  </div>
                </div>

                {/* Profile Item */}
                <button
                  onClick={() => { setProfileOpen(false); navigate('/profile') }}
                  className="dropdown-item"
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: 'none', background: 'transparent',
                    color: 'rgba(255,255,255,0.8)',
                    cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.2s', textAlign: 'left',
                    marginBottom: 2
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile
                </button>

                {/* Settings Item */}
                <button
                  onClick={() => { setProfileOpen(false); navigate('/profile') }}
                  className="dropdown-item"
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: 'none', background: 'transparent',
                    color: 'rgba(255,255,255,0.8)',
                    cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.2s', textAlign: 'left'
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  Settings
                </button>

                {/* Logout Item */}
                <button
                  onClick={handleLogout}
                  className="dropdown-item logout"
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: 'none', background: 'transparent',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.2s', textAlign: 'left',
                    marginTop: 4
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log out
                </button>
             </div>
           )}
        </div>
      </div>

      <style>{`
        @keyframes dropdownFadeIn {
          0% { opacity: 0; transform: scale(0.95) translateY(-10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        .brand-logo:hover span {
          color: #e5e7eb !important;
        }

        .premium-nav-item {
          position: relative;
        }
        
        .premium-nav-item::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: radial-gradient(circle 45px at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.1), transparent 100%);
          opacity: 0;
          transition: opacity 0.3s;
          z-index: 0;
          pointer-events: none;
        }
        
        .premium-nav-item:hover::before {
          opacity: 1;
        }

        .premium-nav-item:hover {
          color: #fff !important;
        }

        .premium-nav-item.active {
          box-shadow: 0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1) !important;
        }

        .profile-trigger:hover {
          background: rgba(255,255,255,0.06) !important;
          transform: scale(1.05);
        }
        
        .dropdown-avatar:hover .avatar-upload-overlay {
          opacity: 1 !important;
        }

        .dropdown-item:hover {
          background: rgba(255,255,255,0.06) !important;
          color: #fff !important;
        }

        .dropdown-item.logout:hover {
          background: rgba(239, 68, 68, 0.1) !important;
          color: #ef4444 !important;
        }
      `}</style>
    </>
  )
}
