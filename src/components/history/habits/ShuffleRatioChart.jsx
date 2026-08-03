import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { shuffleRatioByMonth } from '../../../utils/habitsStats.js'
import {
  axisTick,
  axisLine,
  gridStroke,
  tooltipContentStyle,
  tooltipLabelStyle,
  chartAnimation,
  xAxisAngledProps,
  chartMarginAngled,
} from '../../chartTheme.js'

function formatMonthLabel(month) {
  const [year, monthNum] = month.split('-')
  const date = new Date(Number(year), Number(monthNum) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

export default function ShuffleRatioChart({ entries }) {
  const data = shuffleRatioByMonth(entries).map((point) => ({
    ...point,
    label: formatMonthLabel(point.month),
  }))
  if (data.length === 0) return null

  const tickInterval = data.length > 36 ? Math.ceil(data.length / 18) : 0

  return (
    <div className="chart-block">
      <h3 className="chart-title">Shuffle vs. deliberate listening</h3>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={chartMarginAngled}>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={axisLine}
            tickLine={false}
            interval={tickInterval}
            {...xAxisAngledProps}
          />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={36} unit="%" domain={[0, 100]} />
          <Tooltip
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${value.toFixed(1)}%`, 'Shuffled']}
          />
          <Line
            type="monotone"
            dataKey="shufflePercent"
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
