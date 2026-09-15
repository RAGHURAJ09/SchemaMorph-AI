import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

import useAnalysisStore from '../store/useAnalysisStore'
import MonolithGraphView    from '../components/MonolithGraphView'
import MicroserviceGraphView from '../components/MicroserviceGraphView'
import ServicePanel from '../components/ServicePanel'
import QueryDiff from '../components/QueryDiff'
import ValidationBadge from '../components/ValidationBadge'

/* ── Stat card ──────────────────────────────────────────────────────────── */
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

/* ── Tabs config ─────────────────────────────────────────────────────────── */
const TABS = [
  { id: 'monolith',      emoji: '🏛️', label: 'Monolith Graph'      },
  { id: 'microservice',  emoji: '🏗️', label: 'Microservice Graph'  },
  { id: 'schemas',       emoji: '🗄️', label: 'Target Schemas'      },
  { id: 'queries',       label: null  },   // dynamic label added below
]

/* ── Dashboard ─────────────────────────────────────────────────────────── */
export default function Dashboard() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const analysisData = useAnalysisStore(state => state.analysisData)
  const isStaleOrMissing = useAnalysisStore(state => state.isStaleOrMissing)
  const [activeTab, setActiveTab] = useState('monolith')

  if (isStaleOrMissing(sessionId)) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🔍</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
            Session Not Found
          </h2>
          <p style={{ margin: '0 0 24px', fontSize: 14, color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter, sans-serif' }}>
            Session <code style={{ color: '#1D9E75' }}>{sessionId}</code> may have expired.
          </p>
          <button
            onClick={() => navigate('/upload')}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #1D9E75, #0d6e52)',
              border: 'none', borderRadius: 10, color: '#fff',
              fontSize: 14, fontWeight: 600, fontFamily: 'Space Grotesk, sans-serif',
              cursor: 'pointer', boxShadow: '0 4px 14px rgba(29,158,117,0.3)',
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

  const tableCount   = graph?.nodes?.length ?? 0
  const serviceCount = services?.length ?? 0
  const fkCount      = graph?.edges?.length ?? 0
  const schemaCount  = target_schemas?.length ?? 0

  const tabs = [
    { id: 'monolith',     label: '🏛️  Monolith Graph'       },
    { id: 'microservice', label: '🏗️  Microservice Graph'   },
    { id: 'schemas',      label: '🗄️  Target Schemas'       },
    { id: 'queries',      label: `⚠️  Queries (${brokenQueries.length} broken)` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 60px)' }}>

      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <DashStatCard label="Tables Analyzed"   value={tableCount}   icon="🗄️"  color="#1D9E75" glow sub="Schema nodes" />
          <DashStatCard label="Services Found"     value={serviceCount} icon="🏗️"  color="#6366f1"      sub="Microservice boundaries" />
          <DashStatCard label="FK Relationships"   value={fkCount}      icon="🔗"  color="#f59e0b"      sub="Graph edges" />
          <DashStatCard label="Broken Queries"     value={brokenQueries.length} icon="⚠️"
            color={brokenQueries.length > 0 ? '#f87171' : '#1D9E75'} sub="Need refactoring" />
        </div>
      </div>

      {/* ── Validation badge strip ───────────────────────────────────────── */}
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
        display: 'flex', gap: 2,
        background: 'rgba(0,0,0,0.2)',
        overflowX: 'auto',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px', fontSize: 13, fontWeight: 500,
              fontFamily: 'Space Grotesk, sans-serif',
              border: 'none',
              borderBottom: `2px solid ${activeTab === tab.id ? '#1D9E75' : 'transparent'}`,
              background: 'none',
              color: activeTab === tab.id ? '#1D9E75' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.2s',
              marginBottom: -1, whiteSpace: 'nowrap',
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

        {/* MONOLITH GRAPH */}
        {activeTab === 'monolith' && (
          <>
            <div style={{ flex: 1, position: 'relative' }}>
              <MonolithGraphView nodes={graph.nodes} edges={graph.edges} />
            </div>
            <div style={{ width: 300, borderLeft: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto' }}>
              <MonolithSidebar tableCount={tableCount} fkCount={fkCount} serviceCount={serviceCount} />
            </div>
          </>
        )}

        {/* MICROSERVICE GRAPH */}
        {activeTab === 'microservice' && (
          <>
            <div style={{ flex: 1, position: 'relative' }}>
              <MicroserviceGraphView
                nodes={graph.nodes}
                edges={graph.edges}
                services={services}
              />
            </div>
            <div style={{ width: 300, borderLeft: '1px solid rgba(255,255,255,0.07)', overflowY: 'auto' }}>
              <ServicePanel services={services} recommendations={general_recommendations} />
            </div>
          </>
        )}

        {/* TARGET SCHEMAS */}
        {activeTab === 'schemas' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <TargetSchemasView schemas={target_schemas} />
          </div>
        )}

        {/* QUERIES */}
        {activeTab === 'queries' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <QueryDiff queries={affected_queries} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Monolith sidebar ───────────────────────────────────────────────────── */
function MonolithSidebar({ tableCount, fkCount, serviceCount }) {
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{
        fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
        color: 'rgba(255,255,255,0.35)', fontFamily: 'Space Grotesk',
        fontWeight: 700, marginBottom: 20,
      }}>Monolith Analysis</h2>

      {/* Info cards */}
      {[
        { icon: '🏛️', title: 'Single Service', desc: `All ${tableCount} tables live in one deployable unit. Any change requires redeploying everything.` },
        { icon: '🔗', title: `${fkCount} FK Relationships`, desc: 'All foreign keys are intra-service — no API boundaries to cross at the DB level.' },
        { icon: '⚠️', title: 'Scaling Bottleneck', desc: 'Cannot scale individual components independently. High coupling = low cohesion.' },
        { icon: '🎯', title: `→ ${serviceCount} Proposed Services`, desc: 'Switch to the Microservice Graph tab to see the proposed decomposition.', accent: '#1D9E75' },
      ].map(item => (
        <div key={item.title} style={{
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${item.accent ? item.accent + '33' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: 12, padding: '14px 16px',
          marginBottom: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontSize: 16 }}>{item.icon}</span>
            <span style={{
              fontSize: 13, fontWeight: 700,
              color: item.accent ?? '#fff',
              fontFamily: 'Space Grotesk',
            }}>{item.title}</span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, fontFamily: 'Inter' }}>
            {item.desc}
          </p>
        </div>
      ))}

      <div style={{
        marginTop: 8, padding: '12px 14px',
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 10, fontSize: 11,
        color: 'rgba(255,255,255,0.45)', fontFamily: 'Inter', lineHeight: 1.6,
      }}>
        💡 This graph shows the <strong style={{ color: '#fff' }}>original schema</strong> with no service boundaries.
        Use it to understand which tables are tightly coupled before examining the microservice proposal.
      </div>
    </div>
  )
}

/* ── Target Schemas view ────────────────────────────────────────────────── */
const STRATEGY_META = {
  shared_db: {
    icon: '🗄️',
    color: '#1D9E75',
    title: 'Shared Database',
    badge: 'SIMPLEST',
    desc: 'Both services use the same database. Keep the FK as-is. Good for getting started, but limits independent scaling.',
  },
  api_composition: {
    icon: '🌐',
    color: '#6366f1',
    title: 'API Composition',
    badge: 'RECOMMENDED',
    desc: 'Validate the foreign ID by calling the owning service\'s REST API before inserting. Services stay decoupled.',
  },
  event_driven: {
    icon: '📡',
    color: '#22d3ee',
    title: 'Event-Driven Sync',
    badge: 'SCALABLE',
    desc: 'Subscribe to domain events (e.g. OrderCreated) and cache IDs locally. Eventual consistency — best for high throughput.',
  },
  saga: {
    icon: '⛓️',
    color: '#f59e0b',
    title: 'Saga Pattern',
    badge: 'ADVANCED',
    desc: 'Choreography or orchestration saga with compensating transactions. Use when you need distributed ACID-like guarantees.',
  },
}

function CrossServiceFKPanel({ fks }) {
  const [openIdx, setOpenIdx] = useState(null)
  if (!fks?.length) return null

  return (
    <div style={{ marginTop: 20 }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
        paddingBottom: 10, borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}>
        <span style={{ fontSize: 15 }}>🔗</span>
        <span style={{
          fontSize: 12, fontWeight: 700, color: '#fff',
          fontFamily: 'Space Grotesk, sans-serif',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>Cross-Service Relationships</span>
        <span style={{
          fontSize: 10, padding: '2px 8px',
          background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)',
          color: '#fbbf24', borderRadius: 20, fontFamily: 'Inter',
        }}>
          {fks.length} cannot be a DB-level FK when services have separate databases
        </span>
      </div>

      {fks.map((fk, i) => (
        <div key={i} style={{ marginBottom: 16 }}>
          {/* FK relationship row */}
          <div style={{
            padding: '10px 14px', borderRadius: 10, marginBottom: 8,
            background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)',
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          }}>
            <code style={{ fontSize: 12, color: '#fbbf24', fontFamily: 'JetBrains Mono, monospace' }}>
              {fk.from_table}.{fk.from_columns?.join(', ')}
            </code>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
            <code style={{ fontSize: 12, color: '#fbbf24', fontFamily: 'JetBrains Mono, monospace' }}>
              {fk.to_table}.{fk.to_columns?.join(', ')}
            </code>
            <span style={{
              marginLeft: 'auto', fontSize: 10, padding: '2px 8px',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              color: '#f87171', borderRadius: 20, fontFamily: 'Inter', fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              ⚠ cross-service boundary
            </span>
          </div>

          {/* Strategies header */}
          <p style={{
            fontSize: 11, color: 'rgba(255,255,255,0.4)',
            fontFamily: 'Inter', marginBottom: 8, marginLeft: 2,
          }}>
            ✅ This relationship <strong style={{ color: '#fff' }}>CAN be implemented</strong> — choose a strategy:
          </p>

          {/* 4 strategy cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(fk.strategies ?? Object.keys(STRATEGY_META).map(id => ({ id }))).map(strategy => {
              const meta = STRATEGY_META[strategy.id] ?? {}
              const isOpen = openIdx === `${i}-${strategy.id}`
              return (
                <div
                  key={strategy.id}
                  onClick={() => setOpenIdx(isOpen ? null : `${i}-${strategy.id}`)}
                  style={{
                    padding: '10px 12px', borderRadius: 10,
                    background: isOpen ? `${meta.color}15` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isOpen ? meta.color + '55' : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer', transition: 'all 0.18s',
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.borderColor = meta.color + '44' }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{meta.icon}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: meta.color,
                      fontFamily: 'Space Grotesk',
                    }}>{meta.title ?? strategy.name}</span>
                    <span style={{
                      marginLeft: 'auto', fontSize: 8, padding: '1px 6px',
                      background: meta.color + '22', color: meta.color,
                      border: `1px solid ${meta.color}44`, borderRadius: 20,
                      fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '0.06em',
                    }}>{meta.badge}</span>
                  </div>
                  {isOpen && (
                    <div style={{ marginTop: 6 }}>
                      <p style={{
                        fontSize: 11, color: 'rgba(255,255,255,0.55)',
                        fontFamily: 'Inter', lineHeight: 1.6, margin: '0 0 8px',
                      }}>
                        {meta.desc ?? strategy.description}
                      </p>
                      {strategy.sql && (
                        <pre style={{
                          background: 'rgba(0,0,0,0.4)', borderRadius: 7, padding: '8px 10px',
                          fontSize: 11, color: meta.color,
                          fontFamily: 'JetBrains Mono, monospace',
                          margin: 0, whiteSpace: 'pre-wrap',
                        }}>
                          {strategy.sql}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function TargetSchemasView({ schemas }) {
  const [active, setActive] = useState(0)
  if (!schemas.length) return (
    <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter, sans-serif' }}>No schemas generated.</p>
  )
  const current = schemas[active]

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
              <span style={{ marginLeft: 6, fontSize: 10, color: '#fbbf24' }}>
                🔗{s.removed_fk_count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* DDL panel */}
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', fontFamily: 'Space Grotesk, sans-serif' }}>
            {current.service_name}
          </h3>
          {current.removed_fk_count > 0 && (
            <span style={{
              fontSize: 11, padding: '4px 10px',
              background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
              color: '#fbbf24', borderRadius: 20, fontFamily: 'Space Grotesk, sans-serif',
            }}>
              {current.removed_fk_count} cross-service FK{current.removed_fk_count > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <pre style={{
          background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 20,
          fontSize: 12, fontFamily: 'JetBrains Mono, Fira Code, monospace',
          color: '#5DCAA5', overflow: 'auto', maxHeight: '50vh',
          border: '1px solid rgba(29,158,117,0.15)', lineHeight: 1.7,
        }}>
          {current.ddl}
        </pre>

        {/* Cross-service FK strategies panel */}
        <CrossServiceFKPanel fks={current.removed_fks} />
      </div>
    </div>
  )
}

