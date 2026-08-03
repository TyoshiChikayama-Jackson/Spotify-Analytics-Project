import { getValidAccessToken, refreshAccessToken } from '../auth/spotifyAuth.js'

const API_BASE = 'https://api.spotify.com/v1'

async function spotifyFetch(path, { params, method = 'GET', body, retrying = false } = {}) {
  const token = await getValidAccessToken()
  const url = new URL(`${API_BASE}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value)
    })
  }

  const headers = { Authorization: `Bearer ${token}` }
  // Spotify requires Content-Type: application/json whenever a body is
  // sent (play/pause with context/uris/device_id) — omit it entirely when
  // there's no body (next/previous, or play/pause with nothing to resume),
  // since some APIs reject an empty body paired with a JSON content-type.
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (path === '/search') {
    console.log('[genre-debug] fetch', { url: url.toString(), status: response.status })
  }

  if (response.status === 204) return null

  if (response.status === 401 && !retrying) {
    await refreshAccessToken()
    return spotifyFetch(path, { params, method, body, retrying: true })
  }

  if (!response.ok) {
    let parsedBody = null
    try {
      parsedBody = await response.json()
    } catch {
      // response had no JSON body
    }

    // Log the full response, not just a summarized message — this is the
    // actual diagnostic the prompt asked for: status, path, and whatever
    // Spotify's error body said, visible in devtools even if the UI only
    // shows a short message.
    console.error(`Spotify API error on ${method} ${path}:`, {
      status: response.status,
      statusText: response.statusText,
      body: parsedBody,
    })

    const message = parsedBody?.error?.message || `Spotify API error: ${response.status} ${path}`
    const error = new Error(message)
    error.status = response.status
    error.spotifyReason = parsedBody?.error?.reason ?? null
    throw error
  }

  // Playback control endpoints (play/pause/next/previous) are documented to
  // return 204, but can come back as 200 with an empty or non-JSON body in
  // practice — don't assume every "ok" response is parseable JSON.
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export function getCurrentlyPlaying() {
  return spotifyFetch('/me/player/currently-playing')
}

// Requires the user-read-playback-state scope. Returns the currently
// playing item plus an array of upcoming queued tracks.
export function getQueue() {
  return spotifyFetch('/me/player/queue')
}

// Full playback state including the active device, if any. Used to resolve
// a device_id for play/pause — Spotify's docs note that when a user has
// multiple devices (or the "active" device is ambiguous), passing device_id
// explicitly is more reliable than omitting it and letting Spotify guess.
export function getPlaybackState() {
  return spotifyFetch('/me/player')
}

async function resolveActiveDeviceId() {
  try {
    const state = await getPlaybackState()
    return state?.device?.id ?? null
  } catch {
    return null
  }
}

// Playback controls — require the user-modify-playback-state scope and an
// active device (the Spotify app open somewhere). Spotify returns 404 with
// "No active device found" when none exists, and 403 when the token lacks
// the required scope (stale token from before this scope was added) —
// callers should check error.status to distinguish these.
export async function pausePlayback() {
  const deviceId = await resolveActiveDeviceId()
  return spotifyFetch('/me/player/pause', {
    method: 'PUT',
    params: deviceId ? { device_id: deviceId } : undefined,
  })
}

export async function startPlayback() {
  const deviceId = await resolveActiveDeviceId()
  return spotifyFetch('/me/player/play', {
    method: 'PUT',
    params: deviceId ? { device_id: deviceId } : undefined,
  })
}

// Starts playback of a single specific track (click-to-play from the queue
// or recently-played strip). Per Spotify's docs, /me/player/play takes the
// device_id as a query param and the track(s) to play as a `uris` array in
// the JSON body.
export async function playTrackUri(trackUri) {
  const deviceId = await resolveActiveDeviceId()
  return spotifyFetch('/me/player/play', {
    method: 'PUT',
    params: deviceId ? { device_id: deviceId } : undefined,
    body: { uris: [trackUri] },
  })
}

export async function skipToNext() {
  const deviceId = await resolveActiveDeviceId()
  return spotifyFetch('/me/player/next', {
    method: 'POST',
    params: deviceId ? { device_id: deviceId } : undefined,
  })
}

export async function skipToPrevious() {
  const deviceId = await resolveActiveDeviceId()
  return spotifyFetch('/me/player/previous', {
    method: 'POST',
    params: deviceId ? { device_id: deviceId } : undefined,
  })
}

export async function setShuffle(state) {
  const deviceId = await resolveActiveDeviceId()
  return spotifyFetch('/me/player/shuffle', {
    method: 'PUT',
    params: {
      state: state ? 'true' : 'false',
      ...(deviceId ? { device_id: deviceId } : {}),
    },
  })
}

// mode is one of 'track' | 'context' | 'off', matching Spotify's repeat_state values.
export async function setRepeatMode(mode) {
  const deviceId = await resolveActiveDeviceId()
  return spotifyFetch('/me/player/repeat', {
    method: 'PUT',
    params: {
      state: mode,
      ...(deviceId ? { device_id: deviceId } : {}),
    },
  })
}

export async function seekToPosition(positionMs) {
  const deviceId = await resolveActiveDeviceId()
  return spotifyFetch('/me/player/seek', {
    method: 'PUT',
    params: {
      position_ms: String(Math.round(positionMs)),
      ...(deviceId ? { device_id: deviceId } : {}),
    },
  })
}

// Adds a track to the end of the active device's playback queue. Same
// no-active-device (404) failure mode as the other player controls.
export async function addToQueue(trackUri) {
  const deviceId = await resolveActiveDeviceId()
  return spotifyFetch('/me/player/queue', {
    method: 'POST',
    params: {
      uri: trackUri,
      ...(deviceId ? { device_id: deviceId } : {}),
    },
  })
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

// Best-match artist search by name, used to resolve a streaming-history
// artist name (which has no Spotify id attached) to a real artist id. Spotify
// removed the batch "Get Several Artists" endpoint, so there is no way to
// look up many artists in one request — this and getArtist below are
// necessarily called one artist at a time.
export async function searchArtistByName(name) {
  const result = await spotifyFetch('/search', {
    params: { q: name, type: 'artist', limit: 1 },
  })
  return result?.artists?.items?.[0] ?? null
}

export function getArtist(artistId) {
  return spotifyFetch(`/artists/${artistId}`)
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
