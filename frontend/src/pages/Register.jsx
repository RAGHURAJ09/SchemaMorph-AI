import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { register } from '../api/client'
import FloatingNav from '../components/FloatingNav'
import Background3D from '../components/Background3D'
import Captcha from '../components/Captcha'

// Icons
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

const ShieldAlertIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
)

export default function Register() {
  const [firstName, setFirstName] = useState('')
  const [middleName, setMiddleName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showRequirementsModal, setShowRequirementsModal] = useState(false)
  const passwordInputRef = useRef(null)
  const captchaRef = useRef(null)

  const navigate = useNavigate()

  // Real-time password criteria evaluation
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const hasMinLength = password.length >= 8

  const conditions = [
    {
      id: 'upper',
      label: 'At least one Capital / Block Letter (A-Z)',
      met: hasUppercase,
    },
    {
      id: 'lower',
      label: 'At least one small letter (a-z)',
      met: hasLowercase,
    },
    {
      id: 'number',
      label: 'At least one number (0-9)',
      met: hasNumber,
    },
    {
      id: 'special',
      label: 'At least one special character (!@#$%^&*...)',
      met: hasSpecial,
    },
    {
      id: 'length',
      label: 'At least 8 characters in length',
      met: hasMinLength,
    },
  ]

  const passedCount = conditions.filter((c) => c.met).length
  const allConditionsMet = passedCount === conditions.length
  const passwordsMatch = password === confirmPassword

  const getStrength = () => {
    if (password.length === 0) return { label: 'Empty', color: 'rgba(255,255,255,0.25)', width: '0%' }
    if (passedCount <= 2) return { label: 'Weak', color: '#ef4444', width: '33%' }
    if (passedCount <= 4) return { label: 'Medium', color: '#eab308', width: '66%' }
    return { label: 'Strong', color: '#10b981', width: '100%' }
  }

  const strength = getStrength()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!passwordsMatch) {
      toast.error('Passwords do not match!')
      return
    }

    // If conditions not satisfied, show popup and block signup
    if (!allConditionsMet) {
      setShowRequirementsModal(true)
      toast.error('Password does not meet required conditions!', {
        duration: 4000,
      })
      return
    }

    // Verify Security CAPTCHA
    if (!captchaRef.current?.validate()) {
      toast.error('Please enter the correct CAPTCHA code.')
      return
    }

    setLoading(true)
    try {
      await register(firstName, middleName, lastName, email, password)
      toast.success('Account created! Please log in.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to register')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px', paddingTop:'86px', fontFamily:'Inter,system-ui,sans-serif', position:'relative' }}>
      <Background3D speedMultiplier={2} enableScroll={false} />
      <FloatingNav />
      <div style={{ maxWidth:440, width:'100%', background:'rgba(9, 13, 24, 0.75)', backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:18, padding:'36px 30px', boxShadow:'0 20px 50px rgba(0, 0, 0, 0.5), 0 0 35px rgba(29, 158, 117, 0.12)', position:'relative', zIndex:1 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:40, height:40, borderRadius:10, background:'#1D9E75', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff', fontFamily:'Space Grotesk,sans-serif', marginBottom:14 }}>S</div>
          <h1 style={{ fontFamily:'Space Grotesk,sans-serif', fontSize:24, fontWeight:700, color:'#fff', margin:'0 0 6px' }}>Create an Account</h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.45)', margin:0 }}>Sign up to get started with SchemaMorph AI</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          {/* Name Fields */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3, minmax(0, 1fr))', gap:10, marginBottom:18 }}>
            {[
              { label: 'First Name', value: firstName, setValue: setFirstName, placeholder: 'First', required: true },
              { label: 'Middle Name', value: middleName, setValue: setMiddleName, placeholder: 'Middle', required: false },
              { label: 'Last Name', value: lastName, setValue: setLastName, placeholder: 'Last', required: true },
            ].map((field) => (
              <div key={field.label}>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, fontFamily:'Space Grotesk,sans-serif' }}>{field.label}</label>
                <input
                  type="text"
                  required={field.required}
                  value={field.value}
                  onChange={(e) => field.setValue(e.target.value)}
                  style={{ width:'100%', padding:'11px 10px', background:'rgba(255,255,255,0.04)', border:'0.5px solid rgba(255,255,255,0.12)', borderRadius:10, fontSize:14, color:'#fff', outline:'none', transition:'border-color 0.2s', fontFamily:'Inter,sans-serif', boxSizing:'border-box' }}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>

          {/* Email Address */}
          <div style={{ marginBottom:18 }}>
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
          
          {/* Password Input with show/hide toggle */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, fontFamily:'Space Grotesk,sans-serif' }}>Password</label>
            <div style={{ position:'relative', width:'100%' }}>
              <input
                ref={passwordInputRef}
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width:'100%', padding:'11px 40px 11px 14px', background:'rgba(255,255,255,0.04)', border: password ? (allConditionsMet ? '0.5px solid rgba(16,185,129,0.5)' : '0.5px solid rgba(239,68,68,0.5)') : '0.5px solid rgba(255,255,255,0.12)', borderRadius:10, fontSize:14, color:'#fff', outline:'none', transition:'border-color 0.2s', fontFamily:'Inter,sans-serif', boxSizing:'border-box' }}
                placeholder="Enter a secure password"
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
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontSize:12, fontWeight:600, color:'rgba(255,255,255,0.7)', marginBottom:6, fontFamily:'Space Grotesk,sans-serif' }}>Confirm Password</label>
            <div style={{ position:'relative', width:'100%' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{ width:'100%', padding:'11px 40px 11px 14px', background:'rgba(255,255,255,0.04)', border: confirmPassword ? (passwordsMatch ? '0.5px solid rgba(16,185,129,0.5)' : '0.5px solid rgba(239,68,68,0.5)') : '0.5px solid rgba(255,255,255,0.12)', borderRadius:10, fontSize:14, color:'#fff', outline:'none', transition:'border-color 0.2s', fontFamily:'Inter,sans-serif', boxSizing:'border-box' }}
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
                style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:4 }}
              >
                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {confirmPassword.length > 0 && !passwordsMatch && (
              <span style={{ display:'block', marginTop:5, fontSize:11, color:'#fca5a5' }}>Passwords do not match.</span>
            )}
          </div>

          {/* Password Strength Meter */}
          {password.length > 0 && (
            <div style={{ marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)', fontFamily:'Space Grotesk,sans-serif' }}>
                  Strength: <strong style={{ color: strength.color }}>{strength.label}</strong>
                </span>
                <span style={{ fontSize:11, color:'rgba(255,255,255,0.4)' }}>
                  {passedCount} of {conditions.length} satisfied
                </span>
              </div>
              <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, overflow:'hidden' }}>
                <div
                  style={{
                    height:'100%',
                    width: strength.width,
                    background: strength.color,
                    transition:'all 0.3s ease',
                    borderRadius:2,
                  }}
                />
              </div>
            </div>
          )}

          {/* BELOW PASSWORD TYPE AND ABOVE SIGNUP BUTTON: Requirements checklist */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '0.5px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: '12px 14px',
              marginBottom: 22,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily:'Space Grotesk,sans-serif' }}>
                Password Requirements:
              </span>
              <span style={{ fontSize: 10, color: allConditionsMet ? '#34d399' : '#f87171', fontWeight: 600 }}>
                {allConditionsMet ? '✓ All met' : 'Follow all rules'}
              </span>
            </div>

            {conditions.map((cond) => {
              const isMet = cond.met
              return (
                <div
                  key={cond.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    fontSize: 12,
                    transition: 'all 0.2s ease',
                    padding: '3px 4px',
                    borderRadius: 6,
                    background: isMet ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                  }}
                >
                  {/* Correct symbol (green ✓) or wrong cross symbol with red (✕) */}
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      fontSize: 11,
                      fontWeight: 800,
                      background: isMet ? 'rgba(16, 185, 129, 0.18)' : 'rgba(239, 68, 68, 0.18)',
                      border: isMet ? '1px solid #10b981' : '1px solid #ef4444',
                      color: isMet ? '#10b981' : '#ef4444',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isMet ? '✓' : '✕'}
                  </span>
                  <span
                    style={{
                      color: isMet ? '#a7f3d0' : '#fca5a5',
                      fontWeight: isMet ? 500 : 400,
                      transition: 'color 0.2s ease',
                      flex: 1,
                    }}
                  >
                    {cond.label}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Security CAPTCHA */}
          <div style={{ marginTop: 18, marginBottom: 22 }}>
            <Captcha ref={captchaRef} />
          </div>

          {/* SIGNUP BUTTON */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width:'100%',
              padding:'13px',
              background: allConditionsMet ? '#1D9E75' : 'linear-gradient(135deg, #1D9E75 0%, #17805e 100%)',
              color:'#fff',
              border:'none',
              borderRadius:10,
              fontSize:14,
              fontWeight:600,
              fontFamily:'Space Grotesk,sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition:'all 0.2s',
              boxShadow: allConditionsMet ? '0 4px 16px rgba(29, 158, 117, 0.4)' : 'none',
            }}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={{ marginTop:22, textAlign:'center', fontSize:13, color:'rgba(255,255,255,0.45)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color:'#1D9E75', textDecoration:'none', fontWeight:600 }}>Log in</Link>
        </p>
      </div>

      {/* POPUP MODAL SHOWN ON CLICKING SIGNUP IF CONDITIONS NOT SATISFIED */}
      {showRequirementsModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(5, 7, 12, 0.82)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 9999,
          }}
          onClick={() => setShowRequirementsModal(false)}
        >
          <div
            style={{
              maxWidth: 440,
              width: '100%',
              background: '#0d111a',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(239, 68, 68, 0.2)',
              borderRadius: 18,
              padding: '28px 24px',
              position: 'relative',
              color: '#fff',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close cross button */}
            <button
              onClick={() => setShowRequirementsModal(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                background: 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                width: 30,
                height: 30,
                borderRadius: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
              }}
            >
              ✕
            </button>

            {/* Header with shield icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 12,
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <ShieldAlertIcon />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk,sans-serif', color: '#fff' }}>
                  Password Conditions Required
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  Your password must satisfy these conditions to sign up:
                </p>
              </div>
            </div>

            {/* Conditions breakdown */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '12px',
                marginBottom: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {conditions.map((cond) => {
                const isMet = cond.met
                return (
                  <div
                    key={cond.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: 8,
                      background: isMet ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      border: isMet ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isMet ? '#10b981' : '#ef4444',
                          color: '#fff',
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {isMet ? '✓' : '✕'}
                      </span>
                      <span style={{ fontSize: 13, color: isMet ? '#a7f3d0' : '#fca5a5', fontWeight: 500 }}>
                        {cond.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: isMet ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: isMet ? '#34d399' : '#f87171',
                      }}
                    >
                      {isMet ? 'Satisfied' : 'Missing'}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Action button */}
            <button
              type="button"
              onClick={() => {
                setShowRequirementsModal(false)
                setTimeout(() => passwordInputRef.current?.focus(), 100)
              }}
              style={{
                width: '100%',
                padding: '13px',
                background: 'linear-gradient(135deg, #1D9E75 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'Space Grotesk,sans-serif',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(29, 158, 117, 0.35)',
              }}
            >
              Fix Password Now
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
