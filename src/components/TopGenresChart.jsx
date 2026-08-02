import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  axisTick,
  axisLine,
  gridStroke,
  tooltipCursor,
  tooltipContentStyle,
  tooltipLabelStyle,
  chartAnimation,
} from './chartTheme.js'

function buildGenreCounts(artists, topN = 10) {
  const counts = new Map()
  artists.forEach((artist) => {
    ;(artist.genres ?? []).forEach((genre) => {
      counts.set(genre, (counts.get(genre) ?? 0) + 1)
    })
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([genre, count]) => ({ genre, count }))
}

export default function TopGenresChart({ artists }) {
  const data = buildGenreCounts(artists)

  if (data.length === 0) return null

  return (
    <div className="chart-block">
      <h3 className="chart-title">Top genres</h3>
      <ResponsiveContainer width="100%" height={Math.max(200, data.length * 32)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 0, left: 8 }}
        >
          <CartesianGrid horizontal={false} stroke={gridStroke} />
          <XAxis type="number" allowDecimals={false} tick={axisTick} axisLine={axisLine} tickLine={false} />
          <YAxis
            type="category"
            dataKey="genre"
            tick={{ ...axisTick, fill: 'var(--text-secondary)', fontFamily: 'var(--font-sans)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            cursor={tooltipCursor}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${value} artist${value === 1 ? '' : 's'}`, '']}
          />
          <Bar
            dataKey="count"
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
