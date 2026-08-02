import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  artistDiscoveryByMonth,
  trackDiscoveryByMonth,
  peakDiscoveryMonth,
} from '../../../utils/habitsStats.js'
import {
  axisTick,
  axisLine,
  gridStroke,
  tooltipCursor,
  tooltipContentStyle,
  tooltipLabelStyle,
  chartAnimation,
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

export default function DiscoveryChart({ entries }) {
  const [mode, setMode] = useState('artists')

  const data = useMemo(() => {
    const raw = mode === 'artists' ? artistDiscoveryByMonth(entries) : trackDiscoveryByMonth(entries)
    return raw.map((point) => ({
      ...point,
      label: formatMonthLabel(point.month),
      familiarCount: point.totalCount - point.newCount,
    }))
  }, [entries, mode])

  const peak = useMemo(() => peakDiscoveryMonth(data), [data])

  if (data.length === 0) return null

  const tickInterval = data.length > 36 ? Math.ceil(data.length / 18) : 0
  const noun = mode === 'artists' ? 'artists' : 'tracks'

  return (
    <div className="chart-block">
      <div className="panel-header">
        <h3 className="chart-title">Discovery rate — {noun}</h3>
        <div className="time-range-toggle">
          <button
            className={`toggle-tab ${mode === 'artists' ? 'active' : ''}`}
            onClick={() => setMode('artists')}
          >
            Artists
          </button>
          <button
            className={`toggle-tab ${mode === 'tracks' ? 'active' : ''}`}
            onClick={() => setMode('tracks')}
          >
            Tracks
          </button>
        </div>
      </div>

      {peak && (
        <p className="muted small" style={{ marginBottom: '0.75rem' }}>
          Peak discovery month: <strong>{formatMonthLabel(peak.month)}</strong> — {peak.newCount} new{' '}
          {noun}
        </p>
      )}

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={axisLine}
            tickLine={false}
            interval={tickInterval}
          />
          <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            cursor={tooltipCursor}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
          />
          <Legend wrapperStyle={legendStyle} iconType="square" iconSize={10} />
          <Bar
            dataKey="newCount"
            name={`New ${noun}`}
            stackId="discovery"
            fill="var(--series-1)"
            {...chartAnimation}
          />
          <Bar
            dataKey="familiarCount"
            name={`Familiar ${noun}`}
            stackId="discovery"
            fill="var(--series-2)"
            radius={[2, 2, 0, 0]}
            {...chartAnimation}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
