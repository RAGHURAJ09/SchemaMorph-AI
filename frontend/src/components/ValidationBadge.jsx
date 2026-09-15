import { useState } from 'react'

export default function ValidationBadge({ validation }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!validation) return null

  const { passed, error_count, warning_count, errors = [], warnings = [] } = validation

  // Helper to render the modal overlay
  const renderModal = (title, items, colorClass) => {
    if (!isOpen) return null
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }} onClick={() => setIsOpen(false)}>
        <div style={{
          background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, padding: 24, width: '100%', maxWidth: 500,
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          fontFamily: 'Space Grotesk, sans-serif'
        }} onClick={e => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: '#fff' }}>{title}</h3>
            <button onClick={() => setIsOpen(false)} style={{
              background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer', fontSize: 18
            }}>✕</button>
          </div>
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {items.map((msg, i) => (
              <div key={i} className={`p-3 mb-2 rounded-lg border ${colorClass} font-mono text-xs`} style={{ lineHeight: 1.5 }}>
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (passed && warning_count === 0) {
    return (
      <span className="text-xs px-3 py-1 rounded-full border bg-green-500/10 border-green-500/30 text-green-400 font-medium">
        ✓ Validation Passed
      </span>
    )
  }

  if (!passed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>
          Click to know errors
        </span>
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(239,68,68,0.3)',
            background: 'rgba(239,68,68,0.1)', color: '#f87171',
            fontSize: 12, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 10px rgba(239,68,68,0)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.18)'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(239,68,68,0)'
          }}
        >
          <span>✗ {error_count} Error{error_count !== 1 ? 's' : ''}</span>
          <span style={{ opacity: 0.6, fontSize: 10 }}>↗</span>
        </button>
        {renderModal('Validation Errors', errors, 'bg-red-500/10 border-red-500/20 text-red-400')}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>
        Click to know warnings
      </span>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(251,191,36,0.3)',
          background: 'rgba(251,191,36,0.12)', color: '#fbbf24',
          fontSize: 12, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 10px rgba(251,191,36,0)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(251,191,36,0.22)'
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(251,191,36,0.2)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(251,191,36,0.12)'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 10px rgba(251,191,36,0)'
        }}
      >
        <span>⚠ {warning_count} Warning{warning_count !== 1 ? 's' : ''}</span>
        <span style={{ opacity: 0.6, fontSize: 10 }}>↗</span>
      </button>
      {renderModal('Validation Warnings', warnings, 'bg-amber-500/10 border-amber-500/20 text-amber-400')}
    </div>
  )
}
