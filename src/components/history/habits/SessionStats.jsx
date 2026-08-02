import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { detectSessions, sessionSummary, sessionLengthHistogram } from '../../../utils/habitsStats.js'
import AnimatedNumber from '../../AnimatedNumber.jsx'
import {
  axisTick,
  axisLine,
  gridStroke,
  tooltipCursor,
  tooltipContentStyle,
  tooltipLabelStyle,
  chartAnimation,
} from '../../chartTheme.js'

function formatMinutes(minutes) {
  if (minutes < 60) return `${Math.round(minutes)} min`
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  return `${hours}h ${rest}m`
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function SessionStats({ entries }) {
  const sessions = useMemo(() => detectSessions(entries), [entries])
  const summary = useMemo(() => sessionSummary(sessions), [sessions])
  const histogram = useMemo(() => sessionLengthHistogram(sessions), [sessions])

  if (summary.sessionCount === 0) return null

  return (
    <div className="chart-block">
      <h3 className="chart-title">Listening sessions</h3>
      <div className="highlight-grid">
        <div className="highlight-tile">
          <span className="stat-value">
            <AnimatedNumber value={summary.sessionCount} />
          </span>
          <span className="muted small">Total sessions</span>
        </div>
        <div className="highlight-tile">
          <span className="stat-value">
            <AnimatedNumber
              value={Math.round(summary.averageMinutes)}
              format={(n) => formatMinutes(n)}
            />
          </span>
          <span className="muted small">Average session length</span>
        </div>
        <div className="highlight-tile">
          <span className="stat-value">{formatMinutes(summary.longest.durationMinutes)}</span>
          <span className="muted small">
            Longest session · {formatDate(summary.longest.startTimestamp)} ·{' '}
            {summary.longest.trackCount} track{summary.longest.trackCount === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      <h4 className="chart-title" style={{ marginTop: '1.25rem' }}>
        Session length distribution
      </h4>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={histogram} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis dataKey="label" tick={axisTick} axisLine={axisLine} tickLine={false} />
          <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            cursor={tooltipCursor}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${value} session${value === 1 ? '' : 's'}`, '']}
          />
          <Bar
            dataKey="count"
            fill="var(--series-1)"
            radius={[2, 2, 0, 0]}
            maxBarSize={48}
            {...chartAnimation}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
