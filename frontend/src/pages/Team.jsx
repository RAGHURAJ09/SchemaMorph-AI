import { useState } from 'react'
import toast from 'react-hot-toast'
import Tilt from "react-parallax-tilt"
import { motion } from "framer-motion"

/* ── Team data ────────────────────────────────────────────────────────────── */
export const TEAM_MEMBERS = [
  {
    id: 1, name: 'Raghuraj', email: 'raghurajrajpoot2819@gmail.com',
    role: 'Admin', initials: 'R',
    joined: '2024-01-10', analyses: 42,
    color: '#1D9E75', status: 'online',
    skills: ['Schema Design', 'Microservices', 'PostgreSQL'],
  },
  {
    id: 2, name: 'Samridhi Jaiswal', email: 'samridhijaiswal09@gmail.com',
    role: 'Analyst', initials: 'SJ',
    joined: '2024-03-15', analyses: 28,
    color: '#6366f1', status: 'online',
    skills: ['Data Modeling', 'Machine Learning', 'Analytics'],
  },
  {
    id: 3, name: 'Samridhi Singh', email: 'samridhisingh2940@gmail.com',
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


export function MemberCard({ member }) {
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
        style={{ '--secondary': rc.text, width: '100%', minHeight: '100%', cursor: 'default', padding: '30px 20px' }}
      >
        {/* Avatar */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <img src={imgSrc} className="team-img" alt={member.name} onError={(e) => { e.target.style.display = 'none'; }} />
        </div>

        <h3 style={{ fontSize: 20, marginBottom: 5, textAlign: 'center', fontFamily: 'Space Grotesk, sans-serif' }}>{member.name}</h3>
        <p className="role" style={{ color: rc.text, fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 12, textAlign: 'center', textTransform: 'uppercase' }}>
          {member.role}
        </p>

        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif', textAlign: 'center', marginBottom: 20 }}>
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
        </div>
      </motion.div>
    </Tilt>
  )
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function Team() {
  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'stretch' }}>
        {/* Top: member grid */}
        <div>
          <div className="team-container" style={{ padding: '10px 0' }}>
            {TEAM_MEMBERS.map(m => (
              <MemberCard key={m.id} member={m} />
            ))}
          </div>
        </div>


      </div>
    </div>
  )
}
