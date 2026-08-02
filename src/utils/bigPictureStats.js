// Bigger Picture / Year in Review aggregations over normalized history
// entries (see streamingHistoryParser.js for the shape). As with
// habitsStats.js and loyaltyStats.js, entries from
// historyStorage.loadHistory() arrive in IndexedDB id-order, not
// chronological order — every function here sorts defensively.

import { topByMsPlayed, totalHoursByYear, msToHours } from './historyStats.js'

const DAY_MS = 1000 * 60 * 60 * 24

function sortByTimestamp(entries) {
  return [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

// ---------------------------------------------------------------------------
// Year in Review
// ---------------------------------------------------------------------------

// One summary per calendar year present in the history: top artist/track by
// listening time (reusing topByMsPlayed from historyStats.js rather than
// re-deriving the same ranking), total hours, distinct artist count, and
// the month with the most listening hours that year.
export function yearInReviewSummaries(entries, { now = new Date() } = {}) {
  const byYear = new Map()
  entries.forEach((entry) => {
    const year = entry.timestamp.slice(0, 4)
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year).push(entry)
  })

  const currentYear = String(now.getFullYear())

  return [...byYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, yearEntries]) => {
      const topTrack = topByMsPlayed(yearEntries, { by: 'track', limit: 1 })[0] ?? null
      const topArtist = topByMsPlayed(yearEntries, { by: 'artist', limit: 1 })[0] ?? null
      const totalHours = msToHours(yearEntries.reduce((sum, e) => sum + e.msPlayed, 0))
      const distinctArtists = new Set(yearEntries.map((e) => e.artistName).filter(Boolean)).size

      const monthlyHours = new Map()
      yearEntries.forEach((entry) => {
        const month = entry.timestamp.slice(0, 7)
        monthlyHours.set(month, (monthlyHours.get(month) ?? 0) + entry.msPlayed)
      })
      const standoutMonthEntry = [...monthlyHours.entries()].reduce(
        (best, current) => (current[1] > best[1] ? current : best),
        ['', 0],
      )

      return {
        year,
        isPartial: year === currentYear,
        topTrack: topTrack && { name: topTrack.name, artistName: topTrack.artistName },
        topArtist: topArtist && { name: topArtist.name },
        totalHours,
        distinctArtists,
        standoutMonth: standoutMonthEntry[0] || null,
      }
    })
}

// Exposed separately in case a component wants raw year/hours pairs without
// the rest of the summary (e.g. for a small trend sparkline).
export { totalHoursByYear }

// ---------------------------------------------------------------------------
// Longest gap without listening
// ---------------------------------------------------------------------------

const MIN_PLAYS_BEFORE_GAP_TO_COUNT = 3

// Finds the largest gaps between consecutive plays. The very first gap
// (before the account's first-ever play) isn't a gap at all and is never
// included by construction (gaps are computed between play N and N+1).
// Additionally, if the *history's opening plays* look like an account-setup
// blip — fewer than MIN_PLAYS_BEFORE_GAP_TO_COUNT plays before the first
// large gap — that leading gap is dropped from the top-N list, since it more
// likely reflects "signed up, didn't really start using it yet" than a real
// listening break. This is a heuristic, not a certainty; see summary notes.
export function longestListeningGaps(entries, { limit = 5 } = {}) {
  if (entries.length < 2) return []

  const sorted = sortByTimestamp(entries)
  const gaps = []

  for (let i = 1; i < sorted.length; i += 1) {
    const prevEnd = new Date(sorted[i - 1].timestamp).getTime()
    const nextStart = new Date(sorted[i].timestamp).getTime() - sorted[i].msPlayed
    const gapMs = nextStart - prevEnd
    if (gapMs > 0) {
      gaps.push({
        gapDays: gapMs / DAY_MS,
        startTimestamp: sorted[i - 1].timestamp,
        endTimestamp: sorted[i].timestamp,
        playsBeforeGap: i, // count of plays in `sorted` prior to this gap
      })
    }
  }

  // Only the single largest gap is eligible for the setup-blip exclusion —
  // a smaller gap with few preceding plays elsewhere in the timeline (e.g.
  // a brief lapse mid-history) is a real gap, not an account-setup artifact.
  gaps.sort((a, b) => b.gapDays - a.gapDays)
  const isLargestGapSetupBlip =
    gaps.length > 0 && gaps[0].playsBeforeGap < MIN_PLAYS_BEFORE_GAP_TO_COUNT
  const eligible = isLargestGapSetupBlip ? gaps.slice(1) : gaps

  return eligible.slice(0, limit).map(({ playsBeforeGap, ...gap }) => gap)
}

// ---------------------------------------------------------------------------
// Seasonal listening patterns
// ---------------------------------------------------------------------------

const SEASON_BY_MONTH = {
  12: 'Winter',
  1: 'Winter',
  2: 'Winter',
  3: 'Spring',
  4: 'Spring',
  5: 'Spring',
  6: 'Summer',
  7: 'Summer',
  8: 'Summer',
  9: 'Fall',
  10: 'Fall',
  11: 'Fall',
}

const SEASONS = ['Winter', 'Spring', 'Summer', 'Fall']

function seasonForTimestamp(timestamp) {
  const month = Number(timestamp.slice(5, 7))
  return SEASON_BY_MONTH[month]
}

// Top artists per season, combining every year's data into one "all
// summers," "all winters," etc. bucket — ranked by total ms_played like the
// other top-artist views in this app, not raw play count.
export function topArtistsBySeason(entries, { limit = 5 } = {}) {
  const bySeason = Object.fromEntries(SEASONS.map((s) => [s, []]))

  entries.forEach((entry) => {
    const season = seasonForTimestamp(entry.timestamp)
    if (season) bySeason[season].push(entry)
  })

  return Object.fromEntries(
    SEASONS.map((season) => [season, topByMsPlayed(bySeason[season], { by: 'artist', limit })]),
  )
}

// Average listening hours per calendar month, across all years combined —
// for a "does listening rhythm repeat every year" chart. Uses average
// rather than sum so a history with more full years for some months than
// others (e.g. mid-year import) isn't skewed toward over-represented months.
export function averageHoursByCalendarMonth(entries) {
  const MONTH_LABELS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]

  // month (1-12) -> Map(year -> total ms that year/month)
  const perMonthYearMs = new Map(MONTH_LABELS.map((_, i) => [i + 1, new Map()]))

  entries.forEach((entry) => {
    const year = entry.timestamp.slice(0, 4)
    const month = Number(entry.timestamp.slice(5, 7))
    const yearMap = perMonthYearMs.get(month)
    yearMap.set(year, (yearMap.get(year) ?? 0) + entry.msPlayed)
  })

  return MONTH_LABELS.map((label, index) => {
    const yearMap = perMonthYearMs.get(index + 1)
    const totalHours = [...yearMap.values()].reduce((sum, ms) => sum + msToHours(ms), 0)
    const yearCount = yearMap.size
    return {
      month: label,
      averageHours: yearCount > 0 ? totalHours / yearCount : 0,
    }
  })
}
