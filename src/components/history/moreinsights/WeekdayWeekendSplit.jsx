import { useMemo } from 'react'
import { weekdayWeekendSplit } from '../../../utils/moreInsightsStats.js'

export default function WeekdayWeekendSplit({ entries }) {
  const split = useMemo(() => weekdayWeekendSplit(entries), [entries])

  if (split.weekdayArtists.length === 0 && split.weekendArtists.length === 0) return null

  return (
    <div className="chart-block">
      <h3 className="chart-title">Weekday vs. weekend</h3>

      <div className="highlight-grid" style={{ marginBottom: '1.25rem' }}>
        <div className="highlight-tile">
          <span className="stat-value">{split.avgHoursPerWeekday.toFixed(1)} hrs</span>
          <span className="muted small">Average per weekday</span>
        </div>
        <div className="highlight-tile">
          <span className="stat-value">{split.avgHoursPerWeekendDay.toFixed(1)} hrs</span>
          <span className="muted small">Average per weekend day</span>
        </div>
      </div>

      <div className="chart-grid">
        <div>
          <h4 className="chart-title">Top weekday artists</h4>
          {split.weekdayArtists.length === 0 ? (
            <p className="section-state muted">No data yet.</p>
          ) : (
            <ol className="ranked-list">
              {split.weekdayArtists.map((artist, index) => (
                <li key={artist.name} className="ranked-item" style={{ '--i': index }}>
                  <span className="rank">{index + 1}</span>
                  <div className="ranked-item-info">
                    <p className="track-name">{artist.name}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div>
          <h4 className="chart-title">Top weekend artists</h4>
          {split.weekendArtists.length === 0 ? (
            <p className="section-state muted">No data yet.</p>
          ) : (
            <ol className="ranked-list">
              {split.weekendArtists.map((artist, index) => (
                <li key={artist.name} className="ranked-item" style={{ '--i': index }}>
                  <span className="rank">{index + 1}</span>
                  <div className="ranked-item-info">
                    <p className="track-name">{artist.name}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  )
}
