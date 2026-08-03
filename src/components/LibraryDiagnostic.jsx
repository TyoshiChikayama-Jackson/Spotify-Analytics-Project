import { useState } from 'react'
import { getValidAccessToken } from '../auth/spotifyAuth.js'

// Temporary on-screen diagnostic for the /me/tracks 403 issue — hits a few
// related endpoints directly and prints raw status/body so this can be read
// off the page instead of requiring console paste (which has been blocked
// in this environment). Safe to delete once the underlying issue is found.
const CHECKS = [
  { label: 'GET /me (baseline, known working)', path: '/me' },
  { label: 'GET /me/player (known working)', path: '/me/player' },
  { label: 'GET /me/tracks?limit=1', path: '/me/tracks?limit=1' },
  { label: 'GET /me/tracks/contains?ids=...', path: '/me/tracks/contains?ids=0OluoQzCZ4sOYu7rlqilBw' },
]

export default function LibraryDiagnostic() {
  const [results, setResults] = useState(null)
  const [running, setRunning] = useState(false)

  async function runChecks() {
    setRunning(true)
    const token = await getValidAccessToken()
    const output = []
    for (const check of CHECKS) {
      try {
        const response = await fetch(`https://api.spotify.com/v1${check.path}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const text = await response.text()
        output.push({ ...check, status: response.status, body: text.slice(0, 300) })
      } catch (err) {
        output.push({ ...check, status: 'network error', body: err.message })
      }
    }
    setResults(output)
    setRunning(false)
  }

  return (
    <div className="panel" style={{ marginTop: '1rem', position: 'relative', zIndex: 10 }}>
      <div className="panel-header">
        <h2>Library Diagnostic (temporary)</h2>
        <button type="button" onClick={() => alert('button reached React')} style={{ marginRight: '0.5rem' }}>
          Test click
        </button>
        <button className="secondary" onClick={runChecks} disabled={running}>
          {running ? 'Running…' : 'Run checks'}
        </button>
      </div>
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {results.map((r) => (
            <div key={r.path} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
              <div style={{ fontWeight: 600 }}>
                {r.label} → <span style={{ color: r.status === 200 ? 'var(--good)' : 'var(--error)' }}>{r.status}</span>
              </div>
              <div className="muted" style={{ wordBreak: 'break-all' }}>{r.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
