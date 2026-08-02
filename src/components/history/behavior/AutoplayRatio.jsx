import { useMemo } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { autoplayRatioByMonth, hasReliableStartReasonData } from '../../../utils/behaviorStats.js'
import { axisTick, axisLine, gridStroke, tooltipContentStyle, tooltipLabelStyle, chartAnimation } from '../../chartTheme.js'

function formatMonthLabel(month) {
  const [year, monthNum] = month.split('-')
  const date = new Date(Number(year), Number(monthNum) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
}

export default function AutoplayRatio({ entries }) {
  const reliable = useMemo(() => hasReliableStartReasonData(entries), [entries])
  const data = useMemo(
    () => autoplayRatioByMonth(entries).map((p) => ({ ...p, label: formatMonthLabel(p.month) })),
    [entries],
  )

  if (!reliable) {
    return (
      <div className="chart-block">
        <h3 className="chart-title">Autoplay vs. deliberate listening</h3>
        <p className="section-state muted">
          This export doesn't include enough usable start-reason data to calculate a reliable
          ratio — skipping rather than showing a misleading number.
        </p>
      </div>
    )
  }

  if (data.length === 0) return null

  const tickInterval = data.length > 36 ? Math.ceil(data.length / 18) : 0

  return (
    <div className="chart-block">
      <h3 className="chart-title">Autoplay vs. deliberate listening</h3>
      <p className="muted small" style={{ marginBottom: '0.75rem' }}>
        Deliberate = you clicked, pressed play, or skipped forward/back. Passive = the previous
        track just finished and this one continued on its own.
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <defs>
            <linearGradient id="deliberateFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis dataKey="label" tick={axisTick} axisLine={axisLine} tickLine={false} interval={tickInterval} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={36} unit="%" domain={[0, 100]} />
          <Tooltip
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${value.toFixed(1)}%`, 'Deliberate']}
          />
          <Area
            type="monotone"
            dataKey="deliberatePercent"
            stroke="var(--series-1)"
            strokeWidth={2}
            fill="url(#deliberateFill)"
            {...chartAnimation}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
