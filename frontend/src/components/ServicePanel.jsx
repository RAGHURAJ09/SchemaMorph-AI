export default function ServicePanel({ services, recommendations }) {
  const colors = [
    '#6366f1', '#22d3ee', '#f59e0b', '#10b981',
    '#ec4899', '#8b5cf6', '#f97316', '#14b8a6',
  ]

  return (
    <div className="p-4">
      <h2 className="text-xs uppercase font-semibold tracking-widest text-surface-500 mb-4">
        Identified Services
      </h2>

      <div className="space-y-3">
        {services.map((svc, i) => (
          <div key={svc.service_id} className="glass p-4 hover:border-brand-500/30 transition-all">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: colors[i % colors.length] }}
              />
              <span className="text-white text-sm font-semibold">{svc.service_name}</span>
              <span className="ml-auto text-xs text-surface-500">
                {svc.table_count} table{svc.table_count !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Rationale */}
            {svc.rationale && (
              <p className="text-xs text-surface-400 leading-relaxed mb-3">{svc.rationale}</p>
            )}

            {/* Responsibilities */}
            {svc.responsibilities?.length > 0 && (
              <ul className="space-y-1 mb-3">
                {svc.responsibilities.map((r, j) => (
                  <li key={j} className="text-xs text-surface-400 flex gap-1.5">
                    <span className="text-brand-500 shrink-0 mt-0.5">›</span>
                    {r}
                  </li>
                ))}
              </ul>
            )}

            {/* Tables */}
            <div className="flex flex-wrap gap-1">
              {svc.tables.map(t => (
                <span
                  key={t}
                  className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                  style={{
                    background: `${colors[i % colors.length]}20`,
                    color: colors[i % colors.length],
                    border: `1px solid ${colors[i % colors.length]}40`,
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* General Recommendations */}
      {recommendations?.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs uppercase font-semibold tracking-widest text-surface-500 mb-3">
            Recommendations
          </h3>
          <div className="space-y-2">
            {recommendations.filter(Boolean).map((r, i) => (
              <div key={i} className="text-xs text-surface-400 leading-relaxed p-3 bg-surface-800 rounded-lg border border-surface-700">
                💡 {r}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
