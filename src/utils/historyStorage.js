const DB_NAME = 'spotify-dashboard-history'
const DB_VERSION = 1
const ENTRIES_STORE = 'entries'
const META_STORE = 'meta'
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
