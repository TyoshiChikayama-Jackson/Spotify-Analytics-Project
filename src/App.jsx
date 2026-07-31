import { useEffect, useState } from 'react'
import {
  redirectToSpotifyAuthorize,
  handleRedirectCallback,
  isLoggedIn,
  getValidAccessToken,
  logout,
} from './auth/spotifyAuth.js'
import NowPlaying from './components/NowPlaying.jsx'
import RecentlyPlayed from './components/RecentlyPlayed.jsx'
import TopTracks from './components/TopTracks.jsx'
import TopArtists from './components/TopArtists.jsx'
import Library from './components/Library.jsx'
import './App.css'

const TABS = [
  { id: 'now-playing', label: 'Now Playing', Component: NowPlaying },
  { id: 'recently-played', label: 'Recently Played', Component: RecentlyPlayed },
  { id: 'top-tracks', label: 'Top Tracks', Component: TopTracks },
  { id: 'top-artists', label: 'Top Artists', Component: TopArtists },
  { id: 'library', label: 'Library', Component: Library },
]

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(TABS[0].id)

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
    return <div className="container centered">Loading...</div>
  }

  if (!loggedIn) {
    return (
      <div className="container centered">
        <h1>Spotify Analytics Dashboard</h1>
        {error && <p className="error">{error}</p>}
        <button onClick={redirectToSpotifyAuthorize}>Connect to Spotify</button>
      </div>
    )
  }

  const ActiveComponent = TABS.find((tab) => tab.id === activeTab).Component

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Spotify Analytics Dashboard</h1>
        {profile && (
          <div className="profile">
            {profile.images?.[0]?.url && (
              <img src={profile.images[0].url} alt={profile.display_name} className="avatar" />
            )}
            <span>{profile.display_name}</span>
            <button className="secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </header>

      {error && <p className="error">{error}</p>}

      <nav className="tab-nav" role="tablist" aria-label="Dashboard sections">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tab-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main>
        <ActiveComponent />
      </main>
    </div>
  )
}

export default App
