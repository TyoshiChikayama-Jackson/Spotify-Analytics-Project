import { useMemo } from 'react'
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import {
  skipRateByArtist,
  mostSkippedArtists,
  leastSkippedArtists,
  hasAnySkipSignal,
} from '../../../utils/loyaltyStats.js'
import { axisTick, axisLine, gridStroke, tooltipContentStyle, tooltipLabelStyle } from '../../chartTheme.js'

function ArtistSkipList({ title, items }) {
  return (
    <div>
      <h4 className="chart-title">{title}</h4>
      <ol className="ranked-list">
        {items.map((item, index) => (
          <li key={item.artistName} className="ranked-item" style={{ '--i': index }}>
            <span className="rank">{index + 1}</span>
            <div className="ranked-item-info" style={{ flex: 1 }}>
              <p className="track-name">{item.artistName}</p>
              <p className="muted small">{item.playCount} plays</p>
            </div>
            <span className="muted small" style={{ fontFamily: 'var(--font-mono)' }}>
              {item.skipRate.toFixed(0)}%
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function SkipScatterTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div style={tooltipContentStyle}>
      <div style={tooltipLabelStyle}>{point.artistName}</div>
      <div>{point.playCount} plays</div>
      <div>{point.skipRate.toFixed(1)}% skip rate</div>
    </div>
  )
}

export default function SkipPatternsByArtist({ entries }) {
  const ranked = useMemo(() => skipRateByArtist(entries), [entries])
  const mostSkipped = useMemo(() => mostSkippedArtists(entries), [entries])
  const leastSkipped = useMemo(() => leastSkippedArtists(entries), [entries])
  const usingFallback = useMemo(() => !hasAnySkipSignal(entries), [entries])

  if (ranked.length === 0) {
    return (
      <div className="chart-block">
        <h3 className="chart-title">Skip patterns by artist</h3>
        <p className="section-state muted">
          Not enough plays per artist yet (minimum 10) to calculate meaningful skip rates.
        </p>
      </div>
    )
  }

  return (
    <div className="chart-block">
      <h3 className="chart-title">Skip patterns by artist</h3>
      <p className="muted small" style={{ marginBottom: '0.75rem' }}>
        Artists with at least 10 plays.
        {usingFallback &&
          ' Your export doesn’t include skip data for these plays, so plays under 30 seconds are treated as skips instead.'}
      </p>

      <div className="chart-grid">
        <ArtistSkipList title="Most skipped" items={mostSkipped} />
        <ArtistSkipList title="Least skipped" items={leastSkipped} />
      </div>

      <h4 className="chart-title" style={{ marginTop: '1.25rem' }}>
        Skip rate vs. total plays
      </h4>
      <ResponsiveContainer width="100%" height={260}>
        <ScatterChart margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke={gridStroke} />
          <XAxis
            type="number"
            dataKey="playCount"
            name="Plays"
            tick={axisTick}
            axisLine={axisLine}
            tickLine={false}
            label={{ value: 'Total plays', position: 'insideBottom', offset: -4, fill: 'var(--muted)', fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="skipRate"
            name="Skip rate"
            unit="%"
            domain={[0, 100]}
            tick={axisTick}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip cursor={{ strokeDasharray: '3 3', stroke: 'var(--baseline)' }} content={<SkipScatterTooltip />} />
          <Scatter data={ranked} fill="var(--series-1)" fillOpacity={0.75} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  )
}
