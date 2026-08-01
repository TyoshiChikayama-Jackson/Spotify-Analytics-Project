import { useState } from 'react'
import { topByMsPlayed, msToHours } from '../../utils/historyStats.js'

export default function TopAllTime({ entries }) {
  const [mode, setMode] = useState('tracks')
  const items = topByMsPlayed(entries, { by: mode === 'tracks' ? 'track' : 'artist', limit: 20 })

  return (
    <div className="chart-block">
      <div className="panel-header">
        <h3 className="chart-title">All-time top {mode === 'tracks' ? 'tracks' : 'artists'}</h3>
        <div className="time-range-toggle">
          <button
            className={`toggle-tab ${mode === 'tracks' ? 'active' : ''}`}
            onClick={() => setMode('tracks')}
          >
            Tracks
          </button>
          <button
            className={`toggle-tab ${mode === 'artists' ? 'active' : ''}`}
            onClick={() => setMode('artists')}
          >
            Artists
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="section-state muted">No data yet.</p>
      ) : (
        <ol className="ranked-list">
          {items.map((item, index) => (
            <li
              key={`${item.name}-${item.artistName ?? ''}`}
              className="ranked-item"
              style={{ '--i': index }}
            >
              <span className="rank">{index + 1}</span>
              <div className="ranked-item-info">
                <p className="track-name">{item.name}</p>
                <p className="muted small">
                  {mode === 'tracks' && item.artistName ? `${item.artistName} · ` : ''}
                  {Math.round(msToHours(item.msPlayed) * 10) / 10} hrs · {item.playCount} plays
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
