import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { monthlyListeningVolume } from '../../utils/historyStats.js'
import {
  axisTick,
  axisLine,
  gridStroke,
  tooltipContentStyle,
  tooltipLabelStyle,
  chartAnimation,
  xAxisAngledProps,
  chartMarginAngled,
} from '../chartTheme.js'

function formatMonthLabel(month) {
  const [year, monthNum] = month.split('-')
  const date = new Date(Number(year), Number(monthNum) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

export default function ListeningOverTimeChart({ entries }) {
  const data = monthlyListeningVolume(entries).map((point) => ({
    ...point,
    label: formatMonthLabel(point.month),
  }))
  if (data.length === 0) return null

  // Thin the x-axis so labels don't collide when spanning many years.
  const tickInterval = data.length > 36 ? Math.ceil(data.length / 18) : 0

  return (
    <div className="chart-block">
      <h3 className="chart-title">Listening activity over time</h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={chartMarginAngled}>
          <defs>
            <linearGradient id="listeningVolumeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={axisLine}
            tickLine={false}
            interval={tickInterval}
            {...xAxisAngledProps}
          />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${Math.round(value).toLocaleString()} hrs`, '']}
          />
          <Area
            type="monotone"
            dataKey="hours"
            stroke="var(--series-1)"
            strokeWidth={2}
            fill="url(#listeningVolumeFill)"
            {...chartAnimation}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
