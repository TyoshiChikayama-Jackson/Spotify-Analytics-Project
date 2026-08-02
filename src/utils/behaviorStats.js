// Listening Behavior, Diversity & Growth aggregations over normalized
// history entries (see streamingHistoryParser.js for the shape). As with
// habitsStats.js/loyaltyStats.js/bigPictureStats.js, entries from
// historyStorage.loadHistory() arrive in IndexedDB id-order, not
// chronological order — every function here sorts defensively.
//
// IMPORTANT — reason_start/reason_end classification is grounded in the
// actual distinct values observed in this project's real imported export
// (140,138 music entries, checked directly against the raw JSON before
// writing this file), not assumed from Spotify documentation:
//
//   reason_start: trackdone (61135), fwdbtn (46392), clickrow (23962),
//     appload (2963), backbtn (2771), playbtn (2559), trackerror (387),
//     remote (332), unknown (251), switched-to-audio (2)
//   reason_end:   trackdone (59637), fwdbtn (46145), endplay (26355),
//     backbtn (2752), logout (2724), unexpected-exit-while-paused (2409),
//     remote (299), trackerror (216), unexpected-exit (129), unknown (88)
//
// There is no explicit "autoplay" value in this export version. The closest
// available passive/continuation signal is reason_start === 'trackdone'
// (the previous track finished and this one began without the user acting).
// Everything else that represents an actual user action at start
// (clickrow, playbtn, remote, fwdbtn, backbtn) is treated as deliberate.
// 'appload', 'trackerror', 'unknown', and 'switched-to-audio' are excluded
// from the ratio entirely — none of them cleanly signal "chosen" vs.
// "continued," so folding them into either bucket would misrepresent them.

const DAY_MS = 1000 * 60 * 60 * 24

function sortByTimestamp(entries) {
  return [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

// ---------------------------------------------------------------------------
// Autoplay vs. deliberate listening
// ---------------------------------------------------------------------------

const DELIBERATE_START_REASONS = new Set(['clickrow', 'playbtn', 'remote', 'fwdbtn', 'backbtn'])
const PASSIVE_START_REASONS = new Set(['trackdone'])

function classifyStart(reasonStart) {
  if (DELIBERATE_START_REASONS.has(reasonStart)) return 'deliberate'
  if (PASSIVE_START_REASONS.has(reasonStart)) return 'passive'
  return null // excluded — reason doesn't cleanly signal either way
}

// True only if the export's reason_start values actually contain enough of
// the classifiable set to make the ratio meaningful — an export where every
// entry's reason_start is 'unknown' or missing would otherwise silently
// render a 0%/0% chart. Components should check this before rendering.
export function hasReliableStartReasonData(entries) {
  const classifiable = entries.filter((e) => classifyStart(e.reasonStart) !== null)
  return entries.length > 0 && classifiable.length / entries.length >= 0.3
}

export function autoplayRatioByMonth(entries) {
  const byMonth = new Map()
  entries.forEach((entry) => {
    const kind = classifyStart(entry.reasonStart)
    if (!kind) return
    const month = entry.timestamp.slice(0, 7)
    const bucket = byMonth.get(month) ?? { deliberate: 0, passive: 0 }
    bucket[kind] += 1
    byMonth.set(month, bucket)
  })
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, { deliberate, passive }]) => {
      const total = deliberate + passive
      return {
        month,
        deliberatePercent: total > 0 ? (deliberate / total) * 100 : 0,
        passivePercent: total > 0 ? (passive / total) * 100 : 0,
      }
    })
}

// ---------------------------------------------------------------------------
// Instant replays — same track played again with at most `maxGapTracks`
// other plays in between (a much tighter signal than the 30-day on-repeat
// window in loyaltyStats.js).
// ---------------------------------------------------------------------------

const INSTANT_REPLAY_MAX_GAP_TRACKS = 2

export function detectInstantReplays(entries, { maxGapTracks = INSTANT_REPLAY_MAX_GAP_TRACKS } = {}) {
  const sorted = sortByTimestamp(entries)
  const events = []

  for (let i = 0; i < sorted.length; i += 1) {
    const current = sorted[i]
    if (!current.trackUri) continue

    for (let gap = 1; gap <= maxGapTracks + 1; gap += 1) {
      const candidate = sorted[i + gap]
      if (!candidate) break
      if (candidate.trackUri === current.trackUri) {
        events.push({
          trackUri: current.trackUri,
          trackName: current.trackName,
          artistName: current.artistName,
          timestamp: candidate.timestamp,
          tracksBetween: gap - 1,
        })
        break // count only the nearest repeat after this play, not every gap size
      }
    }
  }

  return events
}

export function instantReplaysByMonth(events) {
  const byMonth = new Map()
  events.forEach((event) => {
    const month = event.timestamp.slice(0, 7)
    byMonth.set(month, (byMonth.get(month) ?? 0) + 1)
  })
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({ month, count }))
}

export function topInstantReplayTracks(events, { limit = 10 } = {}) {
  const counts = new Map()
  events.forEach((event) => {
    const existing = counts.get(event.trackUri)
    if (existing) {
      existing.count += 1
    } else {
      counts.set(event.trackUri, {
        trackName: event.trackName,
        artistName: event.artistName,
        count: 1,
      })
    }
  })
  return [...counts.values()].sort((a, b) => b.count - a.count).slice(0, limit)
}

// ---------------------------------------------------------------------------
// Back-button usage
// ---------------------------------------------------------------------------

export function hasReliableBackButtonData(entries) {
  return entries.some((entry) => entry.reasonStart === 'backbtn')
}

export function backButtonRateByMonth(entries) {
  const byMonth = new Map()
  entries.forEach((entry) => {
    const month = entry.timestamp.slice(0, 7)
    const bucket = byMonth.get(month) ?? { back: 0, total: 0 }
    bucket.total += 1
    if (entry.reasonStart === 'backbtn') bucket.back += 1
    byMonth.set(month, bucket)
  })
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, { back, total }]) => ({
      month,
      backRate: total > 0 ? (back / total) * 100 : 0,
    }))
}

const MIN_PLAYS_FOR_REWIND_RANKING = 5

export function mostRewoundTracks(entries, { limit = 10, minPlays = MIN_PLAYS_FOR_REWIND_RANKING } = {}) {
  const byTrack = new Map()
  entries.forEach((entry) => {
    if (!entry.trackUri) return
    const bucket = byTrack.get(entry.trackUri) ?? {
      trackName: entry.trackName,
      artistName: entry.artistName,
      plays: 0,
      backPlays: 0,
    }
    bucket.plays += 1
    if (entry.reasonStart === 'backbtn') bucket.backPlays += 1
    byTrack.set(entry.trackUri, bucket)
  })

  return [...byTrack.values()]
    .filter((t) => t.plays >= minPlays && t.backPlays > 0)
    .map((t) => ({ ...t, backRate: (t.backPlays / t.plays) * 100 }))
    .sort((a, b) => b.backPlays - a.backPlays)
    .slice(0, limit)
}

// ---------------------------------------------------------------------------
// Listening diversity score over time
// ---------------------------------------------------------------------------

// Simple, explainable diversity measure: the smallest number of distinct
// artists whose combined plays account for at least half of that year's
// total plays — expressed as a percentage of that year's total distinct
// artist count. A low percentage means listening was concentrated on a
// handful of artists; a high percentage means plays were spread broadly.
export function diversityScoreByYear(entries) {
  const byYear = new Map()
  entries.forEach((entry) => {
    if (!entry.artistName) return
    const year = entry.timestamp.slice(0, 4)
    if (!byYear.has(year)) byYear.set(year, new Map())
    const artistCounts = byYear.get(year)
    artistCounts.set(entry.artistName, (artistCounts.get(entry.artistName) ?? 0) + 1)
  })

  return [...byYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, artistCounts]) => {
      const totalPlays = [...artistCounts.values()].reduce((sum, c) => sum + c, 0)
      const sortedCounts = [...artistCounts.values()].sort((a, b) => b - a)
      const distinctArtists = sortedCounts.length

      let running = 0
      let artistsForHalf = 0
      for (const count of sortedCounts) {
        running += count
        artistsForHalf += 1
        if (running >= totalPlays / 2) break
      }

      return {
        year,
        distinctArtists,
        artistsForHalfOfPlays: artistsForHalf,
        diversityScore: distinctArtists > 0 ? (artistsForHalf / distinctArtists) * 100 : 0,
      }
    })
}

export function mostDiverseYear(diversityData) {
  if (diversityData.length === 0) return null
  return diversityData.reduce((best, cur) => (cur.diversityScore > best.diversityScore ? cur : best))
}

export function mostConcentratedYear(diversityData) {
  if (diversityData.length === 0) return null
  return diversityData.reduce((best, cur) => (cur.diversityScore < best.diversityScore ? cur : best))
}

// ---------------------------------------------------------------------------
// Album loyalty
// ---------------------------------------------------------------------------

// No track-number/tracklist-order field exists in this export format, so
// "full-album listening" is approximated: within ALBUM_SESSION_GAP_MINUTES
// of each other, how many *distinct* tracks from the same album were
// played? Albums/artists where sessions repeatedly pull in several distinct
// tracks close together score as "album listener" behavior; ones where the
// artist is only ever heard one track at a time score as "singles" behavior.
const ALBUM_SESSION_GAP_MINUTES = 20

export function albumLoyaltyScores(entries, { minAlbumPlays = 5 } = {}) {
  const sorted = sortByTimestamp(entries)
  const gapMs = ALBUM_SESSION_GAP_MINUTES * 60 * 1000

  const byAlbum = new Map() // "artist::album" -> { artistName, albumName, plays, sessionRuns: [Set] }

  let i = 0
  while (i < sorted.length) {
    const entry = sorted[i]
    if (!entry.albumName || !entry.artistName) {
      i += 1
      continue
    }
    const key = `${entry.artistName}::${entry.albumName}`
    if (!byAlbum.has(key)) {
      byAlbum.set(key, { artistName: entry.artistName, albumName: entry.albumName, plays: 0, runs: [] })
    }
    const bucket = byAlbum.get(key)
    bucket.plays += 1

    // Walk forward collecting a "session run" of same-album plays within
    // the gap window, tracking distinct tracks seen in that run.
    const runTracks = new Set([entry.trackUri])
    let j = i + 1
    let lastTime = new Date(entry.timestamp).getTime()
    while (j < sorted.length) {
      const next = sorted[j]
      const nextTime = new Date(next.timestamp).getTime()
      if (nextTime - lastTime > gapMs) break
      if (next.artistName === entry.artistName && next.albumName === entry.albumName) {
        runTracks.add(next.trackUri)
        lastTime = nextTime
        j += 1
      } else {
        break
      }
    }
    bucket.runs.push(runTracks.size)
    i = j > i ? j : i + 1
  }

  return [...byAlbum.values()]
    .filter((a) => a.plays >= minAlbumPlays)
    .map((a) => {
      const avgDistinctPerRun = a.runs.reduce((sum, n) => sum + n, 0) / a.runs.length
      const multiTrackRunRatio = a.runs.filter((n) => n > 1).length / a.runs.length
      return {
        artistName: a.artistName,
        albumName: a.albumName,
        plays: a.plays,
        avgDistinctTracksPerSession: avgDistinctPerRun,
        albumListenerScore: multiTrackRunRatio * 100,
      }
    })
    .sort((a, b) => b.albumListenerScore - a.albumListenerScore)
}

export function topAlbumListenerAlbums(entries, options) {
  return albumLoyaltyScores(entries, options)
    .filter((a) => a.albumListenerScore > 0)
    .slice(0, 10)
}

export function topSinglesArtists(entries, options) {
  return albumLoyaltyScores(entries, options)
    .filter((a) => a.albumListenerScore === 0)
    .sort((a, b) => b.plays - a.plays)
    .slice(0, 10)
}

// ---------------------------------------------------------------------------
// Cumulative growth curves
// ---------------------------------------------------------------------------

// Cumulative distinct-tracks and distinct-artists counts, sampled monthly,
// for a "library growth" line chart.
export function cumulativeGrowthByMonth(entries) {
  const sorted = sortByTimestamp(entries)
  const seenTracks = new Set()
  const seenArtists = new Set()
  const byMonth = new Map()

  sorted.forEach((entry) => {
    if (entry.trackUri) seenTracks.add(entry.trackUri)
    if (entry.artistName) seenArtists.add(entry.artistName)
    const month = entry.timestamp.slice(0, 7)
    byMonth.set(month, { tracks: seenTracks.size, artists: seenArtists.size })
  })

  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, { tracks, artists }]) => ({
      month,
      cumulativeTracks: tracks,
      cumulativeArtists: artists,
    }))
}

// ---------------------------------------------------------------------------
// Most improved artist (year-over-year)
// ---------------------------------------------------------------------------

export function mostImprovedArtists(entries, { limit = 5 } = {}) {
  const byArtistYear = new Map() // artistName -> Map(year -> playCount)

  entries.forEach((entry) => {
    if (!entry.artistName) return
    const year = entry.timestamp.slice(0, 4)
    if (!byArtistYear.has(entry.artistName)) byArtistYear.set(entry.artistName, new Map())
    const yearMap = byArtistYear.get(entry.artistName)
    yearMap.set(year, (yearMap.get(year) ?? 0) + 1)
  })

  const improvements = []
  byArtistYear.forEach((yearMap, artistName) => {
    const years = [...yearMap.keys()].sort()
    for (let i = 1; i < years.length; i += 1) {
      const prevPlays = yearMap.get(years[i - 1])
      const currPlays = yearMap.get(years[i])
      improvements.push({
        artistName,
        fromYear: years[i - 1],
        toYear: years[i],
        fromPlays: prevPlays,
        toPlays: currPlays,
        delta: currPlays - prevPlays,
      })
    }
  })

  return improvements.sort((a, b) => b.delta - a.delta).slice(0, limit)
}
