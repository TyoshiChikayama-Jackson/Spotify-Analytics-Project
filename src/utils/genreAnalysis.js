// Genre analytics over the imported streaming history. The history itself
// has no genre data — only artist/track names — so genres have to be
// resolved from the live Spotify API one artist at a time (Spotify removed
// the batch "Get Several Artists" endpoint), then cached permanently.
import { searchArtistByName, getArtist } from '../api/spotifyData.js'
import {
  loadArtistIdCache,
  saveArtistIdCacheEntries,
  loadArtistGenreCache,
  saveArtistGenreCacheEntries,
} from './historyStorage.js'
import { detectSessions } from './habitsStats.js'
import { msToHours } from './historyStats.js'

const CONCURRENCY = 4
const BATCH_PERSIST_SIZE = 25

// Runs `worker` over `items` with a small fixed concurrency, persisting
// results in batches so an interrupted run (e.g. the user navigates away)
// only ever loses a handful of already-fetched results, not everything since
// the last save. `onProgress` is called after every completed item.
async function runPool(items, worker, { onProgress } = {}) {
  let index = 0
  let completed = 0
  const results = []

  async function runOne() {
    while (index < items.length) {
      const myIndex = index++
      const item = items[myIndex]
      const value = await worker(item)
      results[myIndex] = value
      completed += 1
      onProgress?.(completed, items.length)
    }
  }

  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, runOne))
  return results
}

function distinctArtistNames(entries) {
  const names = new Set()
  entries.forEach((entry) => {
    if (entry.artistName) names.add(entry.artistName)
  })
  return [...names]
}

// Resolves every distinct artist name in `entries` to a Spotify artist id,
// then to that artist's genres — both permanently cached, so names/ids
// already resolved in a prior (possibly interrupted) run are never re-fetched.
// `onProgress({ stage, completed, total })` reports progress for the UI.
export async function resolveGenresForHistory(entries, { onProgress } = {}) {
  const allNames = distinctArtistNames(entries)
  const idCache = await loadArtistIdCache()
  const namesToResolve = allNames.filter((name) => !idCache.has(name))

  let idsDone = 0
  onProgress?.({ stage: 'resolving-artists', completed: 0, total: namesToResolve.length })

  const idResults = await runPool(
    namesToResolve,
    async (name) => {
      let artistId = null
      try {
        const match = await searchArtistByName(name)
        artistId = match?.id ?? null
      } catch {
        artistId = null
      }
      return [name, artistId]
    },
    {
      onProgress: (completed, total) => {
        idsDone = completed
        onProgress?.({ stage: 'resolving-artists', completed: idsDone, total })
      },
    },
  )

  for (let i = 0; i < idResults.length; i += BATCH_PERSIST_SIZE) {
    await saveArtistIdCacheEntries(idResults.slice(i, i + BATCH_PERSIST_SIZE))
  }
  idResults.forEach(([name, artistId]) => idCache.set(name, artistId))

  const resolvedIds = [...new Set([...idCache.values()].filter((id) => id != null))]
  const genreCache = await loadArtistGenreCache()
  const idsToFetch = resolvedIds.filter((id) => !genreCache.has(id))

  let genresDone = 0
  onProgress?.({ stage: 'fetching-genres', completed: 0, total: idsToFetch.length })

  const genreResults = await runPool(
    idsToFetch,
    async (artistId) => {
      let genres = []
      try {
        const artist = await getArtist(artistId)
        genres = artist?.genres ?? []
      } catch {
        genres = []
      }
      return [artistId, genres]
    },
    {
      onProgress: (completed, total) => {
        genresDone = completed
        onProgress?.({ stage: 'fetching-genres', completed: genresDone, total })
      },
    },
  )

  for (let i = 0; i < genreResults.length; i += BATCH_PERSIST_SIZE) {
    await saveArtistGenreCacheEntries(genreResults.slice(i, i + BATCH_PERSIST_SIZE))
  }
  genreResults.forEach(([artistId, genres]) => genreCache.set(artistId, genres))

  return { idCache, genreCache }
}

// Builds an artistName -> genres[] map for every artist that resolved
// successfully, using only what's already cached (no network calls) — used
// once resolution has already completed, to drive the actual analytics.
export async function loadResolvedGenreMap() {
  const [idCache, genreCache] = await Promise.all([loadArtistIdCache(), loadArtistGenreCache()])
  const nameToGenres = new Map()
  idCache.forEach((artistId, name) => {
    if (artistId == null) return
    nameToGenres.set(name, genreCache.get(artistId) ?? [])
  })
  return nameToGenres
}

// Coverage stats so results can be presented honestly when some artists
// couldn't be resolved via search.
export function genreCoverage(entries, nameToGenres) {
  let totalPlays = 0
  let coveredPlays = 0
  const totalArtists = distinctArtistNames(entries).length
  let resolvedArtists = 0

  distinctArtistNames(entries).forEach((name) => {
    const genres = nameToGenres.get(name)
    if (genres && genres.length > 0) resolvedArtists += 1
  })

  entries.forEach((entry) => {
    totalPlays += 1
    const genres = nameToGenres.get(entry.artistName)
    if (genres && genres.length > 0) coveredPlays += 1
  })

  return {
    totalArtists,
    resolvedArtists,
    unresolvedArtists: totalArtists - resolvedArtists,
    coveragePercent: totalPlays > 0 ? (coveredPlays / totalPlays) * 100 : 0,
  }
}

// All-time top genres, weighted by ms_played (consistent with topByMsPlayed
// elsewhere) — a play counts toward every genre listed for its artist.
export function topGenresAllTime(entries, nameToGenres, { limit = 15 } = {}) {
  const byGenre = new Map()

  entries.forEach((entry) => {
    const genres = nameToGenres.get(entry.artistName)
    if (!genres || genres.length === 0) return
    genres.forEach((genre) => {
      const existing = byGenre.get(genre) ?? { msPlayed: 0, playCount: 0 }
      existing.msPlayed += entry.msPlayed
      existing.playCount += 1
      byGenre.set(genre, existing)
    })
  })

  return [...byGenre.entries()]
    .map(([genre, { msPlayed, playCount }]) => ({ genre, hours: msToHours(msPlayed), playCount }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, limit)
}

// Year-by-year volume (hours) for the top N all-time genres, for a
// small-multiples-style trend chart matching the "over time" pattern used
// elsewhere (e.g. artistVolumeByMonth).
export function genreTrendByYear(entries, nameToGenres, { topN = 6 } = {}) {
  const topGenres = new Set(topGenresAllTime(entries, nameToGenres, { limit: topN }).map((g) => g.genre))
  const byYear = new Map()

  entries.forEach((entry) => {
    const genres = nameToGenres.get(entry.artistName)
    if (!genres || genres.length === 0) return
    const year = entry.timestamp.slice(0, 4)
    if (!byYear.has(year)) byYear.set(year, {})
    const yearBucket = byYear.get(year)
    genres.forEach((genre) => {
      if (!topGenres.has(genre)) return
      yearBucket[genre] = (yearBucket[genre] ?? 0) + msToHours(entry.msPlayed)
    })
  })

  return [...byYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, genreHours]) => ({ year, ...genreHours }))
}

export function topGenreNames(entries, nameToGenres, { topN = 6 } = {}) {
  return topGenresAllTime(entries, nameToGenres, { limit: topN }).map((g) => g.genre)
}

// A genre "switch" is a consecutive pair of plays whose artist genre sets
// share no genre at all; any overlap counts as a continuation. Plays whose
// artist has no resolved genres are skipped (can't compare against unknown).
export function detectGenreSwitches(entries, nameToGenres) {
  const sorted = [...entries].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  const withGenres = sorted
    .map((entry) => ({ entry, genres: nameToGenres.get(entry.artistName) ?? [] }))
    .filter((item) => item.genres.length > 0)

  let switches = 0
  const switchTimestamps = []

  for (let i = 1; i < withGenres.length; i += 1) {
    const prevGenres = withGenres[i - 1].genres
    const curGenres = withGenres[i].genres
    const overlaps = curGenres.some((g) => prevGenres.includes(g))
    if (!overlaps) {
      switches += 1
      switchTimestamps.push(withGenres[i].entry.timestamp)
    }
  }

  return { totalSwitches: switches, comparedPlays: withGenres.length, switchTimestamps }
}

// Average genre switches per listening session, reusing the existing
// session-detection logic from Habits & Patterns rather than rebuilding it.
export function genreSwitchesPerSession(entries, nameToGenres) {
  const sessions = detectSessions(entries)
  if (sessions.length === 0) return { averagePerSession: 0, sessionCount: 0 }

  let totalSwitches = 0
  sessions.forEach((session) => {
    totalSwitches += detectGenreSwitches(session.entries, nameToGenres).totalSwitches
  })

  return {
    averagePerSession: totalSwitches / sessions.length,
    sessionCount: sessions.length,
  }
}

// Year-by-year trend of genre-switching rate (average switches per session),
// to show whether switching has increased or decreased over time.
export function genreSwitchRateByYear(entries, nameToGenres) {
  const sessions = detectSessions(entries)
  const byYear = new Map()

  sessions.forEach((session) => {
    const year = session.startTimestamp.slice(0, 4)
    const { totalSwitches } = detectGenreSwitches(session.entries, nameToGenres)
    const bucket = byYear.get(year) ?? { switches: 0, sessionCount: 0 }
    bucket.switches += totalSwitches
    bucket.sessionCount += 1
    byYear.set(year, bucket)
  })

  return [...byYear.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, { switches, sessionCount }]) => ({
      year,
      averagePerSession: sessionCount > 0 ? switches / sessionCount : 0,
    }))
}
