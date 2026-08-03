import { useState } from 'react'
import { addToQueue } from '../api/spotifyData.js'

// Same wording as PlaybackControls.jsx's NO_DEVICE_MESSAGE — one message,
// reused everywhere a "no active device" 404 can occur, so it never drifts.
const NO_DEVICE_MESSAGE = 'Open Spotify on a device to control playback from here.'

export default function AddToQueueButton({ trackUri, trackName }) {
  const [status, setStatus] = useState('idle') // idle | pending | done | error
  const [error, setError] = useState(null)

  if (!trackUri) return null

  async function handleClick(event) {
    event.preventDefault()
    event.stopPropagation()
    if (status === 'pending') return

    setStatus('pending')
    setError(null)
    try {
      await addToQueue(trackUri)
      setStatus('done')
      setTimeout(() => setStatus('idle'), 1500)
    } catch (err) {
      console.error(`Add to queue failed for "${trackName ?? trackUri}":`, err)
      setError(err.status === 404 ? NO_DEVICE_MESSAGE : `Couldn't add to queue: ${err.message}`)
      setStatus('error')
      setTimeout(() => {
        setStatus('idle')
        setError(null)
      }, 2500)
    }
  }

  return (
    <span className="add-to-queue-wrap">
      <button
        type="button"
        className={`add-to-queue-btn ${status === 'done' ? 'is-done' : ''} ${status === 'error' ? 'is-error' : ''}`}
        onClick={handleClick}
        disabled={status === 'pending'}
        aria-label={trackName ? `Add "${trackName}" to queue` : 'Add to queue'}
        title={error ?? (trackName ? `Add "${trackName}" to queue` : 'Add to queue')}
      >
        {status === 'done' ? (
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 8.5 6.5 12 13 4.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M8 3v10M3 8h10" />
          </svg>
        )}
      </button>
      {error && <span className="add-to-queue-error">{error}</span>}
    </span>
  )
}
