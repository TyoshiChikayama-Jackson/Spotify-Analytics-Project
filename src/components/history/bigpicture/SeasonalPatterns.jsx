import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { topArtistsBySeason, averageHoursByCalendarMonth } from '../../../utils/bigPictureStats.js'
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

const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall']

export default function SeasonalPatterns({ entries }) {
  const bySeason = useMemo(() => topArtistsBySeason(entries, { limit: 5 }), [entries])
  const monthlyAverages = useMemo(() => averageHoursByCalendarMonth(entries), [entries])

  const hasAnySeasonData = SEASONS.some((season) => bySeason[season].length > 0)
  if (!hasAnySeasonData) return null

  return (
    <div className="chart-block">
      <h3 className="chart-title">Seasonal listening patterns</h3>

      <h4 className="chart-title">Average hours by month (all years)</h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={monthlyAverages} margin={chartMarginAngled}>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis
            dataKey="month"
            tick={axisTick}
            axisLine={axisLine}
            tickLine={false}
            {...xAxisAngledProps}
          />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            cursor={tooltipCursor}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${value.toFixed(1)} hrs avg`, '']}
          />
          <Bar
            dataKey="averageHours"
            fill="var(--series-1)"
            radius={[2, 2, 0, 0]}
            maxBarSize={36}
            {...chartAnimation}
          />
        </BarChart>
      </ResponsiveContainer>

      <h4 className="chart-title" style={{ marginTop: '1.25rem' }}>
        Top artists by season
      </h4>
      <div className="season-grid">
        {SEASONS.map((season) => (
          <div className="season-card" key={season}>
            <span className="season-card-title">{season}</span>
            {bySeason[season].length === 0 ? (
              <p className="muted small">No data yet.</p>
            ) : (
              <ol className="season-artist-list">
                {bySeason[season].map((artist) => (
                  <li key={artist.name}>{artist.name}</li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
