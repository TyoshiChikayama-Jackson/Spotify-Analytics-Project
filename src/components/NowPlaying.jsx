import { getCurrentlyPlaying, getRecentlyPlayed } from '../api/spotifyData.js'
import { useSpotifyData } from '../hooks/useSpotifyData.js'
import { useDominantColor } from '../hooks/useDominantColor.js'
import { SectionLoading, SectionError, RefreshButton } from './SectionState.jsx'

function formatMs(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function EmptyNowPlaying({ recentTracks }) {
  return (
    <div className="now-playing-empty">
      <div className="now-playing-empty-glyph" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="track-name">Nothing is currently playing</p>
      <p className="muted small">Start a track on Spotify, then hit refresh.</p>

      {recentTracks.length > 0 && (
        <div className="recent-strip">
          <p className="chart-title" style={{ margin: '0 0 0.6rem' }}>
            Played recently
          </p>
          <div className="recent-strip-items">
            {recentTracks.map((item, index) => (
              <div className="recent-strip-item" key={`${item.played_at}-${index}`}>
                {item.track.album?.images?.[item.track.album.images.length - 1]?.url && (
                  <img
                    src={item.track.album.images[item.track.album.images.length - 1].url}
                    alt={item.track.album.name}
                    className="recent-strip-art"
                  />
                )}
                <div className="recent-strip-info">
                  <p className="recent-strip-track">{item.track.name}</p>
                  <p className="muted small">{item.track.artists.map((a) => a.name).join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function NowPlaying() {
  const { data, loading, error, refreshing, refresh } = useSpotifyData(getCurrentlyPlaying, [])
  const { data: recentData } = useSpotifyData(() => getRecentlyPlayed(4), [])

  const artUrl = data?.item?.album?.images?.[0]?.url ?? null
  const dominantColor = useDominantColor(artUrl)

  const recentTracks = (recentData?.items ?? [])
    .filter((item) => item.track.id !== data?.item?.id)
    .slice(0, 3)

  return (
    <section
      className="panel now-playing-panel"
      style={dominantColor ? { '--now-playing-glow': dominantColor } : undefined}
    >
      <div className="panel-header">
        <h2>Now Playing</h2>
        <RefreshButton onClick={refresh} disabled={refreshing} />
      </div>

      {loading && <SectionLoading count={1} />}
      {!loading && error && <SectionError message={error} onRetry={refresh} />}

      {!loading && !error && !data?.item && <EmptyNowPlaying recentTracks={recentTracks} />}

      {!loading && !error && data?.item && (
        <div className="now-playing-stage">
          {artUrl && (
            <div className="now-playing-backdrop" aria-hidden="true">
              <img src={artUrl} alt="" />
            </div>
          )}

          <div className="now-playing-main">
            <div className="now-playing-art-wrap">
              {artUrl && (
                <img className="now-playing-art" src={artUrl} alt={data.item.album.name} />
              )}
              {data.is_playing && (
                <div className="now-playing-indicator" aria-hidden="true" title="Playing">
                  <span />
                  <span />
                  <span />
                </div>
              )}
            </div>

            <div className="now-playing-info">
              <p className="now-playing-track">{data.item.name}</p>
              <p className="now-playing-artist">
                {data.item.artists.map((a) => a.name).join(', ')}
              </p>
              <p className="muted small now-playing-album">{data.item.album.name}</p>

              <div className="progress-track now-playing-progress" aria-hidden="true">
                <div
                  className="progress-fill"
                  style={{
                    width: `${Math.min(100, (data.progress_ms / data.item.duration_ms) * 100)}%`,
                  }}
                />
              </div>
              <p className="muted small now-playing-time">
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  {formatMs(data.progress_ms)} / {formatMs(data.item.duration_ms)}
                </span>
                {!data.is_playing && ' · Paused'}
              </p>
            </div>
          </div>

          {recentTracks.length > 0 && (
            <div className="recent-strip">
              <p className="chart-title" style={{ margin: '0 0 0.6rem' }}>
                Played before this
              </p>
              <div className="recent-strip-items">
                {recentTracks.map((item, index) => (
                  <div className="recent-strip-item" key={`${item.played_at}-${index}`}>
                    {item.track.album?.images?.[item.track.album.images.length - 1]?.url && (
                      <img
                        src={item.track.album.images[item.track.album.images.length - 1].url}
                        alt={item.track.album.name}
                        className="recent-strip-art"
                      />
                    )}
                    <div className="recent-strip-info">
                      <p className="recent-strip-track">{item.track.name}</p>
                      <p className="muted small">
                        {item.track.artists.map((a) => a.name).join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
