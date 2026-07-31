// Spotify app config — the Client ID is NOT a secret for PKCE flows and is safe to commit.
// Redirect URI must exactly match what's registered in the Spotify Developer Dashboard.
export const SPOTIFY_CLIENT_ID = 'bb31cdc2ab4c474d87751a521975e96a'
export const SPOTIFY_REDIRECT_URI = 'http://127.0.0.1:5173/spotify-analytics-dashboard/'

export const SPOTIFY_SCOPES = [
  'user-read-recently-played',
  'user-top-read',
  'user-read-currently-playing',
  'user-library-read',
].join(' ')
