import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAnalysisStore from '../store/useAnalysisStore'
import api from '../api/client'
import toast from 'react-hot-toast'

/* ── Tiny stat card ──────────────────────────────────────────────────────── */
function StatCard({ label, value, icon, color = '#1D9E75' }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: 14, padding: '18px 22px',
      display: 'flex', alignItems: 'center', gap: 16,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = `${color}33`}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color, flexShrink: 0,
        fontSize: 20,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
          {label}
        </div>
      </div>
    </div>
  )
}

/* ── Status badge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const colors = {
    COMPLETED: { bg: 'rgba(29,158,117,0.12)', border: 'rgba(29,158,117,0.3)', text: '#1D9E75' },
    FAILED: { bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', text: '#f87171' },
    PENDING: { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.3)', text: '#fbbf24' },
  }
  const c = colors[status] || colors.PENDING
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '3px 9px',
      borderRadius: 20, border: `1px solid ${c.border}`,
      background: c.bg, color: c.text,
      fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.04em',
    }}>
      {status}
    </span>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function History() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const setAnalysisData = useAnalysisStore((state) => state.setAnalysisData)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await api.get('/projects')
        setProjects(data)
      } catch (err) {
        // If endpoint doesn't exist yet, gracefully show empty
        console.warn('Projects endpoint not available yet:', err.message)
        setProjects([])
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const filtered = projects
    .filter(p =>
      !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.id?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.created_at) - new Date(a.created_at)
      return new Date(a.created_at) - new Date(b.created_at)
    })

  const totalTables = projects.reduce((s, p) => s + (p.table_count || 0), 0)
  const totalServices = projects.reduce((s, p) => s + (p.service_count || 0), 0)
  const completed = projects.filter(p => p.status === 'COMPLETED').length

  const handleView = async (project) => {
    try {
      const { data } = await api.get(`/session/${project.id}`)
      toast.success('Session loaded!')
      navigate(`/dashboard/${project.id}`)
    } catch {
      toast.error('Could not load this session. It may have expired.')
    }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16, marginBottom: 32,
      }}>
        <StatCard label="Total Analyses" value={projects.length} icon="🔬" color="#1D9E75" />
        <StatCard label="Tables Processed" value={totalTables} icon="🗄️" color="#6366f1" />
        <StatCard label="Services Discovered" value={totalServices} icon="🏗️" color="#f59e0b" />
        <StatCard label="Completed Runs" value={completed} icon="✅" color="#22d3ee" />
      </div>

      {/* Controls row */}
      <div style={{
        display: 'flex', gap: 12, alignItems: 'center',
        marginBottom: 20, flexWrap: 'wrap',
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.3)', pointerEvents: 'none',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search analyses..."
            style={{
              width: '100%', padding: '9px 12px 9px 36px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 10, color: '#fff',
              fontSize: 13, fontFamily: 'Inter, sans-serif',
              outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)'}
            onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
          />
        </div>

        {/* Sort */}
        <select
          value={sortOrder}
          onChange={e => setSortOrder(e.target.value)}
          style={{
            padding: '9px 14px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 10, color: '#fff',
            fontSize: 13, fontFamily: 'Inter, sans-serif',
            outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>

        {/* New analysis CTA */}
        <button
          onClick={() => navigate('/upload')}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 18px',
            background: 'linear-gradient(135deg, #1D9E75, #0d6e52)',
            border: 'none', borderRadius: 10,
            color: '#fff', fontSize: 13, fontWeight: 600,
            fontFamily: 'Space Grotesk, sans-serif',
            cursor: 'pointer', transition: 'opacity 0.2s',
            boxShadow: '0 4px 16px rgba(29,158,117,0.3)',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          New Analysis
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 16, overflow: 'hidden',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 100px',
          padding: '12px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          {['Analysis ID', 'Date', 'Tables', 'Services', 'Status', 'Action'].map(h => (
            <span key={h} style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.07em',
              color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
              fontFamily: 'Space Grotesk, sans-serif',
            }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{
              width: 36, height: 36, border: '3px solid rgba(29,158,117,0.2)',
              borderTop: '3px solid #1D9E75', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }} />
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
              Loading analyses...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔬</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: '#fff', fontFamily: 'Space Grotesk, sans-serif', marginBottom: 8 }}>
              {search ? 'No matching analyses' : 'No analyses yet'}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', marginBottom: 24 }}>
              {search ? 'Try a different search term.' : 'Upload a schema to run your first analysis.'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/upload')}
                style={{
                  padding: '10px 24px',
                  background: 'linear-gradient(135deg, #1D9E75, #0d6e52)',
                  border: 'none', borderRadius: 10,
                  color: '#fff', fontSize: 14, fontWeight: 600,
                  fontFamily: 'Space Grotesk, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Start Your First Analysis
              </button>
            )}
          </div>
        ) : (
          filtered.map((project, idx) => (
            <div
              key={project.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 100px 100px',
                padding: '14px 20px',
                borderBottom: idx < filtered.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                transition: 'background 0.15s',
                alignItems: 'center',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(29,158,117,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* ID */}
              <div>
                <div style={{
                  fontSize: 12, fontWeight: 500, color: '#1D9E75',
                  fontFamily: 'JetBrains Mono, monospace',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  maxWidth: 220,
                }}>
                  {project.id}
                </div>
                {project.name && (
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
                    {project.name}
                  </div>
                )}
              </div>

              {/* Date */}
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
                {project.created_at ? new Date(project.created_at).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric'
                }) : '—'}
              </div>

              {/* Tables */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
                {project.table_count ?? '—'}
              </div>

              {/* Services */}
              <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
                {project.service_count ?? '—'}
              </div>

              {/* Status */}
              <div>
                <StatusBadge status={project.status || 'COMPLETED'} />
              </div>

              {/* Action */}
              <div>
                <button
                  onClick={() => handleView(project)}
                  style={{
                    padding: '5px 13px', borderRadius: 8,
                    background: 'rgba(29,158,117,0.1)',
                    border: '1px solid rgba(29,158,117,0.25)',
                    color: '#1D9E75', fontSize: 12, fontWeight: 500,
                    fontFamily: 'Space Grotesk, sans-serif',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(29,158,117,0.2)'; e.currentTarget.style.borderColor = 'rgba(29,158,117,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(29,158,117,0.1)'; e.currentTarget.style.borderColor = 'rgba(29,158,117,0.25)' }}
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {filtered.length > 0 && (
        <p style={{
          marginTop: 12, fontSize: 12, color: 'rgba(255,255,255,0.25)',
          fontFamily: 'Inter, sans-serif', textAlign: 'right',
        }}>
          Showing {filtered.length} of {projects.length} analyses
        </p>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
