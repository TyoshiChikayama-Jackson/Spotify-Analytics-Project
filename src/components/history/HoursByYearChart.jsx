import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { totalHoursByYear } from '../../utils/historyStats.js'
import {
  axisTick,
  axisLine,
  gridStroke,
  tooltipCursor,
  tooltipContentStyle,
  tooltipLabelStyle,
  chartAnimation,
} from '../chartTheme.js'

export default function HoursByYearChart({ entries }) {
  const data = totalHoursByYear(entries)
  if (data.length === 0) return null

  return (
    <div className="chart-block">
      <h3 className="chart-title">Listening hours by year</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis dataKey="year" tick={axisTick} axisLine={axisLine} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            cursor={tooltipCursor}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${Math.round(value).toLocaleString()} hrs`, '']}
          />
          <Bar
            dataKey="hours"
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
