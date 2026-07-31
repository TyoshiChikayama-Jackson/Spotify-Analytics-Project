import { useEffect, useState } from 'react'
import {
  redirectToSpotifyAuthorize,
  handleRedirectCallback,
  isLoggedIn,
  getValidAccessToken,
  logout,
} from './auth/spotifyAuth.js'
import './App.css'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        await handleRedirectCallback()
        if (isLoggedIn()) {
          setLoggedIn(true)
          const token = await getValidAccessToken()
          const response = await fetch('https://api.spotify.com/v1/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (!response.ok) throw new Error(`Failed to fetch profile: ${response.status}`)
          setProfile(await response.json())
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  function handleLogout() {
    logout()
    setLoggedIn(false)
    setProfile(null)
  }

  if (loading) {
    return <div className="container">Loading...</div>
  }

  return (
    <div className="container">
      <h1>Spotify Analytics Dashboard</h1>

      {error && <p className="error">{error}</p>}

      {!loggedIn && (
        <button onClick={redirectToSpotifyAuthorize}>Connect to Spotify</button>
      )}

      {loggedIn && profile && (
        <div className="profile">
          {profile.images?.[0]?.url && (
            <img src={profile.images[0].url} alt={profile.display_name} width={80} height={80} />
          )}
          <p>Logged in as {profile.display_name}</p>
          <button onClick={handleLogout}>Log out</button>
        </div>
      )}
    </div>
  )
}

export default App
