const DB_NAME = 'spotify-dashboard-history'
const DB_VERSION = 4
const ENTRIES_STORE = 'entries'
const META_STORE = 'meta'
const POPULARITY_STORE = 'trackPopularity' // removed in v3; see migration below
const ARTIST_ID_STORE = 'artistIdByName' // v4: artist name -> resolved Spotify artist id (or null if unresolved)
const ARTIST_GENRE_STORE = 'genresByArtistId' // v4: Spotify artist id -> genres array
const META_KEY = 'importSummary'

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(ENTRIES_STORE)) {
        const store = db.createObjectStore(ENTRIES_STORE, { keyPath: 'id' })
        store.createIndex('timestamp', 'timestamp')
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE)
      }
      // v3: the track-popularity cache (added in v2 for the Mainstream vs.
      // Deep-Cuts feature) is removed — Spotify pulled the popularity field
      // and batch track-fetch endpoint from Development Mode apps, so the
      // data this store cached can never be refreshed. Drop it for anyone
      // upgrading from v2 rather than leaving a dead, unused store behind.
      if (db.objectStoreNames.contains(POPULARITY_STORE)) {
        db.deleteObjectStore(POPULARITY_STORE)
      }
      // v4: permanent caches for the Genre Analysis feature. Resolving an
      // artist name to an id (Search) and an id to genres (Get Artist) both
      // cost one API call each, and neither result ever needs to change, so
      // both are cached forever and only ever filled in for names/ids not
      // already present — this is what makes the one-time scan resumable.
      if (!db.objectStoreNames.contains(ARTIST_ID_STORE)) {
        db.createObjectStore(ARTIST_ID_STORE)
      }
      if (!db.objectStoreNames.contains(ARTIST_GENRE_STORE)) {
        db.createObjectStore(ARTIST_GENRE_STORE)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function promisifyTx(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}

// Replaces the entire stored history with `entries` and records import
// metadata. Entries are keyed by id, so re-importing overlapping export
// chunks naturally overwrites duplicates rather than doubling them.
export async function saveHistory(entries, { fileResults } = {}) {
  const db = await openDb()
  const tx = db.transaction([ENTRIES_STORE, META_STORE], 'readwrite')

  tx.objectStore(ENTRIES_STORE).clear()
  entries.forEach((entry) => tx.objectStore(ENTRIES_STORE).put(entry))

  tx.objectStore(META_STORE).put(
    {
      entryCount: entries.length,
      importedAt: new Date().toISOString(),
      fileResults: fileResults ?? [],
    },
    META_KEY,
  )

  await promisifyTx(tx)
  db.close()
}

export async function loadHistory() {
  const db = await openDb()
  const tx = db.transaction(ENTRIES_STORE, 'readonly')
  const entries = await promisifyRequest(tx.objectStore(ENTRIES_STORE).getAll())
  db.close()
  return entries
}

export async function loadImportSummary() {
  const db = await openDb()
  const tx = db.transaction(META_STORE, 'readonly')
  const summary = await promisifyRequest(tx.objectStore(META_STORE).get(META_KEY))
  db.close()
  return summary ?? null
}

export async function clearHistory() {
  const db = await openDb()
  const tx = db.transaction([ENTRIES_STORE, META_STORE], 'readwrite')
  tx.objectStore(ENTRIES_STORE).clear()
  tx.objectStore(META_STORE).delete(META_KEY)
  await promisifyTx(tx)
  db.close()
}

// -- Genre resolution caches (permanent; see the v4 migration above) --------

// Returns a Map of artistName -> artistId, where artistId is null for names
// search couldn't resolve (so they're not retried forever, but are still
// visibly "unresolved" rather than silently missing).
export async function loadArtistIdCache() {
  const db = await openDb()
  const tx = db.transaction(ARTIST_ID_STORE, 'readonly')
  const store = tx.objectStore(ARTIST_ID_STORE)
  const [keys, values] = await Promise.all([
    promisifyRequest(store.getAllKeys()),
    promisifyRequest(store.getAll()),
  ])
  db.close()
  return new Map(keys.map((key, i) => [key, values[i]]))
}

export async function saveArtistIdCacheEntries(entries) {
  if (entries.length === 0) return
  const db = await openDb()
  const tx = db.transaction(ARTIST_ID_STORE, 'readwrite')
  const store = tx.objectStore(ARTIST_ID_STORE)
  entries.forEach(([name, artistId]) => store.put(artistId, name))
  await promisifyTx(tx)
  db.close()
}

// Returns a Map of artistId -> genres (string array, possibly empty).
export async function loadArtistGenreCache() {
  const db = await openDb()
  const tx = db.transaction(ARTIST_GENRE_STORE, 'readonly')
  const store = tx.objectStore(ARTIST_GENRE_STORE)
  const [keys, values] = await Promise.all([
    promisifyRequest(store.getAllKeys()),
    promisifyRequest(store.getAll()),
  ])
  db.close()
  return new Map(keys.map((key, i) => [key, values[i]]))
}

export async function saveArtistGenreCacheEntries(entries) {
  if (entries.length === 0) return
  const db = await openDb()
  const tx = db.transaction(ARTIST_GENRE_STORE, 'readwrite')
  const store = tx.objectStore(ARTIST_GENRE_STORE)
  entries.forEach(([artistId, genres]) => store.put(genres, artistId))
  await promisifyTx(tx)
  db.close()
}
