import { useMemo } from 'react'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  detectGenreSwitches,
  genreSwitchesPerSession,
  genreSwitchRateByYear,
} from '../../../utils/genreAnalysis.js'
import AnimatedNumber from '../../AnimatedNumber.jsx'
import {
  axisTick,
  axisLine,
  gridStroke,
  tooltipContentStyle,
  tooltipLabelStyle,
  chartAnimation,
} from '../../chartTheme.js'

export default function GenreSwitchingStats({ entries, nameToGenres }) {
  const overall = useMemo(() => detectGenreSwitches(entries, nameToGenres), [entries, nameToGenres])
  const perSession = useMemo(
    () => genreSwitchesPerSession(entries, nameToGenres),
    [entries, nameToGenres],
  )
  const trend = useMemo(() => genreSwitchRateByYear(entries, nameToGenres), [entries, nameToGenres])

  if (overall.comparedPlays === 0) {
    return (
      <div className="chart-block">
        <h3 className="chart-title">Genre switching</h3>
        <p className="section-state muted">Not enough resolved genre data yet.</p>
      </div>
    )
  }

  return (
    <div className="chart-block">
      <h3 className="chart-title">Genre switching</h3>

      <div className="highlight-grid">
        <div className="highlight-tile">
          <span className="stat-value">
            <AnimatedNumber value={perSession.averagePerSession} format={(n) => n.toFixed(1)} />
          </span>
          <span className="muted small">Genre switches per average session</span>
        </div>
        <div className="highlight-tile">
          <span className="stat-value">
            <AnimatedNumber value={overall.totalSwitches} />
          </span>
          <span className="muted small">Total genre switches, all time</span>
        </div>
        <div className="highlight-tile">
          <span className="stat-value">
            <AnimatedNumber value={perSession.sessionCount} />
          </span>
          <span className="muted small">Sessions analyzed</span>
        </div>
      </div>

      {trend.length > 1 && (
        <>
          <h4 className="chart-title" style={{ marginTop: '1.25rem' }}>
            Switching rate by year
          </h4>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} stroke={gridStroke} />
              <XAxis dataKey="year" tick={axisTick} axisLine={axisLine} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
                formatter={(value) => [`${value.toFixed(1)} per session`, 'Genre switches']}
              />
              <Line
                type="monotone"
                dataKey="averagePerSession"
                stroke="var(--series-1)"
                strokeWidth={2}
                dot={false}
                {...chartAnimation}
              />
            </LineChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
