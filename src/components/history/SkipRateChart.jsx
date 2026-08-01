import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { hasSkipData, skipRateByMonth } from '../../utils/historyStats.js'
import {
  axisTick,
  axisLine,
  gridStroke,
  tooltipContentStyle,
  tooltipLabelStyle,
  chartAnimation,
} from '../chartTheme.js'

function formatMonthLabel(month) {
  const [year, monthNum] = month.split('-')
  const date = new Date(Number(year), Number(monthNum) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

export default function SkipRateChart({ entries }) {
  if (!hasSkipData(entries)) return null

  const data = skipRateByMonth(entries).map((point) => ({
    ...point,
    label: formatMonthLabel(point.month),
  }))
  if (data.length === 0) return null

  const tickInterval = data.length > 36 ? Math.ceil(data.length / 18) : 0

  return (
    <div className="chart-block">
      <h3 className="chart-title">Skip rate over time</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={axisLine}
            tickLine={false}
            interval={tickInterval}
          />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={36} unit="%" />
          <Tooltip
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${value.toFixed(1)}%`, 'Skip rate']}
          />
          <Line
            type="monotone"
            dataKey="skipRate"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={false}
            {...chartAnimation}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
