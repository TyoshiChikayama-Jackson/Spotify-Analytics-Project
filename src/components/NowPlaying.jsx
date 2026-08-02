import { useEffect, useState } from 'react'
import { getCurrentlyPlaying, getRecentlyPlayed, getQueue, playTrackUri } from '../api/spotifyData.js'
import { useSpotifyData } from '../hooks/useSpotifyData.js'
import { useNowPlayingPolling } from '../hooks/useNowPlayingPolling.js'
import { useDominantColor } from '../hooks/useDominantColor.js'
import { SectionLoading, SectionError, RefreshButton } from './SectionState.jsx'
import PlaybackControls from './PlaybackControls.jsx'

function formatMs(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function MiniTrackStrip({ title, tracks, onChanged }) {
  const [pendingUri, setPendingUri] = useState(null)
  const [error, setError] = useState(null)

  if (tracks.length === 0) return null

  async function handleClick(track) {
    if (!track.uri || pendingUri) return
    setPendingUri(track.uri)
    setError(null)
    try {
      await playTrackUri(track.uri)
      await onChanged()
    } catch (err) {
      console.error(`Click-to-play failed for "${track.name}":`, err)
      setError(
        err.status === 404
          ? 'Open Spotify on a device to play tracks from here.'
          : err.status === 403
            ? 'Playback controls need a permission this session doesn’t have yet — log out and log back in.'
            : `Couldn't play this track: ${err.message}`,
      )
    } finally {
      setPendingUri(null)
    }
  }

  return (
    <div className="recent-strip">
      <p className="chart-title" style={{ margin: '0 0 0.6rem' }}>
        {title}
      </p>
      <div className="recent-strip-items">
        {tracks.map((track, index) => (
          <button
            type="button"
            className={`recent-strip-item recent-strip-item-clickable ${pendingUri === track.uri ? 'is-pending' : ''}`}
            key={`${track.id ?? track.uri}-${index}`}
            onClick={() => handleClick(track)}
            disabled={pendingUri !== null}
            title={`Play "${track.name}"`}
          >
            {track.album?.images?.[track.album.images.length - 1]?.url && (
              <img
                src={track.album.images[track.album.images.length - 1].url}
                alt={track.album.name}
                className="recent-strip-art"
              />
            )}
            <div className="recent-strip-info">
              <p className="recent-strip-track">{track.name}</p>
              <p className="muted small">{track.artists.map((a) => a.name).join(', ')}</p>
            </div>
          </button>
        ))}
      </div>
      {error && (
        <p className="error playback-note" style={{ fontSize: '0.78rem' }}>
          {error}
        </p>
      )}
    </div>
  )
}

function EmptyNowPlaying({ recentTracks, onChanged }) {
  return (
    <div className="now-playing-empty">
      <div className="now-playing-empty-glyph" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <p className="track-name">Nothing is currently playing</p>
      <p className="muted small">Checking automatically — or start a track on Spotify now.</p>

      {/* No track loaded means device state is unknown until an action is
          attempted — hasActiveDevice stays undefined so the buttons are
          enabled and a real 404 (not a guess) drives the "no device" message. */}
      <PlaybackControls isPlaying={false} hasActiveDevice={undefined} onChanged={onChanged} />

      <MiniTrackStrip title="Played recently" tracks={recentTracks} onChanged={onChanged} />
    </div>
  )
}

export default function NowPlaying() {
  const { data, loading, error, refreshing, refresh } = useNowPlayingPolling(getCurrentlyPlaying, {
    isActive: (result) => Boolean(result?.is_playing),
  })
  const { data: recentData } = useSpotifyData(() => getRecentlyPlayed(4), [])

  const currentTrackId = data?.item?.id ?? null
  const [queue, setQueue] = useState([])

  // Queue only needs to change when the current track changes, not on every
  // 5-10s poll tick — refetching it that often would be excessive for data
  // that's usually stable for the length of a song.
  useEffect(() => {
    if (!currentTrackId) {
      setQueue([])
      return
    }
    let cancelled = false
    getQueue()
      .then((result) => {
        if (!cancelled) setQueue(result?.queue ?? [])
      })
      .catch(() => {
        if (!cancelled) setQueue([])
      })
    return () => {
      cancelled = true
    }
  }, [currentTrackId])

  const artUrl = data?.item?.album?.images?.[0]?.url ?? null
  const dominantColor = useDominantColor(artUrl)

  const recentTracks = (recentData?.items ?? [])
    .filter((item) => item.track.id !== currentTrackId)
    .slice(0, 3)
    .map((item) => item.track)

  const upcomingTracks = queue.slice(0, 4)

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

      {!loading && !error && !data?.item && (
        <EmptyNowPlaying recentTracks={recentTracks} onChanged={refresh} />
      )}

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

              <PlaybackControls
                isPlaying={Boolean(data.is_playing)}
                hasActiveDevice={data.device != null}
                onChanged={refresh}
              />
            </div>
          </div>

          <MiniTrackStrip title="Next up" tracks={upcomingTracks} onChanged={refresh} />
          <MiniTrackStrip title="Played before this" tracks={recentTracks} onChanged={refresh} />
        </div>
      )}
    </section>
  )
}
