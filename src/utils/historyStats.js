// Pure aggregation helpers over normalized history entries (see
// streamingHistoryParser.js for the entry shape). No React/DOM here so these
// stay easy to reason about independent of the chart components.

const MS_PER_HOUR = 1000 * 60 * 60

export function totalMsPlayed(entries) {
  return entries.reduce((sum, entry) => sum + entry.msPlayed, 0)
}

export function msToHours(ms) {
  return ms / MS_PER_HOUR
}

export function totalHoursByYear(entries) {
  const byYear = new Map()
  entries.forEach((entry) => {
    const year = entry.timestamp.slice(0, 4)
    byYear.set(year, (byYear.get(year) ?? 0) + entry.msPlayed)
  })
  return [...byYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, ms]) => ({ year, hours: msToHours(ms) }))
}

export function mostListenedYear(entries) {
  const byYear = totalHoursByYear(entries)
  if (byYear.length === 0) return null
  return byYear.reduce((best, current) => (current.hours > best.hours ? current : best))
}

// Ranks by total ms_played (not play count), which better reflects listening
// time than a raw tally — a track played to completion 5 times outranks one
// skipped after 3 seconds 20 times.
export function topByMsPlayed(entries, { by, limit = 20 }) {
  const groups = new Map()

  entries.forEach((entry) => {
    const key = by === 'artist' ? entry.artistName : `${entry.trackName}::${entry.artistName}`
    if (!key) return
    const existing = groups.get(key)
    if (existing) {
      existing.msPlayed += entry.msPlayed
      existing.playCount += 1
    } else {
      groups.set(key, {
        name: by === 'artist' ? entry.artistName : entry.trackName,
        artistName: entry.artistName,
        // Only meaningful in track mode — an artist has no single URI.
        trackUri: by === 'artist' ? null : entry.trackUri,
        msPlayed: entry.msPlayed,
        playCount: 1,
      })
    }
  })

  return [...groups.values()].sort((a, b) => b.msPlayed - a.msPlayed).slice(0, limit)
}

// Monthly listening volume across the whole history, for a line/area chart.
export function monthlyListeningVolume(entries) {
  const byMonth = new Map()
  entries.forEach((entry) => {
    const month = entry.timestamp.slice(0, 7) // YYYY-MM
    byMonth.set(month, (byMonth.get(month) ?? 0) + entry.msPlayed)
  })
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, ms]) => ({ month, hours: msToHours(ms) }))
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Day-of-week x hour-of-day play-count grid, flattened to rows for a heatmap.
export function dayHourHeatmap(entries) {
  const grid = Array.from({ length: 7 }, () => new Array(24).fill(0))
  entries.forEach((entry) => {
    const date = new Date(entry.timestamp)
    grid[date.getDay()][date.getHours()] += 1
  })

  return DAY_LABELS.map((day, dayIndex) => ({
    day,
    hours: grid[dayIndex].map((count, hour) => ({ hour, count })),
  }))
}

// Skip rate per month, for entries where `skipped` is populated (older
// exports may have it null throughout — callers should check hasSkipData).
export function hasSkipData(entries) {
  return entries.some((entry) => entry.skipped !== null)
}

export function skipRateByMonth(entries) {
  const byMonth = new Map()
  entries.forEach((entry) => {
    if (entry.skipped === null) return
    const month = entry.timestamp.slice(0, 7)
    const bucket = byMonth.get(month) ?? { skipped: 0, total: 0 }
    bucket.total += 1
    if (entry.skipped) bucket.skipped += 1
    byMonth.set(month, bucket)
  })
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, { skipped, total }]) => ({
      month,
      skipRate: total > 0 ? (skipped / total) * 100 : 0,
    }))
}
