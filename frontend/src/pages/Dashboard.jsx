import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'

import useAnalysisStore from '../store/useAnalysisStore'
import GraphView from '../components/GraphView'
import ServicePanel from '../components/ServicePanel'
import QueryDiff from '../components/QueryDiff'
import StatsBar from '../components/StatsBar'
import ValidationBadge from '../components/ValidationBadge'

/* ── Stat card ───────────────────────────────────────────────────────────── */
function DashStatCard({ label, value, icon, sub, color = '#1D9E75', glow = false }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${color}22`,
      borderRadius: 14, padding: '18px 22px',
      display: 'flex', alignItems: 'center', gap: 16,
      transition: 'border-color 0.2s, transform 0.2s',
      cursor: 'default',
      boxShadow: glow ? `0 0 24px ${color}12` : 'none',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = `${color}55`; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = `${color}22`; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 12,
        background: `${color}15`,
        border: `1px solid ${color}28`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22, flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{
          fontSize: 26, fontWeight: 800, color: '#fff',
          fontFamily: 'Space Grotesk, sans-serif', lineHeight: 1,
        }}>{value}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontSize: 10, color, marginTop: 2, fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const analysisData = useAnalysisStore(state => state.analysisData)
  const isStaleOrMissing = useAnalysisStore(state => state.isStaleOrMissing)
  const [activeTab, setActiveTab] = useState('graph')

  if (isStaleOrMissing(sessionId)) {
    return (
      <div style={{
        minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
          <h2 style={{
            margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#fff',
            fontFamily: 'Space Grotesk, sans-serif',
          }}>Session Not Found</h2>
          <p style={{
            margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.4)',
            fontFamily: 'Inter, sans-serif',
          }}>
            Session <code style={{ color: '#1D9E75' }}>{sessionId}</code> may have expired.
          </p>
          <button
            onClick={() => navigate('/upload')}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #1D9E75, #0d6e52)',
              border: 'none', borderRadius: 10, color: '#fff',
              fontSize: 14, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(29,158,117,0.3)',
            }}
          >
            Start New Analysis
          </button>
        </div>
      </div>
    )
  }

  const data = analysisData
  const { summary, graph, services, target_schemas, affected_queries, validation, general_recommendations } = data
  const brokenQueries = affected_queries.filter(q => q.is_broken)

  // Compute stats
  const tableCount = graph?.nodes?.length ?? 0
  const serviceCount = services?.length ?? 0
  const fkCount = Object.values(summary || {}).reduce((acc, s) => acc + (s?.foreign_key_count || 0), 0)
  const schemaCount = target_schemas?.length ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 60px)' }}>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div style={{
        padding: '20px 24px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12,
        }}>
          <DashStatCard label="Tables Analyzed" value={tableCount} icon="🗄️" color="#1D9E75" glow sub="Schema nodes" />
          <DashStatCard label="Services Found" value={serviceCount} icon="🏗️" color="#6366f1" sub="Microservice boundaries" />
          <DashStatCard label="Schemas Generated" value={schemaCount} icon="📄" color="#f59e0b" sub="DDL output files" />
          <DashStatCard label="Broken Queries" value={brokenQueries.length} icon="⚠️" color={brokenQueries.length > 0 ? '#f87171' : '#1D9E75'} sub="Need refactoring" />
        </div>
      </div>

      {/* ── Validation badge strip ──────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '8px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
          Session: <code style={{ color: '#1D9E75', fontSize: 11 }}>{sessionId}</code>
        </span>
        <ValidationBadge validation={validation} />
      </div>

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div style={{
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        padding: '0 24px',
        display: 'flex', gap: 4,
        background: 'rgba(0,0,0,0.2)',
      }}>
        {[
          { id: 'graph', label: '🕸️  Dependency Graph' },
          { id: 'schemas', label: '🗄️  Target Schemas' },
          { id: 'queries', label: `⚠️  Queries (${brokenQueries.length} broken)` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 18px', fontSize: 13, fontWeight: 500,
              fontFamily: 'Space Grotesk, sans-serif',
              border: 'none', borderBottom: `2px solid ${activeTab === tab.id ? '#1D9E75' : 'transparent'}`,
              background: 'none',
              color: activeTab === tab.id ? '#1D9E75' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.2s',
              marginBottom: -1,
            }}
            onMouseEnter={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
            onMouseLeave={e => { if (activeTab !== tab.id) e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {activeTab === 'graph' && (
          <>
            <div style={{ flex: 1, position: 'relative' }}>
              <GraphView nodes={graph.nodes} edges={graph.edges} />
            </div>
            <div style={{
              width: 300, borderLeft: '1px solid rgba(255,255,255,0.07)',
              overflowY: 'auto',
            }}>
              <ServicePanel services={services} recommendations={general_recommendations} />
            </div>
          </>
        )}

        {activeTab === 'schemas' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <TargetSchemasView schemas={target_schemas} />
          </div>
        )}

        {activeTab === 'queries' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <QueryDiff queries={affected_queries} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

function TargetSchemasView({ schemas }) {
  const [active, setActive] = useState(0)
  const current = schemas[active]

  if (!schemas.length) return (
    <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>
      No schemas generated.
    </p>
  )

  return (
    <div style={{ display: 'flex', gap: 20, height: '100%' }}>
      {/* Service list */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <p style={{
          fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase',
          letterSpacing: '0.1em', fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif',
          marginBottom: 10,
        }}>Services</p>
        {schemas.map((s, i) => (
          <button
            key={s.service_id}
            onClick={() => setActive(i)}
            style={{
              width: '100%', textAlign: 'left',
              padding: '9px 12px', borderRadius: 9, marginBottom: 4,
              border: 'none',
              background: active === i ? 'rgba(29,158,117,0.15)' : 'transparent',
              color: active === i ? '#1D9E75' : 'rgba(255,255,255,0.5)',
              fontSize: 13, fontFamily: 'Space Grotesk, sans-serif',
              cursor: 'pointer', transition: 'all 0.15s',
              borderLeft: active === i ? '2px solid #1D9E75' : '2px solid transparent',
            }}
          >
            {s.service_name}
            {s.removed_fk_count > 0 && (
              <span style={{ marginLeft: 6, fontSize: 10, color: '#fbbf24' }}>⚠{s.removed_fk_count}</span>
            )}
          </button>
        ))}
      </div>

      {/* DDL panel */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{
            margin: 0, fontSize: 16, fontWeight: 700, color: '#fff',
            fontFamily: 'Space Grotesk, sans-serif',
          }}>{current.service_name}</h3>
          {current.removed_fk_count > 0 && (
            <span style={{
              fontSize: 11, padding: '4px 10px',
              background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
              color: '#fbbf24', borderRadius: 20, fontFamily: 'Space Grotesk, sans-serif',
            }}>
              {current.removed_fk_count} FK(s) removed
            </span>
          )}
        </div>
        <pre style={{
          background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 20,
          fontSize: 12, fontFamily: 'JetBrains Mono, Fira Code, monospace',
          color: '#5DCAA5', overflow: 'auto', maxHeight: '60vh',
          border: '1px solid rgba(29,158,117,0.15)',
          lineHeight: 1.7,
        }}>
          {current.ddl}
        </pre>
        {current.removed_fks?.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{
              fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              fontFamily: 'Space Grotesk, sans-serif', marginBottom: 8,
            }}>Removed Cross-Service FKs:</p>
            {current.removed_fks.map((fk, i) => (
              <div key={i} style={{
                padding: '8px 14px', borderRadius: 8, marginBottom: 6,
                background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)',
                fontSize: 12, color: '#fbbf24', fontFamily: 'JetBrains Mono, monospace',
              }}>
                <code>{fk.from_table}.{fk.from_columns.join(', ')}</code>
                <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 8px' }}>→</span>
                <code>{fk.to_table}.{fk.to_columns.join(', ')}</code>
                <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 8 }}>— {fk.reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
