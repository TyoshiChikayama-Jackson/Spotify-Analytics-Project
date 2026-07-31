import { useCallback, useEffect, useState } from 'react'

// Fetches `fetcher()` on mount and whenever `deps` change, with loading/error
// state and a manual refresh handle. No polling — caller controls re-fetch timing.
export function useSpotifyData(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(
    async (isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true)
      setError(null)
      try {
        setData(await fetcher())
      } catch (err) {
        setError(err.message)
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps,
  )

  useEffect(() => {
    load(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error, refreshing, refresh: () => load(true) }
}
