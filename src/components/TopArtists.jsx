import { useState } from 'react'
import { getTopArtists } from '../api/spotifyData.js'
import { useSpotifyData } from '../hooks/useSpotifyData.js'
import { SectionLoading, SectionError, SectionEmpty, RefreshButton } from './SectionState.jsx'
import TimeRangeToggle from './TimeRangeToggle.jsx'
import TopGenresChart from './TopGenresChart.jsx'

export default function TopArtists() {
  const [timeRange, setTimeRange] = useState('medium_term')
  const { data, loading, error, refreshing, refresh } = useSpotifyData(
    () => getTopArtists(timeRange, 20),
    [timeRange],
  )
  const items = data?.items ?? []

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Top Artists</h2>
        <RefreshButton onClick={refresh} disabled={refreshing} />
      </div>

      <TimeRangeToggle value={timeRange} onChange={setTimeRange} />

      {loading && <SectionLoading count={8} />}
      {!loading && error && <SectionError message={error} onRetry={refresh} />}

      {!loading && !error && items.length === 0 && (
        <SectionEmpty>Not enough listening history for this time range yet.</SectionEmpty>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="card-grid">
          <div className="panel grid-card grid-card-md">
            <TopGenresChart artists={items} />
          </div>

          <div className="panel grid-card grid-card-lg">
            <ol className="ranked-list">
              {items.map((artist, index) => (
                <li key={artist.id} className="ranked-item" style={{ '--i': index }}>
                  <span className="rank">{index + 1}</span>
                  {artist.images?.[artist.images.length - 1]?.url && (
                    <img
                      className="list-art-lg round"
                      src={artist.images[artist.images.length - 1].url}
                      alt={artist.name}
                    />
                  )}
                  <div className="ranked-item-info">
                    <p className="track-name">{artist.name}</p>
                    {artist.genres?.length > 0 && (
                      <p className="muted small">{artist.genres.slice(0, 3).join(', ')}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  )
}
