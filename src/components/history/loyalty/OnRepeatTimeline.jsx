import { useEffect, useMemo, useState } from 'react'
import { detectOnRepeatPeriods } from '../../../utils/loyaltyStats.js'
import OnRepeatFilters from './OnRepeatFilters.jsx'
import AddToQueueButton from '../../AddToQueueButton.jsx'

const PAGE_SIZE = 20
const DEFAULT_MIN_PLAYS = 10

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function OnRepeatTimeline({ entries }) {
  const allPeriods = useMemo(() => detectOnRepeatPeriods(entries), [entries])

  const years = useMemo(
    () => [...new Set(allPeriods.map((p) => p.startTimestamp.slice(0, 4)))].sort(),
    [allPeriods],
  )

  const [selectedYear, setSelectedYear] = useState('all')
  const [query, setQuery] = useState('')
  const [sortOrder, setSortOrder] = useState('recent')
  const [minPlays, setMinPlays] = useState(DEFAULT_MIN_PLAYS)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    let result = allPeriods.filter((period) => {
      if (selectedYear !== 'all' && period.startTimestamp.slice(0, 4) !== selectedYear) return false
      if (period.playCount < minPlays) return false
      if (q) {
        const haystack = `${period.trackName ?? ''} ${period.artistName ?? ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })

    result =
      sortOrder === 'intensity'
        ? [...result].sort((a, b) => b.playCount - a.playCount)
        : [...result].sort((a, b) => b.startTimestamp.localeCompare(a.startTimestamp))

    return result
  }, [allPeriods, selectedYear, query, minPlays, sortOrder])

  // Any filter/sort change should reset pagination back to the first batch.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [selectedYear, query, minPlays, sortOrder])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  return (
    <div className="chart-block">
      <h3 className="chart-title">Your on-repeat history</h3>
      <p className="muted small" style={{ marginBottom: '0.75rem' }}>
        Tracks played 10+ times within any 30-day window.
      </p>

      {allPeriods.length === 0 ? (
        <p className="section-state muted">
          No on-repeat obsessions detected yet — nothing has been played 10+ times in a 30-day
          span. This tends to show up once a few years of history are in.
        </p>
      ) : (
        <>
          <OnRepeatFilters
            years={years}
            selectedYear={selectedYear}
            onYearChange={setSelectedYear}
            query={query}
            onQueryChange={setQuery}
            sortOrder={sortOrder}
            onSortOrderChange={setSortOrder}
            minPlays={minPlays}
            onMinPlaysChange={setMinPlays}
          />

          {filtered.length === 0 ? (
            <p className="section-state muted">
              No obsession periods found for{' '}
              {query ? `“${query}”` : selectedYear !== 'all' ? selectedYear : 'these filters'}.
            </p>
          ) : (
            <>
              <p className="muted small" style={{ margin: '0 0 0.5rem' }}>
                Showing {visible.length} of {filtered.length}
              </p>

              <ol className="ranked-list">
                {visible.map((period, index) => (
                  <li
                    key={`${period.trackUri}-${period.startTimestamp}`}
                    className="ranked-item"
                    style={{ '--i': index }}
                  >
                    <span className="rank">{formatDate(period.startTimestamp).split(' ')[0]}</span>
                    <div className="ranked-item-info" style={{ flex: 1 }}>
                      <p className="track-name">{period.trackName}</p>
                      <p className="muted small">{period.artistName}</p>
                    </div>
                    <span
                      className="muted small"
                      style={{ fontFamily: 'var(--font-mono)', textAlign: 'right' }}
                    >
                      {period.playCount} plays
                      <br />
                      {formatDate(period.startTimestamp)} – {formatDate(period.endTimestamp)}
                    </span>
                    <AddToQueueButton trackUri={period.trackUri} trackName={period.trackName} />
                  </li>
                ))}
              </ol>

              {hasMore && (
                <button
                  className="secondary load-more-button"
                  onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                >
                  Load more ({filtered.length - visible.length} remaining)
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
