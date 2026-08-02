import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { diversityScoreByYear, mostDiverseYear, mostConcentratedYear } from '../../../utils/behaviorStats.js'
import { axisTick, axisLine, gridStroke, tooltipCursor, tooltipContentStyle, tooltipLabelStyle, chartAnimation } from '../../chartTheme.js'

export default function DiversityScore({ entries }) {
  const data = useMemo(() => diversityScoreByYear(entries), [entries])
  const diverse = useMemo(() => mostDiverseYear(data), [data])
  const concentrated = useMemo(() => mostConcentratedYear(data), [data])

  if (data.length === 0) return null

  return (
    <div className="chart-block">
      <h3 className="chart-title">Listening diversity by year</h3>
      <p className="muted small" style={{ marginBottom: '0.75rem' }}>
        The share of that year's artists needed to account for half your plays. Higher = plays
        spread across many artists; lower = concentrated on a few favorites.
      </p>

      <div className="highlight-grid" style={{ marginBottom: '1rem' }}>
        {diverse && (
          <div className="highlight-tile">
            <span className="stat-value">{diverse.year}</span>
            <span className="muted small">Most diverse ({diverse.diversityScore.toFixed(1)}%)</span>
          </div>
        )}
        {concentrated && (
          <div className="highlight-tile">
            <span className="stat-value">{concentrated.year}</span>
            <span className="muted small">
              Most concentrated ({concentrated.diversityScore.toFixed(1)}%)
            </span>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis dataKey="year" tick={axisTick} axisLine={axisLine} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={36} unit="%" />
          <Tooltip
            cursor={tooltipCursor}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${value.toFixed(1)}%`, 'Diversity score']}
          />
          <Bar
            dataKey="diversityScore"
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
