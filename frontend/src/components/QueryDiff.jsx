import { useState } from 'react'

const FIX_PATTERN_COLORS = {
  'API Composition':     { bg: 'bg-blue-500/10',   border: 'border-blue-500/30',   text: 'text-blue-400' },
  'Shared Read Model':   { bg: 'bg-purple-500/10',  border: 'border-purple-500/30', text: 'text-purple-400' },
  'Denormalization':     { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',  text: 'text-amber-400' },
  'Event-Driven Sync':   { bg: 'bg-green-500/10',   border: 'border-green-500/30',  text: 'text-green-400' },
  'Saga Pattern':        { bg: 'bg-pink-500/10',    border: 'border-pink-500/30',   text: 'text-pink-400' },
  'CQRS Read Model':     { bg: 'bg-cyan-500/10',    border: 'border-cyan-500/30',   text: 'text-cyan-400' },
}

function PatternBadge({ pattern }) {
  const style = FIX_PATTERN_COLORS[pattern] || {
    bg: 'bg-surface-700', border: 'border-surface-600', text: 'text-surface-400'
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${style.bg} ${style.border} ${style.text}`}>
      {pattern}
    </span>
  )
}

export default function QueryDiff({ queries }) {
  const [expanded, setExpanded] = useState(null)
  const [filter, setFilter]     = useState('all') // 'all' | 'broken' | 'ok'

  const filtered = queries.filter(q => {
    if (filter === 'broken') return q.is_broken
    if (filter === 'ok')     return !q.is_broken && !q.parse_error
    return true
  })

  const brokenCount = queries.filter(q => q.is_broken).length
  const okCount     = queries.filter(q => !q.is_broken && !q.parse_error).length

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-xs text-surface-500 font-semibold uppercase tracking-wider">Filter:</span>
        {[
          { id: 'all',    label: `All (${queries.length})` },
          { id: 'broken', label: `⚠ Broken (${brokenCount})`, cls: 'text-red-400' },
          { id: 'ok',     label: `✓ OK (${okCount})`,         cls: 'text-green-400' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === f.id
                ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                : `text-surface-500 hover:text-white bg-surface-800 border border-surface-700 ${f.cls || ''}`
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-surface-600">No queries matching this filter.</div>
      )}

      <div className="space-y-3">
        {filtered.map(q => (
          <div
            key={q.query_id}
            className={`glass transition-all ${
              q.is_broken ? 'border-red-500/20 hover:border-red-500/40' : 'hover:border-brand-500/20'
            }`}
          >
            {/* Query header */}
            <button
              onClick={() => setExpanded(expanded === q.query_id ? null : q.query_id)}
              className="w-full px-5 py-4 flex items-start gap-3 text-left"
            >
              <span className={`shrink-0 mt-0.5 text-sm ${q.is_broken ? 'text-red-400' : 'text-green-400'}`}>
                {q.parse_error ? '⊘' : q.is_broken ? '⚠' : '✓'}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-surface-500">{q.query_id}</span>
                  {q.is_broken && q.fix_pattern && <PatternBadge pattern={q.fix_pattern} />}
                  {q.parse_error && (
                    <span className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">parse error</span>
                  )}
                </div>
                <code className="text-xs text-surface-300 line-clamp-2 leading-relaxed block">
                  {q.query_text}
                </code>
                {q.all_tables?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {q.all_tables.map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 bg-surface-700 text-surface-400 rounded font-mono border border-surface-600">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-surface-600 text-xs shrink-0">
                {expanded === q.query_id ? '▲' : '▼'}
              </span>
            </button>

            {/* Expanded detail */}
            {expanded === q.query_id && (
              <div className="px-5 pb-5 border-t border-surface-700 pt-4 space-y-4">
                {/* Full SQL */}
                <div>
                  <p className="text-xs text-surface-500 font-semibold mb-2 uppercase tracking-wide">SQL</p>
                  <pre className="bg-surface-900 rounded-lg p-4 text-xs font-mono text-green-300 overflow-auto leading-relaxed">
                    {q.query_text}
                  </pre>
                </div>

                {/* Broken joins */}
                {q.is_broken && q.broken_joins?.length > 0 && (
                  <div>
                    <p className="text-xs text-red-400 font-semibold mb-2 uppercase tracking-wide">⚠ Cross-Boundary Joins</p>
                    <ul className="space-y-1">
                      {q.broken_joins.map((j, i) => (
                        <li key={i} className="text-xs text-red-300 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                          {j}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Fix suggestion */}
                {q.is_broken && q.fix_description && (
                  <div>
                    <p className="text-xs text-brand-400 font-semibold mb-2 uppercase tracking-wide">
                      💡 Suggested Fix — {q.fix_pattern}
                    </p>
                    <div className="glass p-3 text-xs text-surface-300 leading-relaxed">
                      {q.fix_description}
                    </div>
                  </div>
                )}

                {/* Parse error */}
                {q.parse_error && (
                  <div className="text-xs text-red-400 bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                    <strong>Parse error:</strong> {q.parse_error}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
