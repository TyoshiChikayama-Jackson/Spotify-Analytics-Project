import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  detectInstantReplays,
  instantReplaysByMonth,
  topInstantReplayTracks,
} from '../../../utils/behaviorStats.js'
import {
  axisTick,
  axisLine,
  gridStroke,
  tooltipCursor,
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

export default function InstantReplays({ entries }) {
  const events = useMemo(() => detectInstantReplays(entries), [entries])
  const monthly = useMemo(
    () => instantReplaysByMonth(events).map((p) => ({ ...p, label: formatMonthLabel(p.month) })),
    [events],
  )
  const topTracks = useMemo(() => topInstantReplayTracks(events, { limit: 10 }), [events])

  if (events.length === 0) {
    return (
      <div className="chart-block">
        <h3 className="chart-title">Instant replays</h3>
        <p className="section-state muted">
          No instant replays detected — no track was played again within 2 tracks of itself
          finishing.
        </p>
      </div>
    )
  }

  const tickInterval = monthly.length > 36 ? Math.ceil(monthly.length / 18) : 0

  return (
    <div className="chart-block">
      <h3 className="chart-title">Instant replays</h3>
      <p className="muted small" style={{ marginBottom: '0.75rem' }}>
        Same track played again within 2 tracks of it finishing —{' '}
        <strong>{events.length.toLocaleString()}</strong> total.
      </p>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={monthly} margin={chartMarginAngled}>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis
            dataKey="label"
            tick={axisTick}
            axisLine={axisLine}
            tickLine={false}
            interval={tickInterval}
            {...xAxisAngledProps}
          />
          <YAxis allowDecimals={false} tick={axisTick} axisLine={false} tickLine={false} width={28} />
          <Tooltip
            cursor={tooltipCursor}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${value} replay${value === 1 ? '' : 's'}`, '']}
          />
          <Bar dataKey="count" fill="var(--series-1)" radius={[2, 2, 0, 0]} maxBarSize={36} {...chartAnimation} />
        </BarChart>
      </ResponsiveContainer>

      <h4 className="chart-title" style={{ marginTop: '1.25rem' }}>
        Most instant-replayed tracks
      </h4>
      <ol className="ranked-list">
        {topTracks.map((track, index) => (
          <li key={`${track.trackName}-${track.artistName}`} className="ranked-item" style={{ '--i': index }}>
            <span className="rank">{index + 1}</span>
            <div className="ranked-item-info" style={{ flex: 1 }}>
              <p className="track-name">{track.trackName}</p>
              <p className="muted small">{track.artistName}</p>
            </div>
            <span className="muted small" style={{ fontFamily: 'var(--font-mono)' }}>
              {track.count}×
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
