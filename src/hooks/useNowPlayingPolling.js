import { useCallback, useEffect, useRef, useState } from 'react'

const PLAYING_INTERVAL_MS = 7000 // 5-10s while a track is actively playing
const IDLE_INTERVAL_MS = 25000 // 20-30s while nothing is playing

// Polls `fetcher()` on a variable interval: fast while something is playing,
// slower while idle, and paused entirely while the tab is hidden (resuming
// with an immediate fetch when it becomes visible again, since state may
// have changed while unwatched). Uses a chained setTimeout rather than
// setInterval so a slow request can't overlap the next tick, and the delay
// can change per-response based on `isActive(data)`.
//
// Token refresh on 401 is already handled inside spotifyFetch (see
// api/spotifyData.js) — a poll tick that hits an expired token transparently
// refreshes and retries there, so this hook doesn't need special-case logic
// for it; a poll's own error is just treated like any other failed fetch.
export function useNowPlayingPolling(fetcher, { isActive }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const timeoutRef = useRef(null)
  const visibleRef = useRef(!document.hidden)
  const mountedRef = useRef(true)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const clearScheduled = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const tick = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true)
    setError(null)
    try {
      const result = await fetcherRef.current()
      if (!mountedRef.current) return result
      setData(result)
      return result
    } catch (err) {
      if (mountedRef.current) setError(err.message)
      return null
    } finally {
      if (mountedRef.current) {
        setLoading(false) // only meaningfully changes anything on the very first tick
        if (isManualRefresh) setRefreshing(false)
      }
    }
  }, [])

  const scheduleNext = useCallback(
    (result) => {
      clearScheduled()
      if (!mountedRef.current || !visibleRef.current) return // unmounted, or paused while hidden
      const delay = isActive(result) ? PLAYING_INTERVAL_MS : IDLE_INTERVAL_MS
      timeoutRef.current = setTimeout(runPollTick, delay)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clearScheduled],
  )

  async function runPollTick() {
    const result = await tick(false)
    scheduleNext(result)
  }

  useEffect(() => {
    mountedRef.current = true
    runPollTick()

    function handleVisibilityChange() {
      const nowVisible = !document.hidden
      visibleRef.current = nowVisible
      if (nowVisible) {
        // Resume immediately — state may have changed while the tab was hidden.
        runPollTick()
      } else {
        clearScheduled()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      mountedRef.current = false
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      clearScheduled()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refresh = useCallback(async () => {
    clearScheduled()
    const result = await tick(true)
    scheduleNext(result)
  }, [tick, scheduleNext, clearScheduled])

  return { data, loading, error, refreshing, refresh }
}
