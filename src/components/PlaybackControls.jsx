import { useState } from 'react'
import { pausePlayback, startPlayback, skipToNext, skipToPrevious } from '../api/spotifyData.js'

const NO_DEVICE_MESSAGE = 'Open Spotify on a device to control playback from here.'

export default function PlaybackControls({ isPlaying, hasActiveDevice, onChanged }) {
  const [pending, setPending] = useState(null) // 'play' | 'next' | 'previous' | null
  const [error, setError] = useState(null)

  async function runAction(name, action) {
    setPending(name)
    setError(null)
    try {
      await action()
      await onChanged()
    } catch (err) {
      setError(err.status === 404 ? NO_DEVICE_MESSAGE : err.message)
    } finally {
      setPending(null)
    }
  }

  const disabled = hasActiveDevice === false
  const busy = pending !== null

  return (
    <div className="playback-controls">
      <div className="playback-controls-row">
        <button
          className="secondary playback-btn"
          onClick={() => runAction('previous', skipToPrevious)}
          disabled={disabled || busy}
          aria-label="Previous track"
          title="Previous track"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M3 2.5a.5.5 0 0 1 1 0v4.6l7.8-4.87A.5.5 0 0 1 12.5 2.5v11a.5.5 0 0 1-.7.43L4 9.06v4.44a.5.5 0 0 1-1 0v-11z" />
          </svg>
        </button>

        <button
          className="playback-btn playback-btn-primary"
          onClick={() => runAction('play', isPlaying ? pausePlayback : startPlayback)}
          disabled={disabled || busy}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
              <rect x="3" y="2.5" width="3.5" height="11" rx="0.75" />
              <rect x="9.5" y="2.5" width="3.5" height="11" rx="0.75" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M4 2.7a.7.7 0 0 1 1.07-.6l8.5 5.3a.7.7 0 0 1 0 1.2l-8.5 5.3A.7.7 0 0 1 4 13.3V2.7z" />
            </svg>
          )}
        </button>

        <button
          className="secondary playback-btn"
          onClick={() => runAction('next', skipToNext)}
          disabled={disabled || busy}
          aria-label="Next track"
          title="Next track"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M13 2.5a.5.5 0 0 0-1 0v4.6L4.2 2.23A.5.5 0 0 0 3.5 2.5v11a.5.5 0 0 0 .7.43L12 9.06v4.44a.5.5 0 0 0 1 0v-11z" />
          </svg>
        </button>
      </div>

      {disabled && !error && <p className="muted small playback-note">{NO_DEVICE_MESSAGE}</p>}
      {error && <p className="error playback-note" style={{ fontSize: '0.78rem' }}>{error}</p>}
    </div>
  )
}
