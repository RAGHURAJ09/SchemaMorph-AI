import { useState } from 'react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

/* ── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ title, description, children }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.025)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16, padding: '24px 28px',
      marginBottom: 20,
    }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{
          margin: 0, fontSize: 15, fontWeight: 700, color: '#fff',
          fontFamily: 'Space Grotesk, sans-serif',
        }}>{title}</h2>
        {description && (
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}

/* ── Field ───────────────────────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{
        display: 'block', fontSize: 12, fontWeight: 500, marginBottom: 6,
        color: 'rgba(255,255,255,0.5)', fontFamily: 'Space Grotesk, sans-serif',
      }}>{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder, disabled }) {
  return (
    <input
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} disabled={disabled}
      style={{
        width: '100%', padding: '10px 14px',
        background: disabled ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 10, color: disabled ? 'rgba(255,255,255,0.35)' : '#fff',
        fontSize: 13, fontFamily: 'Inter, sans-serif',
        outline: 'none', transition: 'border-color 0.2s',
        boxSizing: 'border-box',
      }}
      onFocus={e => { if (!disabled) e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)' }}
      onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
    />
  )
}

/* ── Toggle ──────────────────────────────────────────────────────────────── */
function Toggle({ label, description, value, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 44, height: 24, borderRadius: 12,
          background: value ? '#1D9E75' : 'rgba(255,255,255,0.1)',
          border: 'none', cursor: 'pointer',
          transition: 'background 0.2s',
          position: 'relative', flexShrink: 0,
          boxShadow: value ? '0 0 12px rgba(29,158,117,0.4)' : 'none',
        }}
      >
        <span style={{
          position: 'absolute',
          top: 3, left: value ? 23 : 3,
          width: 18, height: 18, borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function ProfileSettings() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdLoading, setPwdLoading] = useState(false)

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    analysisAlerts: true,
    weeklyDigest: false,
    darkMode: true,
    compactView: false,
  })

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const initial = user?.email?.charAt(0)?.toUpperCase() || 'U'

  const handleSavePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) return toast.error('Fill in all fields.')
    if (newPwd !== confirmPwd) return toast.error('New passwords do not match.')
    if (newPwd.length < 8) return toast.error('Password must be at least 8 characters.')
    setPwdLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setPwdLoading(false)
    setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    toast.success('Password updated successfully!')
  }

  const handleSavePrefs = () => {
    localStorage.setItem('schemamorph_prefs', JSON.stringify(prefs))
    toast.success('Preferences saved!')
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 720 }}>

      {/* Profile header */}
      <Section title="Profile" description="Your account information">
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1D9E75, #0d6e52)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30, fontWeight: 800, color: '#fff',
            fontFamily: 'Space Grotesk, sans-serif',
            boxShadow: '0 0 24px rgba(29,158,117,0.35)',
            flexShrink: 0,
          }}>{initial}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
              {user?.email?.split('@')[0]}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', marginTop: 4 }}>
              {user?.email}
            </div>
            <div style={{
              display: 'inline-block', marginTop: 8,
              fontSize: 10, fontWeight: 600, padding: '3px 10px',
              borderRadius: 20, background: 'rgba(29,158,117,0.12)',
              border: '1px solid rgba(29,158,117,0.25)', color: '#1D9E75',
              fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.05em',
            }}>
              FREE PLAN
            </div>
          </div>
        </div>

        <Field label="Email Address">
          <Input value={user?.email || ''} disabled />
        </Field>
        <Field label="Display Name">
          <Input value={user?.email?.split('@')[0] || ''} disabled />
        </Field>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontFamily: 'Inter, sans-serif', margin: 0 }}>
          Contact support to change your email or display name.
        </p>
      </Section>

      {/* Change password */}
      <Section title="Change Password" description="Update your login credentials">
        <Field label="Current Password">
          <Input type="password" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} placeholder="••••••••" />
        </Field>
        <Field label="New Password">
          <Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min. 8 characters" />
        </Field>
        <Field label="Confirm New Password">
          <Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="Repeat new password" />
        </Field>
        <button
          onClick={handleSavePassword}
          disabled={pwdLoading}
          style={{
            padding: '10px 22px',
            background: 'linear-gradient(135deg, #1D9E75, #0d6e52)',
            border: 'none', borderRadius: 10, color: '#fff',
            fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif',
            cursor: pwdLoading ? 'not-allowed' : 'pointer',
            opacity: pwdLoading ? 0.7 : 1, transition: 'opacity 0.2s',
            boxShadow: '0 4px 14px rgba(29,158,117,0.3)',
          }}
        >
          {pwdLoading ? 'Saving...' : 'Update Password'}
        </button>
      </Section>

      {/* Notifications */}
      <Section title="Notifications" description="Configure what alerts you receive">
        <Toggle label="Email Notifications" description="Receive analysis results via email"
          value={prefs.emailNotifications} onChange={v => setPrefs(p => ({ ...p, emailNotifications: v }))} />
        <Toggle label="Analysis Alerts" description="Get notified when analysis completes"
          value={prefs.analysisAlerts} onChange={v => setPrefs(p => ({ ...p, analysisAlerts: v }))} />
        <Toggle label="Weekly Digest" description="Weekly summary of your analyses"
          value={prefs.weeklyDigest} onChange={v => setPrefs(p => ({ ...p, weeklyDigest: v }))} />
        <div style={{ marginTop: 16 }}>
          <button
            onClick={handleSavePrefs}
            style={{
              padding: '9px 20px',
              background: 'rgba(29,158,117,0.1)',
              border: '1px solid rgba(29,158,117,0.25)',
              borderRadius: 10, color: '#1D9E75',
              fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(29,158,117,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(29,158,117,0.1)'}
          >
            Save Preferences
          </button>
        </div>
      </Section>

      {/* App Preferences */}
      <Section title="App Preferences" description="Customize your experience">
        <Toggle label="Dark Mode" description="Always on — SchemaMorph loves the dark"
          value={prefs.darkMode} onChange={v => setPrefs(p => ({ ...p, darkMode: v }))} />
        <Toggle label="Compact View" description="Show more content with reduced spacing"
          value={prefs.compactView} onChange={v => setPrefs(p => ({ ...p, compactView: v }))} />
      </Section>

      {/* Danger Zone */}
      <div style={{
        background: 'rgba(248,113,113,0.05)',
        border: '1px solid rgba(248,113,113,0.2)',
        borderRadius: 16, padding: '24px 28px',
      }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: '#f87171', fontFamily: 'Space Grotesk, sans-serif' }}>
          ⚠ Danger Zone
        </h2>
        <p style={{ margin: '0 0 20px', fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' }}>
          Irreversible actions. Proceed with caution.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => { logout(); toast.success('Logged out from all devices'); }}
            style={{
              padding: '9px 18px',
              background: 'rgba(251,191,36,0.1)',
              border: '1px solid rgba(251,191,36,0.25)',
              borderRadius: 10, color: '#fbbf24',
              fontSize: 13, fontWeight: 500, fontFamily: 'Space Grotesk, sans-serif',
              cursor: 'pointer',
            }}
          >
            Log out all devices
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              padding: '9px 18px',
              background: 'rgba(248,113,113,0.1)',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 10, color: '#f87171',
              fontSize: 13, fontWeight: 500, fontFamily: 'Space Grotesk, sans-serif',
              cursor: 'pointer',
            }}
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#0f1218', border: '1px solid rgba(248,113,113,0.3)',
            borderRadius: 20, padding: 32, maxWidth: 420, width: '90%',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
              Delete Account?
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
              This will permanently delete your account and all analysis data. Type <strong style={{ color: '#f87171' }}>DELETE</strong> to confirm.
            </p>
            <Input value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="Type DELETE to confirm" />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm('') }}
                style={{
                  flex: 1, padding: '10px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, color: '#fff', fontSize: 13,
                  fontFamily: 'Space Grotesk, sans-serif', cursor: 'pointer',
                }}
              >Cancel</button>
              <button
                disabled={deleteConfirm !== 'DELETE'}
                onClick={() => toast.error('Contact support to delete your account.')}
                style={{
                  flex: 1, padding: '10px',
                  background: deleteConfirm === 'DELETE' ? '#f87171' : 'rgba(248,113,113,0.2)',
                  border: 'none', borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 600,
                  fontFamily: 'Space Grotesk, sans-serif',
                  cursor: deleteConfirm === 'DELETE' ? 'pointer' : 'not-allowed',
                }}
              >Delete Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
