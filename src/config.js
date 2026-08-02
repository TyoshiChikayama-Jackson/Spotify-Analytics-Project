// Spotify app config — the Client ID is NOT a secret for PKCE flows and is safe to commit.
// Redirect URI is derived at runtime from window.location.origin + the Vite base path
// (see getRedirectUri() in src/auth/spotifyAuth.js), so it isn't configured here.
export const SPOTIFY_CLIENT_ID = 'bb31cdc2ab4c474d87751a521975e96a'

export const SPOTIFY_SCOPES = [
  'user-read-recently-played',
  'user-top-read',
  'user-read-currently-playing',
  'user-read-playback-state',
  'user-library-read',
].join(' ')
