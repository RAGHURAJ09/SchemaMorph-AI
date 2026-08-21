export default function ValidationBadge({ validation }) {
  if (!validation) return null

  const { passed, error_count, warning_count } = validation

  if (passed && warning_count === 0) {
    return (
      <span className="text-xs px-3 py-1 rounded-full border bg-green-500/10 border-green-500/30 text-green-400 font-medium">
        ✓ Validation Passed
      </span>
    )
  }

  if (!passed) {
    return (
      <span className="text-xs px-3 py-1 rounded-full border bg-red-500/10 border-red-500/30 text-red-400 font-medium"
            title={validation.errors?.join('\n')}>
        ✗ {error_count} Error{error_count !== 1 ? 's' : ''}
      </span>
    )
  }

  return (
    <span className="text-xs px-3 py-1 rounded-full border bg-amber-500/10 border-amber-500/30 text-amber-400 font-medium"
          title={validation.warnings?.join('\n')}>
      ⚠ {warning_count} Warning{warning_count !== 1 ? 's' : ''}
    </span>
  )
}
