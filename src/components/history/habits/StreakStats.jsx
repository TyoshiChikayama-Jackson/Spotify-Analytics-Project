import { listeningStreaks } from '../../../utils/habitsStats.js'
import AnimatedNumber from '../../AnimatedNumber.jsx'

function formatDay(day) {
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function StreakStats({ entries }) {
  const { longest, current } = listeningStreaks(entries)

  if (!longest) return null

  return (
    <div className="chart-block">
      <h3 className="chart-title">Listening streaks</h3>
      <div className="highlight-grid">
        <div className="highlight-tile">
          <span className="stat-value">
            <AnimatedNumber value={longest.length} format={(n) => `${n} day${n === 1 ? '' : 's'}`} />
          </span>
          <span className="muted small">
            Longest streak · {formatDay(longest.startDay)} – {formatDay(longest.endDay)}
          </span>
        </div>
        <div className="highlight-tile">
          <span className="stat-value">
            {current ? (
              <AnimatedNumber value={current.length} format={(n) => `${n} day${n === 1 ? '' : 's'}`} />
            ) : (
              '—'
            )}
          </span>
          <span className="muted small">
            {current ? `Current streak · since ${formatDay(current.startDay)}` : 'No active streak'}
          </span>
        </div>
      </div>
    </div>
  )
}
