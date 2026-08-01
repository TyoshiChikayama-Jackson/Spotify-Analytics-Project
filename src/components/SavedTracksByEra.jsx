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

function decadeLabel(releaseDate) {
  const year = Number.parseInt(releaseDate?.slice(0, 4), 10)
  if (!Number.isFinite(year)) return null
  const decade = Math.floor(year / 10) * 10
  return `${decade}s`
}

function buildDecadeData(items) {
  const counts = new Map()
  items.forEach(({ track }) => {
    const label = decadeLabel(track?.album?.release_date)
    if (!label) return
    counts.set(label, (counts.get(label) ?? 0) + 1)
  })
  return [...counts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([decade, count]) => ({ decade, count }))
}

export default function SavedTracksByEra({ items }) {
  const data = buildDecadeData(items)

  if (data.length === 0) return null

  return (
    <div className="chart-block">
      <h3 className="chart-title">Saved tracks by decade</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis dataKey="decade" tick={axisTick} axisLine={axisLine} tickLine={false} />
          <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            cursor={tooltipCursor}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${value} track${value === 1 ? '' : 's'}`, '']}
          />
          <Bar
            dataKey="count"
            fill="var(--accent)"
            radius={[2, 2, 0, 0]}
            maxBarSize={40}
            {...chartAnimation}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
