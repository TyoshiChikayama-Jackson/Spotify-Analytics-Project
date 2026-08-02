import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { platformBreakdownAllTime, platformBreakdownByYear } from '../../../utils/habitsStats.js'
import {
  axisTick,
  axisLine,
  gridStroke,
  tooltipCursor,
  tooltipContentStyle,
  tooltipLabelStyle,
  chartAnimation,
} from '../../chartTheme.js'

// Categorical slots 1/2/3 from the validated palette (blue/orange/aqua),
// plus the neutral muted tone for "Other/Unknown" — kept distinct from the
// single-hue accent used for bar/line magnitude charts elsewhere.
const CATEGORY_COLORS = {
  Mobile: 'var(--series-1)',
  Desktop: 'var(--accent)',
  Web: '#1baf7a',
  'Other/Unknown': 'var(--muted)',
}

const legendStyle = {
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-secondary)',
}

export default function PlatformBreakdown({ entries }) {
  const allTime = platformBreakdownAllTime(entries)
  const byYear = platformBreakdownByYear(entries)
  const totalPlays = allTime.reduce((sum, row) => sum + row.count, 0)

  if (allTime.length === 0) return null

  return (
    <div className="chart-block">
      <h3 className="chart-title">Platform breakdown</h3>

      <ol className="ranked-list" style={{ marginBottom: '1.25rem' }}>
        {allTime.map((row, index) => (
          <li key={row.category} className="ranked-item" style={{ '--i': index }}>
            <span
              className="platform-swatch"
              style={{ background: CATEGORY_COLORS[row.category] ?? 'var(--muted)' }}
            />
            <div className="ranked-item-info" style={{ flex: 1 }}>
              <p className="track-name">{row.category}</p>
            </div>
            <span className="muted small" style={{ fontFamily: 'var(--font-mono)' }}>
              {row.count.toLocaleString()} · {((row.count / totalPlays) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ol>

      {byYear.length > 1 && (
        <>
          <h4 className="chart-title">Platform mix by year</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byYear} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
              <CartesianGrid vertical={false} stroke={gridStroke} />
              <XAxis dataKey="year" tick={axisTick} axisLine={axisLine} tickLine={false} />
              <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                cursor={tooltipCursor}
                contentStyle={tooltipContentStyle}
                labelStyle={tooltipLabelStyle}
              />
              <Legend wrapperStyle={legendStyle} iconType="square" iconSize={10} />
              {Object.keys(CATEGORY_COLORS).map((category, index, all) => (
                <Bar
                  key={category}
                  dataKey={category}
                  stackId="platform"
                  fill={CATEGORY_COLORS[category]}
                  radius={index === all.length - 1 ? [2, 2, 0, 0] : 0}
                  {...chartAnimation}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}
