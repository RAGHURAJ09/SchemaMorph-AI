import { useState, useEffect, useRef } from 'react'
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

/* ── Custom Date Picker ─────────────────────────────────────────────────── */
const CustomDatePicker = ({ value, onChange, minDate, maxDate, highlightDate, placeholder, isOpen, setIsOpen, isStartDatePicker }) => {
  const containerRef = useRef(null)
  
  const parseDateLocal = (dStr) => {
    if (!dStr) return null
    const [y, m, d] = dStr.split('-')
    return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10))
  }
  
  const formatDateLocal = (d) => {
    if (!d) return ''
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dNum = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${dNum}`
  }

  const [viewDate, setViewDate] = useState(parseDateLocal(value) || new Date())

  useEffect(() => {
    if (isOpen) setViewDate(parseDateLocal(value) || new Date())
  }, [isOpen, value])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setIsOpen(false)
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, setIsOpen])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const handlePrevMonth = (e) => { e.stopPropagation(); setViewDate(new Date(year, month - 1, 1)) }
  const handleNextMonth = (e) => { e.stopPropagation(); setViewDate(new Date(year, month + 1, 1)) }

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

  const days = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} style={{ width: 30, height: 30 }} />)
  }
  
  const minD = minDate ? parseDateLocal(minDate) : null
  const maxD = maxDate ? parseDateLocal(maxDate) : null

  const todayStr = formatDateLocal(new Date())

  for (let d = 1; d <= daysInMonth; d++) {
    const currentDay = new Date(year, month, d)
    const currentDayStr = formatDateLocal(currentDay)
    
    const isSelected = value === currentDayStr
    const isHighlighted = highlightDate === currentDayStr
    const isToday = todayStr === currentDayStr
    
    let isDisabled = false
    if (minD && currentDay < minD) isDisabled = true
    if (maxD && currentDay > maxD) isDisabled = true
    
    const isSoftDisabled = isStartDatePicker && highlightDate && currentDay > parseDateLocal(highlightDate)
    
    let bg = 'transparent'
    let color = '#fff'
    let border = '2px solid transparent'
    let cursor = 'pointer'
    
    if (isDisabled) {
      color = 'rgba(255,255,255,0.2)'
      cursor = 'not-allowed'
    } else if (isSelected) {
      bg = '#1D9E75'
      color = '#fff'
    } else if (isHighlighted) {
      bg = 'rgba(29, 158, 117, 0.15)'
      border = '2px solid #1D9E75'
      color = '#1D9E75'
    } else if (isSoftDisabled) {
      color = 'rgba(255,255,255,0.3)'
    }

    if (isToday) {
      border = '3px solid rgba(248,113,113,0.9)'
      if (!isSelected && !isHighlighted && !isDisabled) {
        color = '#f87171'
      }
    }

    days.push(
      <div key={d}
        onClick={(e) => {
          e.stopPropagation()
          if (!isDisabled) {
            onChange(currentDayStr)
            setIsOpen(false)
          }
        }}
        onMouseEnter={(e) => {
           if (!isDisabled && !isSelected && !isHighlighted) {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
           }
        }}
        onMouseLeave={(e) => {
           if (!isDisabled && !isSelected && !isHighlighted) {
              e.currentTarget.style.background = 'transparent'
           }
        }}
        style={{
          width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 6, fontSize: 13, background: bg, color: color, border: border, cursor: cursor,
          fontFamily: 'Inter, sans-serif', transition: 'background 0.2s'
        }}
      >
        {d}
      </div>
    )
  }

  const displayValue = value ? (() => {
     const v = parseDateLocal(value)
     return `${monthNames[v.getMonth()]} ${v.getDate()}, ${v.getFullYear()}`
  })() : placeholder

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8px 12px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 8, color: value ? '#fff' : 'rgba(255,255,255,0.5)',
          fontSize: 13, fontFamily: 'Inter, sans-serif',
          outline: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, minWidth: 150, justifyContent: 'space-between'
        }}
      >
        {displayValue}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', left: 0,
          background: '#0B0F19', border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 12, padding: 16, zIndex: 50,
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.7)',
          width: 250
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button onClick={handlePrevMonth} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
              {monthNames[month]} {year}
            </div>
            <button onClick={handleNextMonth} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600 }}>{day}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {days}
          </div>

          {/* Legend */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, border: '3px solid rgba(248,113,113,0.9)', borderRadius: 3 }}></div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>Current Date</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, border: '3px solid rgba(248,113,113,0.9)', background: '#1D9E75', borderRadius: 3 }}></div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>Current & Selected</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, background: '#1D9E75', borderRadius: 3 }}></div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>Selected Date</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, border: '2px solid #1D9E75', background: 'rgba(29, 158, 117, 0.15)', borderRadius: 3 }}></div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
                   {isStartDatePicker ? "End Date" : "Start Date"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function History() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('newest')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const setAnalysisData = useAnalysisStore((state) => state.setAnalysisData)
  const [startPickerOpen, setStartPickerOpen] = useState(false)
  const [endPickerOpen, setEndPickerOpen] = useState(false)

  const getPrevDay = (dStr) => {
    if (!dStr) return undefined
    const d = new Date(dStr)
    d.setDate(d.getDate() - 1)
    return d.toISOString().split('T')[0]
  }

  const getNextDay = (dStr) => {
    if (!dStr) return undefined
    const d = new Date(dStr)
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

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
    .filter(p => {
      const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.id?.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter
      
      let matchDate = true
      if (dateFilter !== 'ALL' && p.created_at) {
        const pDate = new Date(p.created_at)
        const now = new Date()
        
        if (dateFilter === '7DAYS') {
          const diffDays = Math.ceil(Math.abs(now - pDate) / (1000 * 60 * 60 * 24))
          matchDate = diffDays <= 7
        } else if (dateFilter === '30DAYS') {
          const diffDays = Math.ceil(Math.abs(now - pDate) / (1000 * 60 * 60 * 24))
          matchDate = diffDays <= 30
        } else if (dateFilter === 'CUSTOM') {
          const pTime = pDate.getTime()
          if (customStartDate) {
            const start = new Date(customStartDate).getTime()
            if (pTime < start) matchDate = false
          }
          if (customEndDate) {
            const end = new Date(customEndDate)
            end.setHours(23, 59, 59, 999)
            if (pTime > end.getTime()) matchDate = false
          }
        }
      }
      return matchSearch && matchStatus && matchDate
    })
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
      setAnalysisData(data)
      toast.success('Session loaded!')
      navigate(`/dashboard/${project.id}`)
    } catch {
      toast.error('Could not load this session. It may have expired.')
    }
  }

  const downloadHistory = () => {
    if (filtered.length === 0) {
      toast.error('No data to download')
      return
    }
    const headers = ['Analysis ID', 'Project Name', 'Date', 'Tables', 'Services', 'Status']
    const csvContent = [
      headers.join(','),
      ...filtered.map(p => {
        const date = p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : ''
        return `${p.id},"${(p.name || '').replace(/"/g, '""')}",${date},${p.table_count || 0},${p.service_count || 0},${p.status || 'COMPLETED'}`
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', 'schemamorph_history.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('History downloaded!')
  }

  return (
    <div style={{ padding: '32px 48px', width: '100%', minHeight: 'calc(100vh - 62px)', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>

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
        display: 'flex', gap: 16, alignItems: 'center',
        marginBottom: 24, flexWrap: 'wrap', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.02)', padding: '16px 20px',
        borderRadius: 14, border: '1px solid rgba(255,255,255,0.05)'
      }}>
        {/* Filters Group */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', flex: '1 1 auto' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
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
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8, color: '#fff',
                fontSize: 13, fontFamily: 'Inter, sans-serif',
                outline: 'none', transition: 'border-color 0.2s, background 0.2s',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(29,158,117,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            style={{
              padding: '9px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, color: '#fff',
              fontSize: 13, fontFamily: 'Inter, sans-serif',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="ALL" style={{background: '#0B0F19'}}>All Status</option>
            <option value="COMPLETED" style={{background: '#0B0F19'}}>Completed</option>
            <option value="PENDING" style={{background: '#0B0F19'}}>Pending</option>
            <option value="FAILED" style={{background: '#0B0F19'}}>Failed</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={e => {
              const val = e.target.value
              setDateFilter(val)
              if (val === 'CUSTOM') {
                setTimeout(() => {
                  try { if (startDateRef.current) startDateRef.current.showPicker() } catch(err) {}
                }, 50)
              }
            }}
            style={{
              padding: '9px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, color: '#fff',
              fontSize: 13, fontFamily: 'Inter, sans-serif',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="ALL" style={{background: '#0B0F19'}}>All Time</option>
            <option value="7DAYS" style={{background: '#0B0F19'}}>Last 7 Days</option>
            <option value="30DAYS" style={{background: '#0B0F19'}}>Last 30 Days</option>
            <option value="CUSTOM" style={{background: '#0B0F19'}}>Custom Date</option>
          </select>

          {/* Custom Date Inputs */}
          {dateFilter === 'CUSTOM' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <CustomDatePicker
                isStartDatePicker={true}
                value={customStartDate}
                onChange={(val) => {
                  setCustomStartDate(val);
                  // If start date is now after or equal to end date, clear the end date
                  if (val && customEndDate && new Date(val) >= new Date(customEndDate)) {
                    setCustomEndDate('');
                  }
                  // Automatically prompt for End Date
                  setTimeout(() => setEndPickerOpen(true), 50);
                }}
                highlightDate={customEndDate}
                placeholder="Start Date"
                isOpen={startPickerOpen}
                setIsOpen={setStartPickerOpen}
              />
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>to</span>
              <CustomDatePicker
                value={customEndDate}
                onChange={(val) => {
                  setCustomEndDate(val);
                }}
                minDate={getNextDay(customStartDate)}
                highlightDate={customStartDate}
                placeholder="End Date"
                isOpen={endPickerOpen}
                setIsOpen={setEndPickerOpen}
              />
            </div>
          )}

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value)}
            style={{
              padding: '9px 14px',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8, color: '#fff',
              fontSize: 13, fontFamily: 'Inter, sans-serif',
              outline: 'none', cursor: 'pointer',
            }}
          >
            <option value="newest" style={{background: '#0B0F19'}}>Newest first</option>
            <option value="oldest" style={{background: '#0B0F19'}}>Oldest first</option>
          </select>
        </div>

        {/* Action Group */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {/* Download CTA */}
          <button
            onClick={downloadHistory}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
              color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500,
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>

          {/* New analysis CTA */}
          <button
            onClick={() => navigate('/upload')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 18px',
              background: 'linear-gradient(135deg, #1D9E75, #0d6e52)',
              border: 'none', borderRadius: 8,
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

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input[type="date"] {
          color-scheme: dark;
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          opacity: 0.7;
          filter: invert(49%) sepia(85%) saturate(415%) hue-rotate(114deg) brightness(92%) contrast(93%);
          transition: opacity 0.2s;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  )
}
