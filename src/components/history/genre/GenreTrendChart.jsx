import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { genreTrendByYear, topGenreNames } from '../../../utils/genreAnalysis.js'
import {
  axisTick,
  axisLine,
  gridStroke,
  tooltipCursor,
  tooltipContentStyle,
  tooltipLabelStyle,
  chartAnimation,
} from '../../chartTheme.js'

// Stepped shades of the single chart-data hue, same approach as
// PlatformBreakdown — reads as one cohesive scale rather than a per-category
// rainbow, and holds up regardless of which genres happen to be top-ranked.
const SHADE_MIX = [0, 18, 36, 52, 68, 82]

function shadeFor(index) {
  const mix = SHADE_MIX[index] ?? 82
  return mix === 0 ? 'var(--series-1)' : `color-mix(in srgb, var(--series-1) ${100 - mix}%, var(--surface-1))`
}

const legendStyle = {
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-secondary)',
}

export default function GenreTrendChart({ entries, nameToGenres }) {
  const genres = topGenreNames(entries, nameToGenres, { topN: 6 })
  const data = genreTrendByYear(entries, nameToGenres, { topN: 6 })

  if (genres.length === 0 || data.length < 2) {
    return (
      <div className="chart-block">
        <h3 className="chart-title">Top genres by year</h3>
        <p className="section-state muted">Not enough resolved genre data yet.</p>
      </div>
    )
  }

  return (
    <div className="chart-block">
      <h3 className="chart-title">Top genres by year</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis dataKey="year" tick={axisTick} axisLine={axisLine} tickLine={false} />
          <YAxis tick={axisTick} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            cursor={tooltipCursor}
            contentStyle={tooltipContentStyle}
            labelStyle={tooltipLabelStyle}
            formatter={(value) => [`${Math.round(value).toLocaleString()} hrs`, '']}
          />
          <Legend wrapperStyle={legendStyle} iconType="square" iconSize={10} />
          {genres.map((genre, index) => (
            <Bar
              key={genre}
              dataKey={genre}
              stackId="genre"
              fill={shadeFor(index)}
              radius={index === genres.length - 1 ? [2, 2, 0, 0] : 0}
              {...chartAnimation}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
