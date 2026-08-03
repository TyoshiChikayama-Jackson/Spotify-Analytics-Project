import { useState } from 'react'
import { getTopTracks } from '../api/spotifyData.js'
import { useSpotifyData } from '../hooks/useSpotifyData.js'
import { SectionLoading, SectionError, SectionEmpty, RefreshButton } from './SectionState.jsx'
import TimeRangeToggle from './TimeRangeToggle.jsx'
import AddToQueueButton from './AddToQueueButton.jsx'

export default function TopTracks() {
  const [timeRange, setTimeRange] = useState('medium_term')
  const { data, loading, error, refreshing, refresh } = useSpotifyData(
    () => getTopTracks(timeRange, 20),
    [timeRange],
  )
  const items = data?.items ?? []

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Top Tracks</h2>
        <RefreshButton onClick={refresh} disabled={refreshing} />
      </div>

      <TimeRangeToggle value={timeRange} onChange={setTimeRange} />

      {loading && <SectionLoading count={8} />}
      {!loading && error && <SectionError message={error} onRetry={refresh} />}

      {!loading && !error && items.length === 0 && (
        <SectionEmpty>Not enough listening history for this time range yet.</SectionEmpty>
      )}

      {!loading && !error && items.length > 0 && (
        <ol className="ranked-list">
          {items.map((track, index) => (
            <li key={track.id} className="ranked-item" style={{ '--i': index }}>
              <span className="rank">{index + 1}</span>
              {track.album?.images?.[track.album.images.length - 1]?.url && (
                <img
                  className="list-art-lg"
                  src={track.album.images[track.album.images.length - 1].url}
                  alt={track.album.name}
                />
              )}
              <div className="ranked-item-info">
                <p className="track-name">{track.name}</p>
                <p className="muted small">{track.artists.map((a) => a.name).join(', ')}</p>
              </div>
              <AddToQueueButton trackUri={track.uri} trackName={track.name} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
