import { useMemo } from 'react'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import {
  backButtonRateByMonth,
  hasReliableBackButtonData,
  mostRewoundTracks,
} from '../../../utils/behaviorStats.js'
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

export default function BackButtonUsage({ entries }) {
  const reliable = useMemo(() => hasReliableBackButtonData(entries), [entries])
  const data = useMemo(
    () => backButtonRateByMonth(entries).map((p) => ({ ...p, label: formatMonthLabel(p.month) })),
    [entries],
  )
  const rewound = useMemo(() => mostRewoundTracks(entries, { limit: 8 }), [entries])

  if (!reliable) {
    return (
      <div className="chart-block">
        <h3 className="chart-title">Back-button usage</h3>
        <p className="section-state muted">
          This export has no back-button events recorded — skipping rather than showing a
          misleading number.
        </p>
      </div>
    )
  }

  const tickInterval = data.length > 36 ? Math.ceil(data.length / 18) : 0

  return (
    <div className="chart-block">
      <h3 className="chart-title">Back-button usage</h3>
      <p className="muted small" style={{ marginBottom: '0.75rem' }}>
        Share of plays started by pressing back to a previous track.
      </p>

      <ResponsiveContainer width="100%" height={220}>
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
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={36} unit="%" />
          <Tooltip
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${value.toFixed(1)}%`, 'Back rate']}
          />
          <Line
            type="monotone"
            dataKey="backRate"
            stroke="var(--series-1)"
            strokeWidth={2}
            dot={false}
            {...chartAnimation}
          />
        </LineChart>
      </ResponsiveContainer>

      {rewound.length > 0 && (
        <>
          <h4 className="chart-title" style={{ marginTop: '1.25rem' }}>
            Most rewound tracks
          </h4>
          <ol className="ranked-list">
            {rewound.map((track, index) => (
              <li key={`${track.trackName}-${track.artistName}`} className="ranked-item" style={{ '--i': index }}>
                <span className="rank">{index + 1}</span>
                <div className="ranked-item-info" style={{ flex: 1 }}>
                  <p className="track-name">{track.trackName}</p>
                  <p className="muted small">{track.artistName}</p>
                </div>
                <span className="muted small" style={{ fontFamily: 'var(--font-mono)' }}>
                  {track.backPlays} of {track.plays} plays
                </span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
