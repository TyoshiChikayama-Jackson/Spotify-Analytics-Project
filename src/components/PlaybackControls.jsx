import { useState } from 'react'
import {
  pausePlayback,
  startPlayback,
  skipToNext,
  skipToPrevious,
  setShuffle,
  setRepeatMode,
} from '../api/spotifyData.js'

const REPEAT_CYCLE = ['off', 'context', 'track']

const NO_DEVICE_MESSAGE = 'Open Spotify on a device to control playback from here.'
// A 403 here almost always means the current access token predates the
// user-modify-playback-state scope being added — refreshing won't fix this,
// since a refresh token reissues under the SAME originally-granted scopes.
// Only a fresh login through Spotify's consent screen grants the new scope.
const SCOPE_MESSAGE = 'Playback controls need a permission this session doesn’t have yet — log out and log back in to enable them.'

function describeError(err) {
  if (err.status === 404) return NO_DEVICE_MESSAGE
  if (err.status === 403) return SCOPE_MESSAGE
  return `Playback control failed: ${err.message}`
}

// Note: there is no reliable "is a device active" signal available up
// front — GET /v1/me/player/currently-playing (what feeds this component)
// doesn't include device info at all; only a separate GET /v1/me/player
// call does, and spotifyData.js already makes that call per-action to
// resolve device_id. So controls stay enabled unconditionally and a real
// no-device failure is surfaced from the actual attempt (404), the same
// way MiniTrackStrip's click-to-play already handles it successfully.
export default function PlaybackControls({ isPlaying, shuffleState, repeatState, onChanged }) {
  const [pending, setPending] = useState(null) // 'play' | 'next' | 'previous' | 'shuffle' | 'repeat' | null
  const [error, setError] = useState(null)

  async function runAction(name, action) {
    setPending(name)
    setError(null)
    try {
      await action()
      await onChanged()
    } catch (err) {
      // spotifyData.js already console.error's the full response (status +
      // body) for every failed call — this is the user-facing summary.
      console.error(`Playback control "${name}" failed:`, err)
      setError(describeError(err))
    } finally {
      setPending(null)
    }
  }

  const busy = pending !== null
  // No optimistic flip here — onChanged() re-fetches the real shuffle_state
  // after the call resolves, so the button reflects Spotify's actual state
  // rather than an assumed one that could drift if the toggle silently fails.
  const shuffleOn = shuffleState === true

  // Same non-optimistic approach as shuffle: compute the next mode from the
  // real current repeatState (falling back to 'off' if it's unknown) and
  // let onChanged() re-fetch the true value after the call resolves.
  function nextRepeatMode() {
    const currentIndex = REPEAT_CYCLE.indexOf(repeatState)
    const fromIndex = currentIndex === -1 ? 0 : currentIndex
    return REPEAT_CYCLE[(fromIndex + 1) % REPEAT_CYCLE.length]
  }

  return (
    <div className="playback-controls">
      <div className="playback-controls-row">
        <button
          className="secondary playback-btn"
          onClick={() => runAction('previous', skipToPrevious)}
          disabled={busy}
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
          disabled={busy}
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
          disabled={busy}
          aria-label="Next track"
          title="Next track"
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M13 2.5a.5.5 0 0 0-1 0v4.6L4.2 2.23A.5.5 0 0 0 3.5 2.5v11a.5.5 0 0 0 .7.43L12 9.06v4.44a.5.5 0 0 0 1 0v-11z" />
          </svg>
        </button>

        <button
          className={`secondary playback-btn playback-btn-shuffle ${shuffleOn ? 'is-active' : ''}`}
          onClick={() => runAction('shuffle', () => setShuffle(!shuffleOn))}
          disabled={busy}
          aria-label={shuffleOn ? 'Turn shuffle off' : 'Turn shuffle on'}
          aria-pressed={shuffleOn}
          title={shuffleOn ? 'Shuffle: on' : 'Shuffle: off'}
        >
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1.5 4h2.3c1 0 1.9.5 2.4 1.4l4 6.2c.5.9 1.4 1.4 2.4 1.4h1.9" />
            <path d="M12.5 3.5 14.5 5l-2 1.5" />
            <path d="M1.5 12h2.3c1 0 1.9-.5 2.4-1.4l.6-1" />
            <path d="M12.5 12.5 14.5 11l-2-1.5" />
          </svg>
        </button>

        <button
          className={`secondary playback-btn playback-btn-repeat ${repeatState && repeatState !== 'off' ? 'is-active' : ''}`}
          onClick={() => runAction('repeat', () => setRepeatMode(nextRepeatMode()))}
          disabled={busy}
          aria-label={
            repeatState === 'track'
              ? 'Repeat: one track (click to turn off)'
              : repeatState === 'context'
                ? 'Repeat: all (click to repeat one track)'
                : 'Repeat: off (click to repeat all)'
          }
          title={
            repeatState === 'track' ? 'Repeat: one track' : repeatState === 'context' ? 'Repeat: all' : 'Repeat: off'
          }
        >
          <svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 6.5V6a3 3 0 0 1 3-3h6.5" />
            <path d="M11.5 1 14 3l-2.5 2" />
            <path d="M14 9.5v.5a3 3 0 0 1-3 3H4.5" />
            <path d="M4.5 15 2 13l2.5-2" />
          </svg>
          {repeatState === 'track' && <span className="playback-btn-repeat-badge">1</span>}
        </button>
      </div>

      {error && (
        <p className="error playback-note" style={{ fontSize: '0.78rem' }}>
          {error}
        </p>
      )}
    </div>
  )
}
