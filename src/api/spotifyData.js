import { getValidAccessToken, refreshAccessToken } from '../auth/spotifyAuth.js'

const API_BASE = 'https://api.spotify.com/v1'

async function spotifyFetch(path, { params, retrying = false } = {}) {
  const token = await getValidAccessToken()
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value)
    })
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (response.status === 204) return null

  if (response.status === 401 && !retrying) {
    await refreshAccessToken()
    return spotifyFetch(path, { params, retrying: true })
  }

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} ${path}`)
  }

  return response.json()
}

export function getCurrentlyPlaying() {
  return spotifyFetch('/me/player/currently-playing')
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
