import { useMemo, useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { listArtistsByPlayCount, artistVolumeByMonth } from '../../../utils/loyaltyStats.js'
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

export default function ArtistRiseFallChart({ entries }) {
  const artists = useMemo(() => listArtistsByPlayCount(entries), [entries])
  const [selected, setSelected] = useState(artists[0]?.artistName ?? '')
  const [query, setQuery] = useState('')

  const filteredArtists = useMemo(() => {
    if (!query.trim()) return artists.slice(0, 25)
    const q = query.toLowerCase()
    return artists.filter((a) => a.artistName.toLowerCase().includes(q)).slice(0, 25)
  }, [artists, query])

  const data = useMemo(() => {
    if (!selected) return []
    return artistVolumeByMonth(entries, selected).map((point) => ({
      ...point,
      label: formatMonthLabel(point.month),
    }))
  }, [entries, selected])

  if (artists.length === 0) return null

  const tickInterval = data.length > 36 ? Math.ceil(data.length / 18) : 0

  return (
    <div className="chart-block">
      <h3 className="chart-title">Artist rise &amp; fall</h3>

      <div className="artist-selector">
        <input
          type="text"
          className="artist-search-input"
          placeholder="Search artists…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="artist-select"
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
        >
          {!filteredArtists.some((a) => a.artistName === selected) && selected && (
            <option value={selected}>{selected}</option>
          )}
          {filteredArtists.map((artist) => (
            <option key={artist.artistName} value={artist.artistName}>
              {artist.artistName} ({artist.playCount} plays)
            </option>
          ))}
        </select>
      </div>

      {data.length === 0 ? (
        <p className="section-state muted">Select an artist to see their play history.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={chartMarginAngled}>
            <defs>
              <linearGradient id="artistVolumeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.3} />
                <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              contentStyle={tooltipContentStyle}
              labelStyle={tooltipLabelStyle}
              formatter={(value) => [`${value} play${value === 1 ? '' : 's'}`, '']}
            />
            <Area
              type="monotone"
              dataKey="plays"
              stroke="var(--series-1)"
              strokeWidth={2}
              fill="url(#artistVolumeFill)"
              {...chartAnimation}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
