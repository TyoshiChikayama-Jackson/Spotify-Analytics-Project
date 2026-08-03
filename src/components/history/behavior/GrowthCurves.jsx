import { Legend, Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cumulativeGrowthByMonth } from '../../../utils/behaviorStats.js'
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

const legendStyle = {
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-secondary)',
}

export default function GrowthCurves({ entries }) {
  const data = cumulativeGrowthByMonth(entries).map((point) => ({
    ...point,
    label: formatMonthLabel(point.month),
  }))

  if (data.length === 0) return null

  const tickInterval = data.length > 36 ? Math.ceil(data.length / 18) : 0

  return (
    <div className="chart-block">
      <h3 className="chart-title">Library growth</h3>
      <p className="muted small" style={{ marginBottom: '0.75rem' }}>
        Cumulative distinct tracks and artists ever played.
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ ...chartMarginAngled, left: -8 }}>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={axisLine}
            tickLine={false}
            interval={tickInterval}
            {...xAxisAngledProps}
          />
          <YAxis
            allowDecimals={false}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={44}
          />
          <Tooltip contentStyle={tooltipContentStyle} labelStyle={tooltipLabelStyle} />
          <Legend wrapperStyle={legendStyle} iconType="plainline" />
          <Line
            type="monotone"
            dataKey="cumulativeTracks"
            name="Distinct tracks"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={false}
            {...chartAnimation}
          />
          <Line
            type="monotone"
            dataKey="cumulativeArtists"
            name="Distinct artists"
            stroke="var(--series-2)"
            strokeWidth={2}
            dot={false}
            {...chartAnimation}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
