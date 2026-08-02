import { useMemo, useState } from 'react'
import { topAlbumListenerAlbums, topSinglesArtists } from '../../../utils/behaviorStats.js'

export default function AlbumLoyalty({ entries }) {
  const [mode, setMode] = useState('albums')
  const albumListeners = useMemo(() => topAlbumListenerAlbums(entries), [entries])
  const singlesListeners = useMemo(() => topSinglesArtists(entries), [entries])

  const items = mode === 'albums' ? albumListeners : singlesListeners

  if (albumListeners.length === 0 && singlesListeners.length === 0) return null

  return (
    <div className="chart-block">
      <div className="panel-header">
        <h3 className="chart-title">Album loyalty</h3>
        <div className="time-range-toggle">
          <button
            className={`toggle-tab ${mode === 'albums' ? 'active' : ''}`}
            onClick={() => setMode('albums')}
          >
            Album listening
          </button>
          <button
            className={`toggle-tab ${mode === 'singles' ? 'active' : ''}`}
            onClick={() => setMode('singles')}
          >
            Singles
          </button>
        </div>
      </div>

      <p className="muted small" style={{ marginBottom: '0.75rem' }}>
        {mode === 'albums'
          ? 'Albums where multiple tracks tend to get played together in one sitting — a proxy for start-to-finish listening (exports don’t include track order, so this is approximate).'
          : "Artists you tend to hear one track at a time, rather than multiple tracks from the same album back-to-back."}
      </p>

      {items.length === 0 ? (
        <p className="section-state muted">No qualifying albums found yet.</p>
      ) : (
        <ol className="ranked-list">
          {items.map((item, index) => (
            <li key={`${item.artistName}-${item.albumName}`} className="ranked-item" style={{ '--i': index }}>
              <span className="rank">{index + 1}</span>
              <div className="ranked-item-info" style={{ flex: 1 }}>
                <p className="track-name">{item.albumName}</p>
                <p className="muted small">{item.artistName}</p>
              </div>
              <span className="muted small" style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                {item.plays} plays
                {mode === 'albums' && (
                  <>
                    <br />
                    {item.albumListenerScore.toFixed(0)}% multi-track
                  </>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
