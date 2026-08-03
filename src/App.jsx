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
import FullHistory from './components/history/FullHistory.jsx'
import MainHub from './components/MainHub.jsx'
import './App.css'

const SECTIONS = {
  'recently-played': { label: 'Recently Played', Component: RecentlyPlayed },
  'top-tracks': { label: 'Top Tracks', Component: TopTracks },
  'top-artists': { label: 'Top Artists', Component: TopArtists },
  library: { label: 'Library', Component: Library },
  'full-history': { label: 'Full History', Component: FullHistory },
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // null = at the hub; otherwise the id of the section currently open.
  const [activeSectionId, setActiveSectionId] = useState(null)
  // Bumped whenever the visible view changes so the panel wrapper remounts
  // and its entrance animation replays instead of a jarring instant swap.
  const [panelKey, setPanelKey] = useState(0)

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

  function openSection(id) {
    setActiveSectionId(id)
    setPanelKey((key) => key + 1)
  }

  function goToHub() {
    setActiveSectionId(null)
    setPanelKey((key) => key + 1)
  }

  if (loading) {
    return (
      <div className="container centered">
        <span className="brand-mark">SPOTIFY / ANALYTICS</span>
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="container centered">
        <span className="brand-mark">SPOTIFY / ANALYTICS</span>
        <h1>Listening Dashboard</h1>
        {error && <p className="error">{error}</p>}
        <button onClick={redirectToSpotifyAuthorize}>Connect to Spotify</button>
      </div>
    )
  }

  const activeSection = activeSectionId ? SECTIONS[activeSectionId] : null
  const ActiveComponent = activeSection?.Component

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Listening Dashboard</h1>
        {profile && (
          <div className="profile">
            {profile.images?.[0]?.url && (
              <img src={profile.images[0].url} alt={profile.display_name} className="avatar" />
            )}
            <span className="profile-name">{profile.display_name}</span>
            <button className="secondary" onClick={handleLogout}>
              Log out
            </button>
          </div>
        )}
      </header>

      {error && <p className="error">{error}</p>}

      {/* Now Playing is pinned outside the hub/section navigation entirely —
          it's always visible regardless of which section is open. */}
      <NowPlaying />

      {activeSection && (
        <div className="hub-breadcrumb">
          <button type="button" className="hub-breadcrumb-link" onClick={goToHub}>
            Home
          </button>
          <span className="hub-breadcrumb-sep">/</span>
          <span className="hub-breadcrumb-current">{activeSection.label}</span>
        </div>
      )}

      <main key={panelKey} className="tab-panel">
        {activeSection ? <ActiveComponent /> : <MainHub onSelect={openSection} />}
      </main>
    </div>
  )
}

export default App
