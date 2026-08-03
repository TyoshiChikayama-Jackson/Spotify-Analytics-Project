// "More Insights" aggregations over normalized history entries (see
// streamingHistoryParser.js for the entry shape). historyStorage.loadHistory()
// returns entries in IndexedDB id-order, not chronological order — any
// function here that depends on sequence sorts defensively.

import { msToHours, topByMsPlayed } from './historyStats.js'

const DAY_MS = 1000 * 60 * 60 * 24

function sortByTimestamp(entries) {
  return [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

// ---------------------------------------------------------------------------
// Weekday vs. weekend
// ---------------------------------------------------------------------------

function isWeekend(timestamp) {
  const day = new Date(timestamp).getDay()
  return day === 0 || day === 6
}

// Average hours per weekday vs. average hours per weekend day — normalized
// by day count (5 weekdays vs. 2 weekend days per week) so the comparison
// is fair rather than skewed by weekdays simply outnumbering weekend days.
export function weekdayWeekendSplit(entries) {
  if (entries.length === 0) {
    return { avgHoursPerWeekday: 0, avgHoursPerWeekendDay: 0, weekdayArtists: [], weekendArtists: [] }
  }

  const weekdayEntries = []
  const weekendEntries = []
  const weekdayDays = new Set()
  const weekendDays = new Set()

  entries.forEach((entry) => {
    const dayKey = entry.timestamp.slice(0, 10)
    if (isWeekend(entry.timestamp)) {
      weekendEntries.push(entry)
      weekendDays.add(dayKey)
    } else {
      weekdayEntries.push(entry)
      weekdayDays.add(dayKey)
    }
  })

  const weekdayMs = weekdayEntries.reduce((sum, e) => sum + e.msPlayed, 0)
  const weekendMs = weekendEntries.reduce((sum, e) => sum + e.msPlayed, 0)

  return {
    avgHoursPerWeekday: weekdayDays.size > 0 ? msToHours(weekdayMs) / weekdayDays.size : 0,
    avgHoursPerWeekendDay: weekendDays.size > 0 ? msToHours(weekendMs) / weekendDays.size : 0,
    weekdayArtists: topByMsPlayed(weekdayEntries, { by: 'artist', limit: 8 }),
    weekendArtists: topByMsPlayed(weekendEntries, { by: 'artist', limit: 8 }),
  }
}

// ---------------------------------------------------------------------------
// Comeback tracks — inverse of "on repeat": a track played frequently in an
// early period, a long silent gap, then renewed frequent plays.
// ---------------------------------------------------------------------------

// Tuned deliberately stricter than a first pass: at 3 plays/era + 6-month
// gap, nearly every track played more than a handful of times across a
// multi-year history trivially qualifies (verified against a real 7-year,
// 139k-play history — the loose thresholds produced 2,100+ "comebacks",
// which isn't a notable-moments list, it's most of the library). These
// higher bars are meant to surface genuine "forgot about this, then
// rediscovered it" moments, not any track with an idle stretch.
const COMEBACK_MIN_PLAYS_PER_ERA = 5
const COMEBACK_MIN_GAP_DAYS = 270 // ~9 months
// The gap must dominate the track's overall lifespan, and each era must be
// short relative to the gap — together these reject tracks that were just
// played occasionally the whole time (long lifespan, no real "abandonment")
// in favor of true two-burst patterns: a real era, silence, a real revival.
const COMEBACK_MIN_GAP_SHARE_OF_LIFESPAN = 0.55
const COMEBACK_MAX_ERA_SPAN_RATIO = 0.6 // era span <= 60% of the gap length

// For each track with enough plays, finds its largest single gap between
// consecutive plays. If that gap clears the threshold, dominates the
// track's overall lifespan, and has at least minPlaysPerEra tightly
// clustered plays on both sides, it's a comeback: an early era, a long
// silence, and a renewed era.
export function detectComebackTracks(
  entries,
  {
    minGapDays = COMEBACK_MIN_GAP_DAYS,
    minPlaysPerEra = COMEBACK_MIN_PLAYS_PER_ERA,
    minGapShareOfLifespan = COMEBACK_MIN_GAP_SHARE_OF_LIFESPAN,
    maxEraSpanRatio = COMEBACK_MAX_ERA_SPAN_RATIO,
  } = {},
) {
  const byTrack = new Map()
  entries.forEach((entry) => {
    if (!entry.trackUri) return
    if (!byTrack.has(entry.trackUri)) byTrack.set(entry.trackUri, [])
    byTrack.get(entry.trackUri).push(entry)
  })

  const comebacks = []

  byTrack.forEach((plays) => {
    if (plays.length < minPlaysPerEra * 2) return
    const sorted = sortByTimestamp(plays)

    // Find the single largest gap between consecutive plays.
    let largestGap = { days: 0, index: -1 }
    for (let i = 1; i < sorted.length; i += 1) {
      const gapDays =
        (new Date(sorted[i].timestamp).getTime() - new Date(sorted[i - 1].timestamp).getTime()) /
        DAY_MS
      if (gapDays > largestGap.days) largestGap = { days: gapDays, index: i }
    }

    if (largestGap.days < minGapDays) return

    const firstEra = sorted.slice(0, largestGap.index)
    const comebackEra = sorted.slice(largestGap.index)
    if (firstEra.length < minPlaysPerEra || comebackEra.length < minPlaysPerEra) return

    const lifespanDays =
      (new Date(sorted[sorted.length - 1].timestamp).getTime() -
        new Date(sorted[0].timestamp).getTime()) /
      DAY_MS
    if (lifespanDays <= 0 || largestGap.days / lifespanDays < minGapShareOfLifespan) return

    const firstEraSpanDays =
      (new Date(firstEra[firstEra.length - 1].timestamp).getTime() -
        new Date(firstEra[0].timestamp).getTime()) /
      DAY_MS
    const comebackEraSpanDays =
      (new Date(comebackEra[comebackEra.length - 1].timestamp).getTime() -
        new Date(comebackEra[0].timestamp).getTime()) /
      DAY_MS
    const maxAllowedEraSpan = largestGap.days * maxEraSpanRatio
    if (firstEraSpanDays > maxAllowedEraSpan || comebackEraSpanDays > maxAllowedEraSpan) return

    comebacks.push({
      trackUri: sorted[0].trackUri,
      trackName: sorted[0].trackName,
      artistName: sorted[0].artistName,
      firstEraStart: firstEra[0].timestamp,
      firstEraEnd: firstEra[firstEra.length - 1].timestamp,
      firstEraPlays: firstEra.length,
      gapDays: largestGap.days,
      comebackEraStart: comebackEra[0].timestamp,
      comebackEraEnd: comebackEra[comebackEra.length - 1].timestamp,
      comebackEraPlays: comebackEra.length,
    })
  })

  return comebacks.sort((a, b) => b.gapDays - a.gapDays)
}

// ---------------------------------------------------------------------------
// Listening chronotype
// ---------------------------------------------------------------------------

const CHRONOTYPE_WINDOWS = [
  { label: 'Night Owl', startHour: 0, endHour: 6 },
  { label: 'Early Bird', startHour: 6, endHour: 12 },
  { label: 'Afternoon Listener', startHour: 12, endHour: 18 },
  { label: 'Evening Listener', startHour: 18, endHour: 24 },
]

function classifyChronotype(entries) {
  if (entries.length === 0) return null
  const counts = new Array(CHRONOTYPE_WINDOWS.length).fill(0)

  entries.forEach((entry) => {
    const hour = new Date(entry.timestamp).getHours()
    const windowIndex = CHRONOTYPE_WINDOWS.findIndex((w) => hour >= w.startHour && hour < w.endHour)
    if (windowIndex !== -1) counts[windowIndex] += 1
  })

  const total = counts.reduce((sum, c) => sum + c, 0)
  if (total === 0) return null

  let bestIndex = 0
  for (let i = 1; i < counts.length; i += 1) {
    if (counts[i] > counts[bestIndex]) bestIndex = i
  }

  return {
    label: CHRONOTYPE_WINDOWS[bestIndex].label,
    share: (counts[bestIndex] / total) * 100,
  }
}

// All-time chronotype plus one per year, so callers can show "you were X in
// 2022, became Y by 2024" without recomputing per-year grouping themselves.
export function chronotypeByYear(entries) {
  const allTime = classifyChronotype(entries)

  const byYear = new Map()
  entries.forEach((entry) => {
    const year = entry.timestamp.slice(0, 4)
    if (!byYear.has(year)) byYear.set(year, [])
    byYear.get(year).push(entry)
  })

  const years = [...byYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, yearEntries]) => ({ year, chronotype: classifyChronotype(yearEntries) }))
    .filter((y) => y.chronotype !== null)

  return { allTime, years }
}

// ---------------------------------------------------------------------------
// Mainstream vs. deep-cuts score
// ---------------------------------------------------------------------------

// Spotify track URIs look like "spotify:track:<id>" — the id is what the
// GET /tracks batch endpoint and the popularity cache key on.
export function trackIdFromUri(trackUri) {
  if (!trackUri) return null
  const parts = trackUri.split(':')
  return parts.length === 3 ? parts[2] : null
}

export function distinctTrackIds(entries) {
  const ids = new Set()
  entries.forEach((entry) => {
    const id = trackIdFromUri(entry.trackUri)
    if (id) ids.add(id)
  })
  return [...ids]
}

// popularityById: Map<trackId, 0-100>. Only entries whose track has a
// cached popularity score contribute — callers should surface how much
// coverage there is (see coverage below) since a large uncached remainder
// would make the average misleading.
export function mainstreamScoreSummary(entries, popularityById) {
  let sumPopularity = 0
  let scoredPlays = 0
  const trackScores = new Map() // trackId -> { trackName, artistName, popularity }

  entries.forEach((entry) => {
    const id = trackIdFromUri(entry.trackUri)
    if (!id) return
    const popularity = popularityById.get(id)
    if (popularity === undefined) return

    sumPopularity += popularity
    scoredPlays += 1

    if (!trackScores.has(id)) {
      trackScores.set(id, {
        trackName: entry.trackName,
        artistName: entry.artistName,
        popularity,
      })
    }
  })

  const distinctScoredTracks = trackScores.size
  const distinctTotalTracks = distinctTrackIds(entries).length

  return {
    averagePopularity: scoredPlays > 0 ? sumPopularity / scoredPlays : null,
    coverage: distinctTotalTracks > 0 ? distinctScoredTracks / distinctTotalTracks : 0,
    mostMainstream: [...trackScores.values()].sort((a, b) => b.popularity - a.popularity).slice(0, 10),
    deepestCuts: [...trackScores.values()].sort((a, b) => a.popularity - b.popularity).slice(0, 10),
  }
}

export function mainstreamScoreByYear(entries, popularityById) {
  const byYear = new Map()
  entries.forEach((entry) => {
    const id = trackIdFromUri(entry.trackUri)
    if (!id) return
    const popularity = popularityById.get(id)
    if (popularity === undefined) return

    const year = entry.timestamp.slice(0, 4)
    const bucket = byYear.get(year) ?? { sum: 0, count: 0 }
    bucket.sum += popularity
    bucket.count += 1
    byYear.set(year, bucket)
  })

  return [...byYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, { sum, count }]) => ({ year, averagePopularity: count > 0 ? sum / count : 0 }))
}

// ---------------------------------------------------------------------------
// Milestone / fun facts
// ---------------------------------------------------------------------------

export function milestoneFacts(entries) {
  if (entries.length === 0) return null

  const totalMs = entries.reduce((sum, e) => sum + e.msPlayed, 0)
  const totalHours = msToHours(totalMs)
  const totalDays = totalHours / 24

  const topTrack = topByMsPlayed(entries, { by: 'track', limit: 1 })[0] ?? null

  // Most total plays for a single track (play count, not listening time —
  // a distinct signal from topByMsPlayed's time-based ranking).
  const trackPlayCounts = new Map()
  entries.forEach((entry) => {
    if (!entry.trackUri) return
    const bucket = trackPlayCounts.get(entry.trackUri) ?? {
      trackName: entry.trackName,
      artistName: entry.artistName,
      playCount: 0,
    }
    bucket.playCount += 1
    trackPlayCounts.set(entry.trackUri, bucket)
  })
  let mostPlayedTrack = null
  trackPlayCounts.forEach((bucket) => {
    if (!mostPlayedTrack || bucket.playCount > mostPlayedTrack.playCount) mostPlayedTrack = bucket
  })

  // Track played the most times in a single calendar day.
  const trackDayCounts = new Map() // "trackUri::day" -> count
  entries.forEach((entry) => {
    if (!entry.trackUri) return
    const key = `${entry.trackUri}::${entry.timestamp.slice(0, 10)}`
    const bucket = trackDayCounts.get(key) ?? {
      trackName: entry.trackName,
      artistName: entry.artistName,
      day: entry.timestamp.slice(0, 10),
      playCount: 0,
    }
    bucket.playCount += 1
    trackDayCounts.set(key, bucket)
  })
  let busiestTrackDay = null
  trackDayCounts.forEach((bucket) => {
    if (!busiestTrackDay || bucket.playCount > busiestTrackDay.playCount) busiestTrackDay = bucket
  })

  const distinctArtists = new Set(entries.map((e) => e.artistName).filter(Boolean)).size
  const distinctTracks = new Set(entries.map((e) => e.trackUri).filter(Boolean)).size

  return {
    totalHours,
    totalDaysEquivalent: totalDays,
    topTrackByTime: topTrack && { name: topTrack.name, artistName: topTrack.artistName },
    mostPlayedTrack,
    busiestTrackDay,
    distinctArtists,
    distinctTracks,
  }
}
