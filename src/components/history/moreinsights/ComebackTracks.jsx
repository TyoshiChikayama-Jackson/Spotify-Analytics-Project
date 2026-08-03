import { useMemo, useState } from 'react'
import { detectComebackTracks } from '../../../utils/moreInsightsStats.js'

const PAGE_SIZE = 15

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

function formatGap(days) {
  const months = Math.round(days / 30)
  if (months < 12) return `${months} mo`
  const years = Math.round(months / 12)
  return `${years} yr${years === 1 ? '' : 's'}`
}

export default function ComebackTracks({ entries }) {
  const comebacks = useMemo(() => detectComebackTracks(entries), [entries])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const visible = comebacks.slice(0, visibleCount)

  return (
    <div className="chart-block">
      <h3 className="chart-title">Comeback tracks</h3>
      <p className="muted small" style={{ marginBottom: '0.75rem' }}>
        Tracks you played often, went quiet on for a long stretch, then came back to.
      </p>

      {comebacks.length === 0 ? (
        <p className="section-state muted">
          No clear comebacks detected yet — this tends to show up with a few years of history.
        </p>
      ) : (
        <>
          <ol className="ranked-list">
            {visible.map((track, index) => (
              <li
                key={`${track.trackUri}-${track.gapDays}`}
                className="ranked-item"
                style={{ '--i': index }}
              >
                <span className="rank">{index + 1}</span>
                <div className="ranked-item-info" style={{ flex: 1 }}>
                  <p className="track-name">{track.trackName}</p>
                  <p className="muted small">
                    {track.artistName} · {formatDate(track.firstEraStart)}–
                    {formatDate(track.firstEraEnd)}, then {formatGap(track.gapDays)} later{' '}
                    {formatDate(track.comebackEraStart)}–{formatDate(track.comebackEraEnd)}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          {visibleCount < comebacks.length && (
            <button
              className="secondary load-more-button"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            >
              Load more ({comebacks.length - visible.length} remaining)
            </button>
          )}
        </>
      )}
    </div>
  )
}
