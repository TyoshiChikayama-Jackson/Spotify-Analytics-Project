import { useRef, useState } from 'react'
import { seekToPosition } from '../api/spotifyData.js'

function formatMs(ms) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

// positionMs/durationMs describe the real, server-reported progress; while
// the user is dragging, a local dragPositionMs takes over for display so
// there's no visible fight between the poll-driven progress and the drag —
// the seek API is only called once, on release.
export default function SeekBar({ positionMs, durationMs, isPlaying, onSeeked }) {
  const trackRef = useRef(null)
  const [dragRatio, setDragRatio] = useState(null) // 0..1, or null when not dragging
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  function ratioFromClientX(clientX) {
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    return Math.min(1, Math.max(0, ratio))
  }

  function handlePointerDown(event) {
    if (!durationMs) return
    trackRef.current.setPointerCapture(event.pointerId)
    setDragRatio(ratioFromClientX(event.clientX))
  }

  function handlePointerMove(event) {
    if (dragRatio === null) return
    setDragRatio(ratioFromClientX(event.clientX))
  }

  async function handlePointerUp(event) {
    if (dragRatio === null) return
    trackRef.current.releasePointerCapture(event.pointerId)
    const finalRatio = ratioFromClientX(event.clientX)
    const targetMs = finalRatio * durationMs

    setPending(true)
    setError(null)
    try {
      await seekToPosition(targetMs)
      await onSeeked()
    } catch (err) {
      console.error('Seek failed:', err)
      setError(
        err.status === 404
          ? 'Open Spotify on a device to seek from here.'
          : err.status === 403
            ? 'Playback controls need a permission this session doesn’t have yet — log out and log back in.'
            : `Couldn't seek: ${err.message}`,
      )
    } finally {
      setPending(false)
      setDragRatio(null)
    }
  }

  const displayRatio =
    dragRatio !== null ? dragRatio : durationMs ? Math.min(1, positionMs / durationMs) : 0
  const displayPositionMs = dragRatio !== null ? dragRatio * durationMs : positionMs

  return (
    <div>
      <div
        ref={trackRef}
        className={`progress-track now-playing-progress seek-bar ${pending ? 'is-pending' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => setDragRatio(null)}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={durationMs || 0}
        aria-valuenow={Math.round(displayPositionMs)}
        tabIndex={0}
      >
        <div className="progress-fill" style={{ width: `${displayRatio * 100}%` }} />
        <div className="seek-bar-handle" style={{ left: `${displayRatio * 100}%` }} />
      </div>
      <p className="muted small now-playing-time">
        <span style={{ fontFamily: 'var(--font-mono)' }}>
          {formatMs(displayPositionMs)} / {formatMs(durationMs)}
        </span>
        {!isPlaying && ' · Paused'}
      </p>
      {error && (
        <p className="error playback-note" style={{ fontSize: '0.78rem' }}>
          {error}
        </p>
      )}
    </div>
  )
}
