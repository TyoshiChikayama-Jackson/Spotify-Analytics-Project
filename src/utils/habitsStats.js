// Habits & Patterns aggregations over normalized history entries (see
// streamingHistoryParser.js for the shape). historyStorage.loadHistory()
// returns entries in IndexedDB primary-key (id) order, not chronological
// order — functions here that depend on sequence (streaks, sessions) sort
// defensively rather than trusting caller order.

const DAY_MS = 1000 * 60 * 60 * 24
const DEFAULT_SESSION_GAP_MINUTES = 30

function dayKey(isoTimestamp) {
  return isoTimestamp.slice(0, 10) // YYYY-MM-DD
}

// ---------------------------------------------------------------------------
// Listening streaks
// ---------------------------------------------------------------------------

// Longest and current run of consecutive calendar days with at least one
// play. "Current" only counts as active if the most recent play was today
// or yesterday (relative to `now`, injectable for testing).
export function listeningStreaks(entries, { now = new Date() } = {}) {
  if (entries.length === 0) {
    return { longest: null, current: null }
  }

  // Day keys sort correctly as strings (YYYY-MM-DD), so no Date parsing needed here.
  const uniqueDays = [...new Set(entries.map((entry) => dayKey(entry.timestamp)))].sort()

  let longest = { length: 1, startDay: uniqueDays[0], endDay: uniqueDays[0] }
  let runStart = uniqueDays[0]
  let runLength = 1

  for (let i = 1; i < uniqueDays.length; i += 1) {
    const prevDate = new Date(`${uniqueDays[i - 1]}T00:00:00Z`)
    const currDate = new Date(`${uniqueDays[i]}T00:00:00Z`)
    const dayGap = Math.round((currDate - prevDate) / DAY_MS)

    if (dayGap === 1) {
      runLength += 1
    } else {
      runStart = uniqueDays[i]
      runLength = 1
    }

    if (runLength > longest.length) {
      longest = { length: runLength, startDay: runStart, endDay: uniqueDays[i] }
    }
  }

  const lastDay = uniqueDays[uniqueDays.length - 1]
  const todayKey = dayKey(now.toISOString())
  const yesterdayKey = dayKey(new Date(now.getTime() - DAY_MS).toISOString())
  const isActive = lastDay === todayKey || lastDay === yesterdayKey

  let current = null
  if (isActive) {
    // Walk backward from the last played day counting the consecutive run.
    let length = 1
    for (let i = uniqueDays.length - 1; i > 0; i -= 1) {
      const prevDate = new Date(`${uniqueDays[i - 1]}T00:00:00Z`)
      const currDate = new Date(`${uniqueDays[i]}T00:00:00Z`)
      const dayGap = Math.round((currDate - prevDate) / DAY_MS)
      if (dayGap === 1) {
        length += 1
      } else {
        break
      }
    }
    current = { length, startDay: uniqueDays[uniqueDays.length - length], endDay: lastDay }
  }

  return { longest, current }
}

// ---------------------------------------------------------------------------
// Session detection
// ---------------------------------------------------------------------------

// Groups plays into sessions: a new session starts whenever the gap between
// one play's end (ts, since ts marks when the track finished) and the next
// play's start (approximated as its ts minus its own msPlayed) exceeds
// gapMinutes. Returns raw session objects so callers can derive whatever
// stats they need without re-walking the entry list.
export function detectSessions(entries, { gapMinutes = DEFAULT_SESSION_GAP_MINUTES } = {}) {
  if (entries.length === 0) return []

  const gapMs = gapMinutes * 60 * 1000
  const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const sessions = []
  let current = null

  sorted.forEach((entry) => {
    const endMs = new Date(entry.timestamp).getTime()
    const startMs = endMs - entry.msPlayed

    if (current && startMs - current.lastEndMs <= gapMs) {
      current.entries.push(entry)
      current.lastEndMs = Math.max(current.lastEndMs, endMs)
    } else {
      current = { entries: [entry], firstStartMs: startMs, lastEndMs: endMs }
      sessions.push(current)
    }
  })

  return sessions.map((session) => ({
    startTimestamp: new Date(session.firstStartMs).toISOString(),
    endTimestamp: new Date(session.lastEndMs).toISOString(),
    durationMinutes: (session.lastEndMs - session.firstStartMs) / 60000,
    trackCount: session.entries.length,
    entries: session.entries,
  }))
}

export function sessionSummary(sessions) {
  if (sessions.length === 0) {
    return { sessionCount: 0, averageMinutes: 0, longest: null }
  }

  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  const longest = sessions.reduce((best, s) => (s.durationMinutes > best.durationMinutes ? s : best))

  return {
    sessionCount: sessions.length,
    averageMinutes: totalMinutes / sessions.length,
    longest,
  }
}

const SESSION_BUCKETS = [
  { label: '< 15 min', max: 15 },
  { label: '15–30 min', max: 30 },
  { label: '30–60 min', max: 60 },
  { label: '1–2 hrs', max: 120 },
  { label: '2 hrs+', max: Infinity },
]

export function sessionLengthHistogram(sessions) {
  const counts = SESSION_BUCKETS.map((bucket) => ({ label: bucket.label, count: 0 }))

  sessions.forEach((session) => {
    const bucketIndex = SESSION_BUCKETS.findIndex((bucket) => session.durationMinutes < bucket.max)
    counts[bucketIndex === -1 ? counts.length - 1 : bucketIndex].count += 1
  })

  return counts
}

// ---------------------------------------------------------------------------
// Discovery rate
// ---------------------------------------------------------------------------

// For each of artists/tracks, finds the month each one was first played and
// buckets monthly "new" vs. "total distinct played that month" counts.
function discoveryByMonth(entries, keyFn) {
  const firstSeenMonth = new Map()
  const playedByMonth = new Map() // month -> Set of keys played that month
  const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  sorted.forEach((entry) => {
    const key = keyFn(entry)
    if (!key) return
    const month = entry.timestamp.slice(0, 7)

    if (!firstSeenMonth.has(key)) {
      firstSeenMonth.set(key, month)
    }

    if (!playedByMonth.has(month)) playedByMonth.set(month, new Set())
    playedByMonth.get(month).add(key)
  })

  const newCountByMonth = new Map()
  firstSeenMonth.forEach((month) => {
    newCountByMonth.set(month, (newCountByMonth.get(month) ?? 0) + 1)
  })

  const months = [...playedByMonth.keys()].sort()
  return months.map((month) => ({
    month,
    newCount: newCountByMonth.get(month) ?? 0,
    totalCount: playedByMonth.get(month).size,
  }))
}

export function artistDiscoveryByMonth(entries) {
  return discoveryByMonth(entries, (entry) => entry.artistName)
}

export function trackDiscoveryByMonth(entries) {
  return discoveryByMonth(entries, (entry) => entry.trackUri)
}

export function peakDiscoveryMonth(discoveryData) {
  if (discoveryData.length === 0) return null
  return discoveryData.reduce((best, current) => (current.newCount > best.newCount ? current : best))
}

// ---------------------------------------------------------------------------
// Shuffle vs. deliberate ratio
// ---------------------------------------------------------------------------

// The parser coerces shuffle to a boolean (Boolean(raw.shuffle)), so a
// genuinely absent field is indistinguishable from `false` once normalized.
// This treats all entries as having a shuffle signal; if that turns out to
// be too strong an assumption for real export data, the parser would need
// to preserve null explicitly — flagged in the summary for real-data review.
export function shuffleRatioByMonth(entries) {
  const byMonth = new Map()
  entries.forEach((entry) => {
    const month = entry.timestamp.slice(0, 7)
    const bucket = byMonth.get(month) ?? { shuffled: 0, total: 0 }
    bucket.total += 1
    if (entry.shuffle) bucket.shuffled += 1
    byMonth.set(month, bucket)
  })
  return [...byMonth.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, { shuffled, total }]) => ({
      month,
      shufflePercent: total > 0 ? (shuffled / total) * 100 : 0,
    }))
}

// ---------------------------------------------------------------------------
// Platform breakdown
// ---------------------------------------------------------------------------

const PLATFORM_PATTERNS = [
  { category: 'Mobile', pattern: /android|ios|iphone|ipad|mobile/i },
  { category: 'Desktop', pattern: /windows|os x|osx|mac|linux|desktop/i },
  { category: 'Web', pattern: /web_player|webplayer|web/i },
]

export function normalizePlatform(rawPlatform) {
  if (!rawPlatform) return 'Other/Unknown'
  const match = PLATFORM_PATTERNS.find(({ pattern }) => pattern.test(rawPlatform))
  return match ? match.category : 'Other/Unknown'
}

export function platformBreakdownAllTime(entries) {
  const counts = new Map()
  entries.forEach((entry) => {
    const category = normalizePlatform(entry.platform)
    counts.set(category, (counts.get(category) ?? 0) + 1)
  })
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }))
}

const PLATFORM_CATEGORIES = ['Mobile', 'Desktop', 'Web', 'Other/Unknown']

// One row per year with a count per platform category, for a stacked chart.
export function platformBreakdownByYear(entries) {
  const byYear = new Map()
  entries.forEach((entry) => {
    const year = entry.timestamp.slice(0, 4)
    const category = normalizePlatform(entry.platform)
    if (!byYear.has(year)) {
      byYear.set(year, Object.fromEntries(PLATFORM_CATEGORIES.map((c) => [c, 0])))
    }
    byYear.get(year)[category] += 1
  })
  return [...byYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, counts]) => ({ year, ...counts }))
}
