import { totalMsPlayed, msToHours, mostListenedYear } from '../../utils/historyStats.js'
import AnimatedNumber from '../AnimatedNumber.jsx'

export default function HistoryHighlights({ entries }) {
  const totalHours = Math.round(msToHours(totalMsPlayed(entries)))
  const topYear = mostListenedYear(entries)
  const uniqueTracks = new Set(entries.map((entry) => entry.trackUri)).size
  const uniqueArtists = new Set(entries.map((entry) => entry.artistName)).size

  return (
    <div className="highlight-grid">
      <div className="highlight-tile">
        <span className="stat-value">
          <AnimatedNumber value={totalHours} format={(n) => `${n.toLocaleString()} hrs`} />
        </span>
        <span className="muted small">Total listening time</span>
      </div>
      <div className="highlight-tile">
        <span className="stat-value">{topYear ? topYear.year : '—'}</span>
        <span className="muted small">Most listened year</span>
      </div>
      <div className="highlight-tile">
        <span className="stat-value">
          <AnimatedNumber value={uniqueTracks} />
        </span>
        <span className="muted small">Unique tracks played</span>
      </div>
      <div className="highlight-tile">
        <span className="stat-value">
          <AnimatedNumber value={uniqueArtists} />
        </span>
        <span className="muted small">Unique artists played</span>
      </div>
    </div>
  )
}
