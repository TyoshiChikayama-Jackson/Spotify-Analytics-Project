import { dayHourHeatmap } from '../../utils/historyStats.js'

// Sequential amber ramp, dark -> light on the graphite surface (matches the
// --accent hue used for interactive UI elsewhere in this system).
const SEQUENTIAL_STEPS = [
  '#2a2011',
  '#3a2c14',
  '#4d3a17',
  '#634a19',
  '#7c5b1a',
  '#976c1c',
  '#b47f1e',
  '#d2941f',
  '#f0a83c',
  '#f4bb63',
  '#f7cd8b',
  '#fadfb3',
  '#fdf1db',
]

const HOUR_TICKS = [0, 6, 12, 18]

function colorFor(count, max) {
  if (count === 0) return 'var(--gridline)'
  const ratio = max > 0 ? count / max : 0
  const index = Math.min(SEQUENTIAL_STEPS.length - 1, Math.round(ratio * (SEQUENTIAL_STEPS.length - 1)))
  return SEQUENTIAL_STEPS[index]
}

function hourLabel(hour) {
  const suffix = hour < 12 ? 'a' : 'p'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}${suffix}`
}

export default function ListeningHeatmap({ entries }) {
  const rows = dayHourHeatmap(entries)
  const max = Math.max(0, ...rows.flatMap((row) => row.hours.map((h) => h.count)))

  if (max === 0) return null

  return (
    <div className="chart-block">
      <h3 className="chart-title">Listening activity by day &amp; hour</h3>
      <div className="heatmap" role="table" aria-label="Plays by day of week and hour of day">
        <div className="heatmap-hour-axis" aria-hidden="true">
          <span />
          {HOUR_TICKS.map((hour) => (
            <span key={hour} style={{ gridColumnStart: hour + 2 }}>
              {hourLabel(hour)}
            </span>
          ))}
        </div>
        {rows.map((row, rowIndex) => (
          <div className="heatmap-row" role="row" key={row.day}>
            <span className="heatmap-day-label muted small" role="rowheader">
              {row.day}
            </span>
            {row.hours.map(({ hour, count }) => (
              <div
                key={hour}
                role="cell"
                className="heatmap-cell"
                style={{
                  background: colorFor(count, max),
                  '--i': rowIndex * 24 + hour,
                }}
                title={`${row.day} ${hourLabel(hour)}: ${count} play${count === 1 ? '' : 's'}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-legend muted small">
        <span>Fewer plays</span>
        <span className="heatmap-legend-swatches">
          {SEQUENTIAL_STEPS.filter((_, i) => i % 3 === 0).map((color) => (
            <span key={color} className="heatmap-legend-swatch" style={{ background: color }} />
          ))}
        </span>
        <span>More plays</span>
      </div>
    </div>
  )
}
