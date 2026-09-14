import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { login } from '../api/client'
import useAuthStore from '../store/authStore'
import FloatingNav from '../components/FloatingNav'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const setToken = useAuthStore((state) => state.setToken)
  const setUser = useAuthStore((state) => state.setUser)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(email, password)
      setToken(data.access_token)
      setUser({ email })
      toast.success('Logged in successfully!')
      navigate('/upload')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'radial-gradient(ellipse 60% 40% at 50% 0%,rgba(29,158,117,0.1) 0%,transparent 60%),#090c12', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', paddingTop:'86px', fontFamily:'Inter,system-ui,sans-serif' }}>
      <FloatingNav />
      <div style={{ maxWidth:420, width:'100%', background:'rgba(255,255,255,0.03)', border:'0.5px solid rgba(255,255,255,0.1)', borderRadius:18, padding:'40px 32px' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'#1D9E75', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff', fontFamily:'Space Grotesk,sans-serif', marginBottom:16 }}>S</div>
          <h1 style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:24, fontWeight:700, color:'#fff', margin:'0 0 8px' }}>Welcome Back</h1>
          <p style={{ fontSize:14, color:'rgba(255,255,255,0.4)', margin:0 }}>Log in to your SchemaMorph AI account</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:8, fontFamily:'Space Grotesk,sans-serif' }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:10, fontSize:14, color:'#fff', outline:'none', transition:'border-color 0.2s', fontFamily:'Inter,sans-serif' }}
              placeholder="you@example.com"
            />
          </div>
          
          <div style={{ marginBottom:28 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.6)', marginBottom:8, fontFamily:'Space Grotesk,sans-serif' }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width:'100%', padding:'12px 14px', background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:10, fontSize:14, color:'#fff', outline:'none', transition:'border-color 0.2s', fontFamily:'Inter,sans-serif' }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ width:'100%', padding:'13px', background:'#1D9E75', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:600, fontFamily:'Space Grotesk,sans-serif', cursor:loading?'not-allowed':'pointer', opacity:loading?0.7:1, transition:'opacity 0.2s' }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p style={{ marginTop:24, textAlign:'center', fontSize:13, color:'rgba(255,255,255,0.38)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color:'#1D9E75', textDecoration:'none', fontWeight:600 }}>Sign up</Link>
        </p>
      </div>
    </div>
  )
}
