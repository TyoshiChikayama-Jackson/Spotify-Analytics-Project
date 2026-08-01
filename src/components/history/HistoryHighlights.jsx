import { totalMsPlayed, msToHours, mostListenedYear } from '../../utils/historyStats.js'

function formatHours(hours) {
  return Math.round(hours).toLocaleString()
}

export default function HistoryHighlights({ entries }) {
  const totalHours = msToHours(totalMsPlayed(entries))
  const topYear = mostListenedYear(entries)
  const uniqueTracks = new Set(entries.map((entry) => entry.trackUri)).size
  const uniqueArtists = new Set(entries.map((entry) => entry.artistName)).size

  const stats = [
    { label: 'Total listening time', value: `${formatHours(totalHours)} hrs` },
    { label: 'Most listened year', value: topYear ? topYear.year : '—' },
    { label: 'Unique tracks played', value: uniqueTracks.toLocaleString() },
    { label: 'Unique artists played', value: uniqueArtists.toLocaleString() },
  ]

  return (
    <div className="highlight-grid">
      {stats.map((stat) => (
        <div key={stat.label} className="highlight-tile">
          <span className="stat-value">{stat.value}</span>
          <span className="muted small">{stat.label}</span>
        </div>
      ))}
    </div>
  )
}
