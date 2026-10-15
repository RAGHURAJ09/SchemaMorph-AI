import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login } from '../api/client'
import useAuthStore from '../store/authStore'
import FloatingNav from '../components/FloatingNav'

// Eye icons for show/hide password
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
)

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)

  // If already logged in, redirect to upload
  useEffect(() => {
    if (token) {
      navigate('/upload', { replace: true })
    }
  }, [token, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error('Please enter both email and password.')
      return
    }
    setLoading(true)
    try {
      const data = await login(email, password)
      setToken(data.access_token)
      setUser({ email: email.trim().toLowerCase() })
      toast.success('Logged in successfully!')
      navigate('/upload')
    } catch (err) {
      if (!err.response) {
        toast.error('Cannot connect to backend server. Please verify the server is running on port 8000.')
      } else if (err.response.status === 401) {
        toast.error(err.response.data?.detail || 'Invalid email or password.')
      } else {
        toast.error(err.response?.data?.detail || 'Failed to login')
      }
    } finally {
      setLoading(false)
    }
  }


  return (
    <div style={{ minHeight:'100vh', background:'radial-gradient(ellipse 60% 40% at 50% 0%,rgba(29,158,117,0.1) 0%,transparent 60%),#090c12', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', paddingTop:'86px', fontFamily:'Inter,system-ui,sans-serif' }}>
      <FloatingNav />
      <div style={{ maxWidth:430, width:'100%', background:'rgba(255,255,255,0.03)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:18, padding:'38px 30px', boxSizing:'border-box' }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'#1D9E75', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff', fontFamily:'Space Grotesk,sans-serif', marginBottom:14 }}>S</div>
          <h1 style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:24, fontWeight:700, color:'#fff', margin:'0 0 6px' }}>Welcome Back</h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', margin:0 }}>Log in to your SchemaMorph AI account</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Email Address */}
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, fontFamily:'Space Grotesk,sans-serif' }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width:'100%', padding:'11px 14px', background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:10, fontSize:14, color:'#fff', outline:'none', transition:'border-color 0.2s', fontFamily:'Inter,sans-serif', boxSizing:'border-box' }}
              placeholder="you@example.com"
            />
          </div>
          
          {/* Password Box */}
          <div style={{ marginBottom:24 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
              <label style={{ fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', fontFamily:'Space Grotesk,sans-serif' }}>Password</label>
              <span style={{ fontSize:11, color:'#1D9E75', fontWeight:500 }}>Secure Hashing Enforced</span>
            </div>
            <div style={{ position:'relative', width:'100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width:'100%', padding:'11px 40px 11px 14px', background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:10, fontSize:14, color:'#fff', outline:'none', transition:'border-color 0.2s', fontFamily:'Inter,sans-serif', boxSizing:'border-box' }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:4 }}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* Helper notice */}
            <div
              style={{
                marginTop: 8,
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.025)',
                border: '0.5px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ color: '#1D9E75', fontSize: 13 }}>🔒</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4 }}>
                Enter the password created during sign up (case-sensitive).
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width:'100%', padding:'13px', background:'#1D9E75', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:600, fontFamily:'Space Grotesk,sans-serif', cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, transition:'all 0.2s', boxShadow: '0 4px 14px rgba(29,158,117,0.3)' }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>


        </form>

        <p style={{ marginTop:22, textAlign:'center', fontSize:13, color:'rgba(255,255,255,0.45)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'#1D9E75', textDecoration:'none', fontWeight:600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}
