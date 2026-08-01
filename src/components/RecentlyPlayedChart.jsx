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

const HOUR_LABELS = Array.from({ length: 24 }, (_, hour) => {
  const suffix = hour < 12 ? 'a' : 'p'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}${suffix}`
})

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function buildHourlyData(items) {
  const counts = new Array(24).fill(0)
  items.forEach((item) => {
    const hour = new Date(item.played_at).getHours()
    counts[hour] += 1
  })
  return counts.map((count, hour) => ({ label: HOUR_LABELS[hour], count }))
}

function buildDailyData(items) {
  const counts = new Array(7).fill(0)
  items.forEach((item) => {
    const day = new Date(item.played_at).getDay()
    counts[day] += 1
  })
  return counts.map((count, day) => ({ label: DAY_LABELS[day], count }))
}

function ActivityChart({ title, data }) {
  return (
    <div className="chart-block">
      <h3 className="chart-title">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={axisLine}
            tickLine={false}
            interval={title.includes('Hour') ? 2 : 0}
          />
          <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            cursor={tooltipCursor}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${value} play${value === 1 ? '' : 's'}`, '']}
          />
          <Bar
            dataKey="count"
            fill="var(--accent)"
            radius={[2, 2, 0, 0]}
            maxBarSize={28}
            {...chartAnimation}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function RecentlyPlayedChart({ items }) {
  const hourly = buildHourlyData(items)
  const daily = buildDailyData(items)

  return (
    <div className="chart-grid">
      <ActivityChart title="Plays by hour of day" data={hourly} />
      <ActivityChart title="Plays by day of week" data={daily} />
    </div>
  )
}
