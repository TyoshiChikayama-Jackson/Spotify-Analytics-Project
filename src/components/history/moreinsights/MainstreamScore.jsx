import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getTrackPopularityBatch } from '../../../api/spotifyData.js'
import { loadCachedPopularity, saveCachedPopularity } from '../../../utils/historyStorage.js'
import {
  distinctTrackIds,
  mainstreamScoreSummary,
  mainstreamScoreByYear,
} from '../../../utils/moreInsightsStats.js'
import {
  axisTick,
  axisLine,
  gridStroke,
  tooltipContentStyle,
  tooltipLabelStyle,
  chartAnimation,
} from '../../chartTheme.js'

const BATCH_SIZE = 50

function TrackScoreList({ title, tracks }) {
  return (
    <div>
      <h4 className="chart-title">{title}</h4>
      <ol className="ranked-list">
        {tracks.map((track, index) => (
          <li key={`${track.trackName}-${track.artistName}`} className="ranked-item" style={{ '--i': index }}>
            <span className="rank">{index + 1}</span>
            <div className="ranked-item-info" style={{ flex: 1 }}>
              <p className="track-name">{track.trackName}</p>
              <p className="muted small">{track.artistName}</p>
            </div>
            <span className="muted small" style={{ fontFamily: 'var(--font-mono)' }}>
              {track.popularity}
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function MainstreamScore({ entries }) {
  const [popularityById, setPopularityById] = useState(null)
  const [progress, setProgress] = useState(null) // { done, total } while fetching
  const [error, setError] = useState(null)

  const allTrackIds = useMemo(() => distinctTrackIds(entries), [entries])

  const run = useCallback(async () => {
    setError(null)
    setPopularityById(null)

    try {
      const cached = await loadCachedPopularity(allTrackIds)
      const missing = allTrackIds.filter((id) => !cached.has(id))

      if (missing.length === 0) {
        setPopularityById(cached)
        return
      }

      setProgress({ done: 0, total: missing.length })
      const combined = new Map(cached)

      for (let i = 0; i < missing.length; i += BATCH_SIZE) {
        const batch = missing.slice(i, i + BATCH_SIZE)
        const result = await getTrackPopularityBatch(batch)
        const tracks = result?.tracks ?? []

        const toCache = []
        tracks.forEach((track) => {
          if (!track) return // Spotify returns null for unavailable/invalid ids
          combined.set(track.id, track.popularity)
          toCache.push([track.id, track.popularity])
        })
        if (toCache.length > 0) await saveCachedPopularity(toCache)

        setProgress({ done: Math.min(i + BATCH_SIZE, missing.length), total: missing.length })
      }

      setPopularityById(combined)
    } catch (err) {
      console.error('Mainstream score lookup failed:', err)
      setError(err.message)
    } finally {
      setProgress(null)
    }
  }, [allTrackIds])

  // Auto-run once on mount using whatever's already cached — if everything
  // needed is cached this resolves instantly with no visible fetch step.
  useEffect(() => {
    if (allTrackIds.length > 0) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allTrackIds.length])

  const summary = useMemo(
    () => (popularityById ? mainstreamScoreSummary(entries, popularityById) : null),
    [entries, popularityById],
  )
  const yearlyTrend = useMemo(
    () =>
      popularityById
        ? mainstreamScoreByYear(entries, popularityById).map((p) => ({ ...p, label: p.year }))
        : [],
    [entries, popularityById],
  )

  if (allTrackIds.length === 0) return null

  return (
    <div className="chart-block">
      <div className="panel-header">
        <h3 className="chart-title">Mainstream vs. deep cuts</h3>
        {!progress && (
          <button className="secondary refresh-button" onClick={run}>
            Recheck
          </button>
        )}
      </div>
      <p className="muted small" style={{ marginBottom: '0.75rem' }}>
        Based on each track's current Spotify popularity score (0–100). Looked up once per
        track and cached locally — later visits reuse the cache instead of re-fetching.
      </p>

      {progress && (
        <div className="mainstream-progress">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
          <p className="muted small">
            Fetching popularity for tracks not yet cached — {progress.done.toLocaleString()} of{' '}
            {progress.total.toLocaleString()} ({Math.ceil(progress.total / BATCH_SIZE)} requests
            total). This only happens once per track; safe to leave this tab open.
          </p>
        </div>
      )}

      {error && <p className="error playback-note">{error}</p>}

      {!progress && summary && (
        <>
          {summary.coverage < 0.5 && (
            <p className="muted small" style={{ marginBottom: '0.75rem' }}>
              Only {(summary.coverage * 100).toFixed(0)}% of your distinct tracks have a cached
              popularity score so far — click Recheck to fetch the rest.
            </p>
          )}

          <div className="highlight-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="highlight-tile">
              <span className="stat-value">
                {summary.averagePopularity !== null ? summary.averagePopularity.toFixed(0) : '—'}
              </span>
              <span className="muted small">Average mainstream score (0–100)</span>
            </div>
          </div>

          {yearlyTrend.length > 1 && (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={yearlyTrend} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="mainstreamFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--series-1)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--series-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={gridStroke} />
                <XAxis dataKey="label" tick={axisTick} axisLine={axisLine} tickLine={false} />
                <YAxis domain={[0, 100]} tick={axisTick} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={tooltipContentStyle}
                  labelStyle={tooltipLabelStyle}
                  formatter={(value) => [value.toFixed(0), 'Avg. popularity']}
                />
                <Area
                  type="monotone"
                  dataKey="averagePopularity"
                  stroke="var(--series-1)"
                  strokeWidth={2}
                  fill="url(#mainstreamFill)"
                  {...chartAnimation}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {(summary.mostMainstream.length > 0 || summary.deepestCuts.length > 0) && (
            <div className="chart-grid" style={{ marginTop: '1.25rem' }}>
              <TrackScoreList title="Most mainstream tracks you played" tracks={summary.mostMainstream} />
              <TrackScoreList title="Deepest cuts" tracks={summary.deepestCuts} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
