import { useMemo } from 'react'
import { mostImprovedArtists } from '../../../utils/behaviorStats.js'

export default function MostImproved({ entries }) {
  const improved = useMemo(() => mostImprovedArtists(entries, { limit: 8 }), [entries])

  if (improved.length === 0) return null

  return (
    <div className="chart-block">
      <h3 className="chart-title">Most improved artists</h3>
      <p className="muted small" style={{ marginBottom: '0.75rem' }}>
        Biggest year-over-year jump in play count.
      </p>
      <ol className="ranked-list">
        {improved.map((artist, index) => (
          <li key={`${artist.artistName}-${artist.toYear}`} className="ranked-item" style={{ '--i': index }}>
            <span className="rank">{index + 1}</span>
            <div className="ranked-item-info" style={{ flex: 1 }}>
              <p className="track-name">{artist.artistName}</p>
              <p className="muted small">
                {artist.fromPlays} plays in {artist.fromYear} → {artist.toPlays} in {artist.toYear}
              </p>
            </div>
            <span className="muted small" style={{ fontFamily: 'var(--font-mono)', color: 'var(--good)' }}>
              +{artist.delta}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
