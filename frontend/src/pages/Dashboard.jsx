import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { getSession, getMarkdownExport } from '../api/client'
import GraphView from '../components/GraphView'
import ServicePanel from '../components/ServicePanel'
import QueryDiff from '../components/QueryDiff'
import StatsBar from '../components/StatsBar'
import ValidationBadge from '../components/ValidationBadge'

export default function Dashboard() {
  const { sessionId } = useParams()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('graph') // 'graph' | 'schemas' | 'queries'

  useEffect(() => {
    getSession(sessionId)
      .then(setData)
      .catch(() => toast.error('Failed to load session. Try re-analyzing.'))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) return <LoadingScreen />
  if (!data)   return <ErrorScreen sessionId={sessionId} />

  const { summary, graph, services, target_schemas, affected_queries, validation, general_recommendations } = data
  const brokenQueries = affected_queries.filter(q => q.is_broken)

  return (
    <div className="min-h-screen bg-surface-900 flex flex-col">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 border-b border-surface-700 bg-surface-900/80 backdrop-blur-lg px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-brand-400 hover:text-white text-sm transition-colors">← New Analysis</Link>
          <span className="text-surface-600">|</span>
          <span className="gradient-text font-bold text-lg">SchemaMorph AI</span>
        </div>
        <div className="flex items-center gap-3">
          <ValidationBadge validation={validation} />
          <a
            href={getMarkdownExport(sessionId)}
            download
            className="btn-ghost text-xs py-1.5"
          >
            ↓ Export Report
          </a>
        </div>
      </nav>

      {/* Stats bar */}
      <StatsBar summary={summary} />

      {/* Tab bar */}
      <div className="border-b border-surface-700 px-6">
        <div className="flex gap-1 -mb-px">
          {[
            { id: 'graph',   label: '🕸  Dependency Graph' },
            { id: 'schemas', label: '🗄  Target Schemas' },
            { id: 'queries', label: `⚠  Queries (${brokenQueries.length} broken)` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-brand-500 text-brand-400'
                  : 'border-transparent text-surface-500 hover:text-surface-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
        {activeTab === 'graph' && (
          <>
            {/* Graph (main) */}
            <div className="flex-1 relative">
              <GraphView nodes={graph.nodes} edges={graph.edges} />
            </div>
            {/* Services sidebar */}
            <div className="w-80 border-l border-surface-700 overflow-y-auto">
              <ServicePanel services={services} recommendations={general_recommendations} />
            </div>
          </>
        )}

        {activeTab === 'schemas' && (
          <div className="flex-1 overflow-y-auto p-6">
            <TargetSchemasView schemas={target_schemas} />
          </div>
        )}

        {activeTab === 'queries' && (
          <div className="flex-1 overflow-y-auto p-6">
            <QueryDiff queries={affected_queries} />
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────────────────────── */

function TargetSchemasView({ schemas }) {
  const [active, setActive] = useState(0)
  const current = schemas[active]

  if (!schemas.length) return <p className="text-surface-500">No schemas generated.</p>

  return (
    <div className="flex gap-6 h-full">
      {/* Service list */}
      <div className="w-52 shrink-0">
        <p className="text-xs text-surface-500 uppercase font-semibold mb-3 tracking-wider">Services</p>
        {schemas.map((s, i) => (
          <button
            key={s.service_id}
            onClick={() => setActive(i)}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm mb-1 transition-all ${
              active === i
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : 'text-surface-400 hover:bg-surface-700 hover:text-white'
            }`}
          >
            {s.service_name}
            {s.removed_fk_count > 0 && (
              <span className="ml-2 text-xs text-amber-400">⚠{s.removed_fk_count}</span>
            )}
          </button>
        ))}
      </div>

      {/* DDL panel */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">{current.service_name}</h3>
          {current.removed_fk_count > 0 && (
            <span className="text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full">
              {current.removed_fk_count} FK(s) removed (cross-service)
            </span>
          )}
        </div>
        <pre className="bg-surface-800 rounded-xl p-5 text-xs font-mono text-green-300 overflow-auto max-h-[60vh] border border-surface-600 leading-relaxed">
          {current.ddl}
        </pre>
        {current.removed_fks?.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-surface-500 font-semibold uppercase tracking-wide">Removed Cross-Service FKs:</p>
            {current.removed_fks.map((fk, i) => (
              <div key={i} className="glass px-3 py-2 text-xs text-amber-300">
                <code>{fk.from_table}.{fk.from_columns.join(', ')}</code>
                <span className="text-surface-500 mx-2">→</span>
                <code>{fk.to_table}.{fk.to_columns.join(', ')}</code>
                <span className="text-surface-500 ml-2">— {fk.reason}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-500/30 border-t-brand-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-surface-400">Loading analysis...</p>
      </div>
    </div>
  )
}

function ErrorScreen({ sessionId }) {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center">
      <div className="text-center glass p-10">
        <p className="text-2xl mb-2">⚠</p>
        <p className="text-white font-semibold mb-1">Session not found</p>
        <p className="text-surface-500 text-sm mb-6">Session <code>{sessionId}</code> may have expired.</p>
        <Link to="/" className="btn-primary">Start New Analysis</Link>
      </div>
    </div>
  )
}
