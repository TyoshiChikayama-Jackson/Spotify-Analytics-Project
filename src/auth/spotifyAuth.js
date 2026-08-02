import { SPOTIFY_CLIENT_ID, SPOTIFY_SCOPES } from '../config.js'

const AUTHORIZE_URL = 'https://accounts.spotify.com/authorize'
const TOKEN_URL = 'https://accounts.spotify.com/api/token'

const CODE_VERIFIER_KEY = 'spotify_code_verifier'
const ACCESS_TOKEN_KEY = 'spotify_access_token'
const REFRESH_TOKEN_KEY = 'spotify_refresh_token'
const EXPIRES_AT_KEY = 'spotify_expires_at'

// Derived at runtime so the same build works against 127.0.0.1:<port> in dev
// and the deployed GitHub Pages origin without editing config per environment.
// import.meta.env.BASE_URL always has a leading and trailing slash (matches
// vite.config.js's `base`), so this always yields a trailing-slash URL.
function getRedirectUri() {
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}

function generateCodeVerifier(length = 128) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  const randomValues = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(randomValues, (byte) => possible[byte % possible.length]).join('')
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(digest)
}

export async function redirectToSpotifyAuthorize() {
  const codeVerifier = generateCodeVerifier()
  sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier)
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: SPOTIFY_SCOPES,
    redirect_uri: getRedirectUri(),
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    // Forces Spotify to always show the consent screen, even for an
    // already-approved app — without this, Spotify can silently reuse a
    // prior authorization and never actually grant newly added scopes.
    show_dialog: 'true',
  })

  window.location.href = `${AUTHORIZE_URL}?${params.toString()}`
}

function storeTokens({ access_token, refresh_token, expires_in }) {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, access_token)
  if (refresh_token) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refresh_token)
  }
  const expiresAt = Date.now() + expires_in * 1000
  sessionStorage.setItem(EXPIRES_AT_KEY, String(expiresAt))
}

async function exchangeCodeForTokens(code) {
  const codeVerifier = sessionStorage.getItem(CODE_VERIFIER_KEY)

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: getRedirectUri(),
    client_id: SPOTIFY_CLIENT_ID,
    code_verifier: codeVerifier,
  })

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status}`)
  }

  const data = await response.json()
  storeTokens(data)
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
  return data
}

export async function refreshAccessToken() {
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY)
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: SPOTIFY_CLIENT_ID,
  })

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status}`)
  }

  const data = await response.json()
  storeTokens(data)
  return data
}

// Call once on app load. If a `?code=` param is present, exchanges it for tokens
// and cleans the URL. Returns true if a code was handled.
export async function handleRedirectCallback() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  if (!code) return false

  await exchangeCodeForTokens(code)

  params.delete('code')
  params.delete('state')
  const cleanUrl = window.location.pathname + (params.toString() ? `?${params}` : '')
  window.history.replaceState({}, document.title, cleanUrl)

  return true
}

export function isLoggedIn() {
  return Boolean(sessionStorage.getItem(ACCESS_TOKEN_KEY))
}

export function isTokenExpired() {
  const expiresAt = sessionStorage.getItem(EXPIRES_AT_KEY)
  if (!expiresAt) return true
  return Date.now() >= Number(expiresAt)
}

// Returns a valid access token, refreshing it first if it has expired.
export async function getValidAccessToken() {
  if (isTokenExpired()) {
    await refreshAccessToken()
  }
  return sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

export function logout() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(EXPIRES_AT_KEY)
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
}
