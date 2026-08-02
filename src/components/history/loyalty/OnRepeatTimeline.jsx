import { useMemo } from 'react'
import { detectOnRepeatPeriods } from '../../../utils/loyaltyStats.js'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function OnRepeatTimeline({ entries }) {
  const periods = useMemo(() => detectOnRepeatPeriods(entries), [entries])

  return (
    <div className="chart-block">
      <h3 className="chart-title">Your on-repeat history</h3>
      <p className="muted small" style={{ marginBottom: '0.75rem' }}>
        Tracks played 10+ times within any 30-day window.
      </p>

      {periods.length === 0 ? (
        <p className="section-state muted">
          No on-repeat obsessions detected yet — nothing has been played 10+ times in a 30-day
          span. This tends to show up once a few years of history are in.
        </p>
      ) : (
        <ol className="ranked-list">
          {periods.map((period, index) => (
            <li
              key={`${period.trackUri}-${period.startTimestamp}`}
              className="ranked-item"
              style={{ '--i': index }}
            >
              <span className="rank">{formatDate(period.startTimestamp).split(' ')[0]}</span>
              <div className="ranked-item-info" style={{ flex: 1 }}>
                <p className="track-name">{period.trackName}</p>
                <p className="muted small">{period.artistName}</p>
              </div>
              <span className="muted small" style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                {period.playCount} plays
                <br />
                {formatDate(period.startTimestamp)} – {formatDate(period.endTimestamp)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
