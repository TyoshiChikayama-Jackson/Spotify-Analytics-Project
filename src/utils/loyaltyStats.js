// Obsession & Loyalty aggregations over normalized history entries (see
// streamingHistoryParser.js for the shape). As with habitsStats.js, entries
// from historyStorage.loadHistory() arrive in IndexedDB id-order, not
// chronological order — every function here sorts defensively.

const DAY_MS = 1000 * 60 * 60 * 24

function sortByTimestamp(entries) {
  return [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
}

// ---------------------------------------------------------------------------
// "On Repeat" detection
// ---------------------------------------------------------------------------

const ON_REPEAT_WINDOW_DAYS = 30
const ON_REPEAT_MIN_PLAYS = 10

// Finds "obsession periods": stretches of time where a single track was
// played at least `minPlays` times within any `windowDays`-day span.
//
// Approach: for each track, sort its plays chronologically and slide a
// window over them (two-pointer, O(n) per track) to find every maximal
// span where playCount >= minPlays inside windowDays. Adjacent/overlapping
// qualifying spans for the same track are merged into one period so a
// months-long obsession doesn't fragment into dozens of near-duplicate
// entries — each merged period reports its peak play count.
export function detectOnRepeatPeriods(
  entries,
  { windowDays = ON_REPEAT_WINDOW_DAYS, minPlays = ON_REPEAT_MIN_PLAYS } = {},
) {
  const windowMs = windowDays * DAY_MS
  const byTrack = new Map()

  entries.forEach((entry) => {
    if (!entry.trackUri) return
    if (!byTrack.has(entry.trackUri)) byTrack.set(entry.trackUri, [])
    byTrack.get(entry.trackUri).push(entry)
  })

  const periods = []

  byTrack.forEach((plays) => {
    const sorted = sortByTimestamp(plays)
    const times = sorted.map((p) => new Date(p.timestamp).getTime())

    const qualifyingSpans = []
    let left = 0
    for (let right = 0; right < times.length; right += 1) {
      while (times[right] - times[left] > windowMs) left += 1
      const count = right - left + 1
      if (count >= minPlays) {
        qualifyingSpans.push({ startIndex: left, endIndex: right, count })
      }
    }

    if (qualifyingSpans.length === 0) return

    // Merge overlapping/touching spans (by index range) into periods,
    // keeping the peak play count seen across the merged range.
    let mergedStart = qualifyingSpans[0].startIndex
    let mergedEnd = qualifyingSpans[0].endIndex
    let peakCount = qualifyingSpans[0].count

    function flush() {
      const first = sorted[mergedStart]
      const last = sorted[mergedEnd]
      periods.push({
        trackUri: first.trackUri,
        trackName: first.trackName,
        artistName: first.artistName,
        playCount: peakCount,
        startTimestamp: first.timestamp,
        endTimestamp: last.timestamp,
      })
    }

    for (let i = 1; i < qualifyingSpans.length; i += 1) {
      const span = qualifyingSpans[i]
      if (span.startIndex <= mergedEnd + 1) {
        mergedEnd = Math.max(mergedEnd, span.endIndex)
        peakCount = Math.max(peakCount, span.count)
      } else {
        flush()
        mergedStart = span.startIndex
        mergedEnd = span.endIndex
        peakCount = span.count
      }
    }
    flush()
  })

  return periods.sort((a, b) => a.startTimestamp.localeCompare(b.startTimestamp))
}

// ---------------------------------------------------------------------------
// Artist rise/fall over time
// ---------------------------------------------------------------------------

export function listArtistsByPlayCount(entries) {
  const counts = new Map()
  entries.forEach((entry) => {
    if (!entry.artistName) return
    counts.set(entry.artistName, (counts.get(entry.artistName) ?? 0) + 1)
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([artistName, playCount]) => ({ artistName, playCount }))
}

// Monthly play-volume series for one artist, zero-filled across the full
// span of the artist's activity (first play's month through last play's
// month) so a chart shows the drop to zero rather than just stopping.
export function artistVolumeByMonth(entries, artistName) {
  const plays = entries.filter((entry) => entry.artistName === artistName)
  if (plays.length === 0) return []

  const sorted = sortByTimestamp(plays)
  const counts = new Map()
  sorted.forEach((entry) => {
    const month = entry.timestamp.slice(0, 7)
    counts.set(month, (counts.get(month) ?? 0) + 1)
  })

  const firstMonth = sorted[0].timestamp.slice(0, 7)
  const lastMonth = sorted[sorted.length - 1].timestamp.slice(0, 7)

  const months = []
  let [year, month] = firstMonth.split('-').map(Number)
  const [endYear, endMonth] = lastMonth.split('-').map(Number)
  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`)
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  return months.map((m) => ({ month: m, plays: counts.get(m) ?? 0 }))
}

// ---------------------------------------------------------------------------
// Skip patterns by artist
// ---------------------------------------------------------------------------

const MIN_PLAYS_TO_QUALIFY = 10
// Fallback signal when `skipped` is null: a play cut short at under this
// fraction of a "full" listen is treated as a de facto skip. There's no
// track-length field on a play entry, so this uses an absolute floor
// instead of a per-track ratio — short even by streaming-skip standards.
const SHORT_PLAY_MS_FALLBACK = 30000

function isSkippedPlay(entry) {
  if (entry.skipped !== null) return entry.skipped
  return entry.msPlayed < SHORT_PLAY_MS_FALLBACK
}

export function hasAnySkipSignal(entries) {
  return entries.some((entry) => entry.skipped !== null)
}

// Per-artist skip rate, only for artists with at least `minPlays` plays.
// Uses the real `skipped` field where present, falling back to a
// short-play heuristic per entry where it's null (see isSkippedPlay).
export function skipRateByArtist(entries, { minPlays = MIN_PLAYS_TO_QUALIFY } = {}) {
  const byArtist = new Map()

  entries.forEach((entry) => {
    if (!entry.artistName) return
    const bucket = byArtist.get(entry.artistName) ?? { plays: 0, skips: 0 }
    bucket.plays += 1
    if (isSkippedPlay(entry)) bucket.skips += 1
    byArtist.set(entry.artistName, bucket)
  })

  return [...byArtist.entries()]
    .filter(([, { plays }]) => plays >= minPlays)
    .map(([artistName, { plays, skips }]) => ({
      artistName,
      playCount: plays,
      skipRate: (skips / plays) * 100,
    }))
    .sort((a, b) => b.skipRate - a.skipRate)
}

export function mostSkippedArtists(entries, options) {
  return skipRateByArtist(entries, options).slice(0, 10)
}

export function leastSkippedArtists(entries, options) {
  const ranked = skipRateByArtist(entries, options)
  return [...ranked].sort((a, b) => a.skipRate - b.skipRate).slice(0, 10)
}
