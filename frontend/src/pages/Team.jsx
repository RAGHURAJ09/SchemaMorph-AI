import { useState } from 'react'
import toast from 'react-hot-toast'
import Tilt from "react-parallax-tilt"
import { motion } from "framer-motion"

/* ── Team data ────────────────────────────────────────────────────────────── */
const TEAM_MEMBERS = [
  {
    id: 1, name: 'Raghuraj', email: 'raghuraj@schemamorph.ai',
    role: 'Admin', initials: 'R',
    joined: '2024-01-10', analyses: 42,
    color: '#1D9E75', status: 'online',
    skills: ['Schema Design', 'Microservices', 'PostgreSQL'],
  },
  {
    id: 2, name: 'Samridhi Jaiswal', email: 'samridhi.j@schemamorph.ai',
    role: 'Analyst', initials: 'SJ',
    joined: '2024-03-15', analyses: 28,
    color: '#6366f1', status: 'online',
    skills: ['Data Modeling', 'Machine Learning', 'Analytics'],
  },
  {
    id: 3, name: 'Samridhi Singh', email: 'samridhi.s@schemamorph.ai',
    role: 'Analyst', initials: 'SS',
    joined: '2024-05-20', analyses: 15,
    color: '#f59e0b', status: 'away',
    skills: ['Frontend', 'React', 'UI/UX'],
  }
]

const ROLE_COLORS = {
  Admin: { bg: 'rgba(29,158,117,0.12)', border: 'rgba(29,158,117,0.3)', text: '#1D9E75' },
  Analyst: { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', text: '#818cf8' },
  Viewer: { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)', text: 'rgba(255,255,255,0.5)' },
}

const STATUS_COLORS = { online: '#1D9E75', away: '#f59e0b', offline: 'rgba(255,255,255,0.2)' }

/* ── Activity feed ───────────────────────────────────────────────────────── */
const ACTIVITY = [
  { user: 'Raghuraj', action: 'ran a schema analysis', time: '2 hours ago', icon: '🔬' },
  { user: 'Priya Sharma', action: 'viewed Dashboard results', time: '5 hours ago', icon: '📊' },
  { user: 'Arjun Verma', action: 'exported analysis report', time: '1 day ago', icon: '📥' },
  { user: 'Sneha Patel', action: 'joined the team', time: '2 months ago', icon: '👋' },
]

/* ── Member Card ─────────────────────────────────────────────────────────── */
function MemberCard({ member, onRemove }) {
  const rc = ROLE_COLORS[member.role] || ROLE_COLORS.Viewer
  
  const imgMap = {
    'Raghuraj': '/raghu.jpeg',
    'Samridhi Jaiswal': '/samridhi.jpeg',
    'Samridhi Singh': '/samridhi_singh.jpeg'
  }
  const imgSrc = imgMap[member.name] || '/raghu.jpeg'

  return (
    <Tilt tiltMaxAngleX={15} tiltMaxAngleY={15} scale={1.05} transitionSpeed={2500} className="tilt-wrapper" style={{ height: '100%' }}>
      <motion.div
        className="team-card"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        style={{ width: '100%', minHeight: '100%', cursor: 'default', padding: '30px 20px' }}
      >
        {/* Avatar with status dot */}
        <div style={{ position: 'relative' }}>
          <img src={imgSrc} className="team-img" alt={member.name} style={{ width: 110, height: 110, marginBottom: 20 }} onError={(e) => { e.target.style.display = 'none'; }} />
          <span style={{
            position: 'absolute', bottom: 30, right: 5,
            width: 14, height: 14, borderRadius: '50%',
            background: STATUS_COLORS[member.status],
            border: '2px solid #090C12',
          }} />
        </div>

        <h3 style={{ fontSize: 20, marginBottom: 5 }}>{member.name}</h3>
        <p className="role" style={{ color: rc.text, fontSize: 12, marginBottom: 5 }}>{member.role}</p>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', marginBottom: 20 }}>
          {member.email}
        </div>

      {/* Stats row */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 16,
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 10, overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {[
          { label: 'Analyses', val: member.analyses },
          { label: 'Status', val: member.status.charAt(0).toUpperCase() + member.status.slice(1) },
          { label: 'Joined', val: new Date(member.joined).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) },
        ].map((stat, i) => (
          <div key={stat.label} style={{
            flex: 1, padding: '10px 14px', textAlign: 'center',
            borderRight: i < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
              {stat.val}
            </div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2, fontFamily: 'Inter, sans-serif' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
        {member.skills.map(skill => (
          <span key={skill} style={{
            fontSize: 10, padding: '3px 9px',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'Inter, sans-serif',
          }}>{skill}</span>
        ))}
      </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 'auto' }}>
          <button
            onClick={() => toast.success(`Message sent to ${member.name}!`)}
            style={{
              flex: 1, padding: '7px',
              background: `${member.color}12`,
              border: `1px solid ${member.color}25`,
              borderRadius: 8, color: member.color,
              fontSize: 11, fontWeight: 500,
              fontFamily: 'Space Grotesk, sans-serif',
              cursor: 'pointer',
            }}
          >Message</button>
          {member.role !== 'Admin' && (
            <button
              onClick={() => onRemove(member.id)}
              style={{
                flex: 1, padding: '7px',
                background: 'rgba(248,113,113,0.08)',
                border: '1px solid rgba(248,113,113,0.2)',
                borderRadius: 8, color: '#f87171',
                fontSize: 11, fontWeight: 500,
                fontFamily: 'Space Grotesk, sans-serif',
                cursor: 'pointer',
              }}
            >Remove</button>
          )}
        </div>
      </motion.div>
    </Tilt>
  )
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function Team() {
  const [members, setMembers] = useState(TEAM_MEMBERS)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('Analyst')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [search, setSearch] = useState('')

  const filtered = members.filter(m =>
    !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail) return
    setInviteLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setInviteLoading(false)
    setInviteEmail('')
    toast.success(`Invite sent to ${inviteEmail}!`)
  }

  const handleRemove = (id) => {
    setMembers(m => m.filter(x => x.id !== id))
    toast.success('Member removed.')
  }

  const onlineCount = members.filter(m => m.status === 'online').length

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>

      {/* Header stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 14, marginBottom: 28,
      }}>
        {[
          { label: 'Total Members', val: members.length, icon: '👥', color: '#1D9E75' },
          { label: 'Online Now', val: onlineCount, icon: '🟢', color: '#22d3ee' },
          { label: 'Admins', val: members.filter(m => m.role === 'Admin').length, icon: '🔑', color: '#f59e0b' },
          { label: 'Analysts', val: members.filter(m => m.role === 'Analyst').length, icon: '🔬', color: '#6366f1' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${s.color}18`, border: `1px solid ${s.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3, fontFamily: 'Inter, sans-serif' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Left: member grid */}
        <div>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <span style={{
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search team members..."
              style={{
                width: '100%', padding: '9px 12px 9px 36px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 10, color: '#fff',
                fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={e => e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
            />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {filtered.map(m => (
              <MemberCard key={m.id} member={m} onRemove={handleRemove} />
            ))}
          </div>
        </div>

        {/* Right: Invite + Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Invite */}
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(29,158,117,0.18)',
            borderRadius: 16, padding: 24,
          }}>
            <h3 style={{
              margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#fff',
              fontFamily: 'Space Grotesk, sans-serif',
            }}>Invite Member</h3>
            <p style={{ margin: '0 0 18px', fontSize: 12, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif' }}>
              Send an invite link to collaborate
            </p>
            <form onSubmit={handleInvite}>
              <input
                type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 10, color: '#fff',
                  fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none',
                  marginBottom: 10, boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
              />
              <select
                value={inviteRole} onChange={e => setInviteRole(e.target.value)}
                style={{
                  width: '100%', padding: '10px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  borderRadius: 10, color: '#fff',
                  fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none',
                  marginBottom: 14, boxSizing: 'border-box', cursor: 'pointer',
                }}
              >
                <option value="Analyst">Analyst</option>
                <option value="Viewer">Viewer</option>
                <option value="Admin">Admin</option>
              </select>
              <button
                type="submit"
                disabled={inviteLoading || !inviteEmail}
                style={{
                  width: '100%', padding: '10px',
                  background: inviteLoading || !inviteEmail
                    ? 'rgba(29,158,117,0.3)'
                    : 'linear-gradient(135deg, #1D9E75, #0d6e52)',
                  border: 'none', borderRadius: 10, color: '#fff',
                  fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif',
                  cursor: inviteLoading || !inviteEmail ? 'not-allowed' : 'pointer',
                  boxShadow: inviteEmail ? '0 4px 14px rgba(29,158,117,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                {inviteLoading ? 'Sending...' : 'Send Invite →'}
              </button>
            </form>
          </div>

          {/* Activity feed */}
          <div style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16, padding: 24,
          }}>
            <h3 style={{
              margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#fff',
              fontFamily: 'Space Grotesk, sans-serif',
            }}>Recent Activity</h3>
            {ACTIVITY.map((item, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                paddingBottom: i < ACTIVITY.length - 1 ? 14 : 0,
                marginBottom: i < ACTIVITY.length - 1 ? 14 : 0,
                borderBottom: i < ACTIVITY.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(29,158,117,0.1)',
                  border: '1px solid rgba(29,158,117,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16,
                }}>{item.icon}</div>
                <div>
                  <div style={{ fontSize: 12, color: '#fff', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                    <strong style={{ color: '#1D9E75', fontFamily: 'Space Grotesk, sans-serif' }}>{item.user}</strong>
                    {' '}{item.action}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3, fontFamily: 'Inter, sans-serif' }}>
                    {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
