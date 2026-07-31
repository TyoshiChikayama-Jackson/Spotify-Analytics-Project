import { getCurrentlyPlaying } from '../api/spotifyData.js'
import { useSpotifyData } from '../hooks/useSpotifyData.js'
import { SectionLoading, SectionError, SectionEmpty, RefreshButton } from './SectionState.jsx'

function formatMs(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export default function NowPlaying() {
  const { data, loading, error, refreshing, refresh } = useSpotifyData(getCurrentlyPlaying, [])

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Now Playing</h2>
        <RefreshButton onClick={refresh} disabled={refreshing} />
      </div>

      {loading && <SectionLoading />}
      {!loading && error && <SectionError message={error} onRetry={refresh} />}

      {!loading && !error && !data && (
        <SectionEmpty>Nothing is currently playing.</SectionEmpty>
      )}

      {!loading && !error && data?.item && (
        <div className="now-playing">
          {data.item.album?.images?.[0]?.url && (
            <img
              className="album-art-lg"
              src={data.item.album.images[0].url}
              alt={data.item.album.name}
            />
          )}
          <div className="now-playing-info">
            <p className="track-name">{data.item.name}</p>
            <p className="muted">{data.item.artists.map((a) => a.name).join(', ')}</p>
            <div className="progress-track" aria-hidden="true">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(100, (data.progress_ms / data.item.duration_ms) * 100)}%`,
                }}
              />
            </div>
            <p className="muted small">
              {formatMs(data.progress_ms)} / {formatMs(data.item.duration_ms)}
              {data.is_playing ? '' : ' (paused)'}
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
