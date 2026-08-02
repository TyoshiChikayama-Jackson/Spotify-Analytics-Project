import { getValidAccessToken, refreshAccessToken } from '../auth/spotifyAuth.js'

const API_BASE = 'https://api.spotify.com/v1'

async function spotifyFetch(path, { params, method = 'GET', retrying = false } = {}) {
  const token = await getValidAccessToken()
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value)
    })
  }

  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 204) return null

  if (response.status === 401 && !retrying) {
    await refreshAccessToken()
    return spotifyFetch(path, { params, method, retrying: true })
  }

  if (!response.ok) {
    let message = `Spotify API error: ${response.status} ${path}`
    try {
      const body = await response.json()
      if (body?.error?.message) message = body.error.message
    } catch {
      // response had no JSON body — keep the generic message
    }
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return response.json()
}

export function getCurrentlyPlaying() {
  return spotifyFetch('/me/player/currently-playing')
}

// Requires the user-read-playback-state scope. Returns the currently
// playing item plus an array of upcoming queued tracks.
export function getQueue() {
  return spotifyFetch('/me/player/queue')
}

// Playback controls — require the user-modify-playback-state scope and an
// active device (the Spotify app open somewhere). Spotify returns 404 with
// "No active device found" when none exists; callers should check
// error.status === 404 to show that case distinctly from other failures.
export function pausePlayback() {
  return spotifyFetch('/me/player/pause', { method: 'PUT' })
}

export function startPlayback() {
  return spotifyFetch('/me/player/play', { method: 'PUT' })
}

export function skipToNext() {
  return spotifyFetch('/me/player/next', { method: 'POST' })
}

export function skipToPrevious() {
  return spotifyFetch('/me/player/previous', { method: 'POST' })
}

export function getRecentlyPlayed(limit = 50) {
  return spotifyFetch('/me/player/recently-played', { params: { limit } })
}

export function getTopTracks(timeRange = 'medium_term', limit = 20) {
  return spotifyFetch('/me/top/tracks', { params: { time_range: timeRange, limit } })
}

export function getTopArtists(timeRange = 'medium_term', limit = 20) {
  return spotifyFetch('/me/top/artists', { params: { time_range: timeRange, limit } })
}

// Paginates through /me/tracks up to maxTracks (Spotify caps page size at 50).
export async function getSavedTracks(maxTracks = 200) {
  const items = []
  let offset = 0
  const limit = 50
  let total = Infinity

  while (items.length < maxTracks && offset < total) {
    const page = await spotifyFetch('/me/tracks', { params: { limit, offset } })
    total = page.total
    items.push(...page.items)
    offset += limit
    if (page.items.length < limit) break
  }

  return { items, total }
}
