import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { topGenresAllTime } from '../../../utils/genreAnalysis.js'
import {
  axisTick,
  axisLine,
  gridStroke,
  tooltipCursor,
  tooltipContentStyle,
  tooltipLabelStyle,
  chartAnimation,
} from '../../chartTheme.js'

export default function TopGenresAllTime({ entries, nameToGenres }) {
  const data = topGenresAllTime(entries, nameToGenres, { limit: 12 })

  if (data.length === 0) {
    return (
      <div className="chart-block">
        <h3 className="chart-title">Top genres, all time</h3>
        <p className="section-state muted">Not enough resolved genre data yet.</p>
      </div>
    )
  }

  return (
    <div className="chart-block">
      <h3 className="chart-title">Top genres, all time</h3>
      <ResponsiveContainer width="100%" height={Math.max(220, data.length * 32)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 8 }}>
          <CartesianGrid horizontal={false} stroke={gridStroke} />
          <XAxis type="number" tick={axisTick} axisLine={axisLine} tickLine={false} />
          <YAxis
            type="category"
            dataKey="genre"
            tick={{ ...axisTick, fill: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={130}
          />
          <Tooltip
            cursor={tooltipCursor}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${Math.round(value).toLocaleString()} hrs`, '']}
          />
          <Bar
            dataKey="hours"
            fill="var(--series-1)"
            radius={[0, 2, 2, 0]}
            maxBarSize={20}
            {...chartAnimation}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
