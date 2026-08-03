import { useCallback, useEffect, useState } from 'react'
import { loadHistory, loadImportSummary } from '../utils/historyStorage.js'

// Loads imported streaming-history entries + import summary from IndexedDB.
// Shared by every Full History sidebar page, since each is now a standalone
// top-level section rather than a child of one hub page that loaded once.
export function useHistoryEntries() {
  const [entries, setEntries] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [storedEntries, storedSummary] = await Promise.all([
        loadHistory(),
        loadImportSummary(),
      ])
      setEntries(storedEntries)
      setSummary(storedSummary)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { entries, summary, loading, error, reload: load }
}
