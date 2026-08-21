export default function StatsBar({ summary }) {
  const stats = [
    { label: 'Tables',           value: summary.total_tables,           color: 'text-white' },
    { label: 'Services',         value: summary.service_count,          color: 'text-brand-400' },
    { label: 'Queries Analyzed', value: summary.total_queries_analyzed, color: 'text-white' },
    { label: 'Broken Queries',   value: summary.broken_query_count,
      color: summary.broken_query_count > 0 ? 'text-red-400' : 'text-green-400' },
    { label: 'Cross-Boundary FKs', value: summary.cross_boundary_fk_count,
      color: summary.cross_boundary_fk_count > 0 ? 'text-amber-400' : 'text-green-400' },
    { label: 'Modularity Score', value: summary.modularity_score.toFixed(3), color: 'text-cyan-400' },
  ]

  return (
    <div className="border-b border-surface-700 bg-surface-800/50 px-6 py-3 flex items-center gap-6 overflow-x-auto">
      {stats.map((s, i) => (
        <div key={i} className="flex flex-col shrink-0">
          <span className="text-[10px] text-surface-500 uppercase tracking-wider font-medium">{s.label}</span>
          <span className={`text-lg font-bold leading-tight ${s.color}`}>{s.value}</span>
        </div>
      ))}
      <div className="ml-auto shrink-0 flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
          summary.ai_used
            ? 'bg-brand-500/10 border-brand-500/30 text-brand-400'
            : 'bg-surface-700 border-surface-600 text-surface-500'
        }`}>
          {summary.ai_used ? '🤖 AI Active' : '⚙ AI Fallback'}
        </span>
      </div>
    </div>
  )
}
