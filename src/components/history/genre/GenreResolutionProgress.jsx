const STAGE_LABELS = {
  'resolving-artists': 'Matching artists to Spotify',
  'fetching-genres': 'Fetching genres',
}

export default function GenreResolutionProgress({ progress }) {
  const stageLabel = STAGE_LABELS[progress?.stage] ?? 'Preparing'
  const completed = progress?.completed ?? 0
  const total = progress?.total ?? 0
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="chart-block">
      <h3 className="chart-title">Analyzing genres across your history</h3>
      <p className="section-state muted" style={{ padding: '0 0 0.75rem', textAlign: 'left' }}>
        This only needs to happen once — genre matches are saved permanently, so future visits
        load instantly.
      </p>
      <p className="muted small" style={{ marginBottom: '0.4rem' }}>
        {stageLabel}
        {total > 0 ? `: ${completed.toLocaleString()} / ${total.toLocaleString()}` : '…'}
      </p>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
