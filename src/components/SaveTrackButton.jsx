import { useEffect, useState } from 'react'
import { isTrackSaved, saveTrack, removeSavedTrack } from '../api/spotifyData.js'

// Tracks saved-state per trackId locally (not lifted to NowPlaying) since
// nothing else in the app needs it — checked fresh whenever the track changes.
export default function SaveTrackButton({ trackId }) {
  const [saved, setSaved] = useState(null) // null = unknown/checking
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!trackId) {
      setSaved(null)
      return
    }
    let cancelled = false
    setSaved(null)
    setError(null)
    isTrackSaved(trackId)
      .then((result) => {
        if (!cancelled) setSaved(result)
      })
      .catch((err) => {
        console.error('Failed to check saved status:', err)
        if (!cancelled) setSaved(null)
      })
    return () => {
      cancelled = true
    }
  }, [trackId])

  async function handleClick() {
    if (!trackId || pending || saved === null) return
    const nextSaved = !saved
    setPending(true)
    setError(null)
    try {
      if (nextSaved) {
        await saveTrack(trackId)
      } else {
        await removeSavedTrack(trackId)
      }
      setSaved(nextSaved)
    } catch (err) {
      console.error(`Failed to ${nextSaved ? 'save' : 'remove'} track:`, err)
      setError(
        err.status === 403
          ? 'Playback controls need a permission this session doesn’t have yet — log out and log back in.'
          : `Couldn't ${nextSaved ? 'save' : 'remove'} this track: ${err.message}`,
      )
      // saved state intentionally left untouched — the icon should not flip
      // to a state that wasn't actually confirmed by the API.
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="save-track">
      <button
        type="button"
        className={`secondary playback-btn save-track-btn ${saved ? 'is-active' : ''}`}
        onClick={handleClick}
        disabled={pending || saved === null}
        aria-label={saved ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
        aria-pressed={saved === true}
        title={saved ? 'Remove from Liked Songs' : 'Save to Liked Songs'}
      >
        <svg
          viewBox="0 0 16 16"
          width="16"
          height="16"
          fill={saved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 13.8 2.5 8.5C.9 6.9 1 4.2 2.8 2.8c1.6-1.2 3.7-.9 5 .5L8 3.6l.2-.3c1.3-1.4 3.4-1.7 5-.5 1.8 1.4 1.9 4.1.3 5.7L8 13.8z" />
        </svg>
      </button>

      {error && (
        <p className="error playback-note" style={{ fontSize: '0.78rem' }}>
          {error}
        </p>
      )}
    </div>
  )
}
