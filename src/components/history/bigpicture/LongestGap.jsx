import { useMemo } from 'react'
import { longestListeningGaps } from '../../../utils/bigPictureStats.js'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function LongestGap({ entries }) {
  const gaps = useMemo(() => longestListeningGaps(entries, { limit: 5 }), [entries])

  if (gaps.length === 0) return null

  const [top, ...rest] = gaps

  return (
    <div className="chart-block">
      <h3 className="chart-title">Longest gap without listening</h3>

      <div className="highlight-tile" style={{ marginBottom: rest.length > 0 ? '1rem' : 0 }}>
        <span className="stat-value">{Math.round(top.gapDays)} days</span>
        <span className="muted small">
          {formatDate(top.startTimestamp)} – {formatDate(top.endTimestamp)}
        </span>
      </div>

      {rest.length > 0 && (
        <>
          <p className="muted small" style={{ marginBottom: '0.5rem' }}>
            Other long gaps, in case that one was a fluke:
          </p>
          <ol className="ranked-list">
            {rest.map((gap, index) => (
              <li key={gap.startTimestamp} className="ranked-item" style={{ '--i': index }}>
                <span className="rank">{index + 2}</span>
                <div className="ranked-item-info" style={{ flex: 1 }}>
                  <p className="track-name">{Math.round(gap.gapDays)} days</p>
                  <p className="muted small">
                    {formatDate(gap.startTimestamp)} – {formatDate(gap.endTimestamp)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
