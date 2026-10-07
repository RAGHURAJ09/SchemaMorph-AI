import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const APP_LINKS = [
  { label: 'New Analysis', to: '/upload' },
  { label: 'Dashboard', to: '/dashboard' },
]

export default function FloatingNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [scrolled, setScrolled] = useState(false)

  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef(null)
  const fileInputRef = useRef(null)
  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem('schemamorph-profile-image') || null
  })

  const initial = user?.email?.charAt(0)?.toUpperCase() || 'U'
  const emailPrefix = user?.email?.split('@')[0] || 'User'

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  const goHome = () => navigate('/')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: scrolled || token ? 'rgba(9,12,18,0.92)' : 'transparent',
      backdropFilter: 'blur(14px)',
      borderBottom: '0.5px solid rgba(255,255,255,0.07)',
      padding: '0 28px',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', height: 62, gap: 8 }}>
        <div onClick={goHome} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: '#1D9E75', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk,sans-serif' }}>S</div>
          <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontWeight: 700, fontSize: 17, color: '#fff' }}>Schema<span style={{ color: '#1D9E75' }}>Morph</span> AI</span>
        </div>
        <div style={{ flex: 1 }} />

        {token ? (
          <>
            {APP_LINKS.map((link) => (
              <button
                key={link.label}
                onClick={() => navigate(link.to)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: location.pathname === link.to || (link.to === '/dashboard' && location.pathname.startsWith('/dashboard'))
                    ? '#1D9E75' : 'rgba(255,255,255,0.58)',
                  fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 6,
                  fontFamily: 'Space Grotesk,sans-serif',
                  transition: 'color 0.2s',
                }}
              >
                {link.label}
              </button>
            ))}
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 6px' }} />
            {/* Profile / Settings Dropdown Trigger */}
            <div style={{ position: 'relative', marginLeft: 4 }} ref={profileRef}>
              <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: profileOpen ? 'rgba(29, 158, 117, 0.15)' : 'rgba(255,255,255,0.03)',
                  border: profileOpen ? '1px solid rgba(29, 158, 117, 0.3)' : '1px solid rgba(255,255,255,0.08)',
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
                    background: profileImage ? 'transparent' : 'linear-gradient(135deg, #1D9E75, #0d6e52)',
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
                    background: 'rgba(9, 12, 18, 0.95)',
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
                          background: profileImage ? 'transparent' : 'linear-gradient(135deg, #1D9E75, #0d6e52)',
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
          </>
        ) : (
          <>
            {["Home", "How it works", "Features", "Team"].map((n) => (
              <button
                key={n}
                onClick={() => {
                  if (n === "Home") navigate('/')
                  else {
                    navigate('/')
                    setTimeout(() => document.getElementById(n === "How it works" ? "how" : "features")?.scrollIntoView({ behavior: "smooth" }), 60)
                  }
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.58)', fontSize: 13, fontWeight: 500, padding: '6px 12px', borderRadius: 6, fontFamily: 'Space Grotesk,sans-serif' }}
              >
                {n}
              </button>
            ))}
            <button onClick={() => navigate('/login')} style={{ marginLeft: 10, background: 'transparent', color: 'rgba(255,255,255,0.8)', border: '0.5px solid rgba(255,255,255,0.2)', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, fontFamily: 'Space Grotesk,sans-serif', cursor: 'pointer' }}>Log in</button>
            <button onClick={() => navigate('/register')} style={{ marginLeft: 6, background: '#1D9E75', color: '#fff', padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk,sans-serif', cursor: 'pointer' }}>Sign up →</button>
          </>
        )}
      </div>

      <style>{`
        @keyframes dropdownFadeIn {
          0% { opacity: 0; transform: scale(0.95) translateY(-10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
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
    </nav>
  )
}
