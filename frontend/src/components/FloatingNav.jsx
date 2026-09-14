import { useState, useEffect } from 'react'
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

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const goHome = () => navigate(token ? '/upload' : '/')

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 8, background: 'rgba(29,158,117,0.12)' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(29,158,117,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#5DCAA5', fontFamily: 'Space Grotesk,sans-serif' }}>
                {user?.email?.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter,sans-serif', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </span>
            </div>
            <button
              onClick={handleLogout}
              style={{
                marginLeft: 4, background: 'transparent', color: 'rgba(255,255,255,0.5)',
                border: '0.5px solid rgba(255,255,255,0.15)', padding: '6px 14px', borderRadius: 8,
                fontSize: 13, fontWeight: 500, fontFamily: 'Space Grotesk,sans-serif', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
            >
              Log out
            </button>
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
    </nav>
  )
}
