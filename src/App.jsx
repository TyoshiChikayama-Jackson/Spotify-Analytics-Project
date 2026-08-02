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
import './App.css'

const LIVE_TABS = [
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
  const [activeSection, setActiveSection] = useState('live')
  const [activeLiveTab, setActiveLiveTab] = useState(LIVE_TABS[0].id)
  // Bumped on every tab switch so the panel wrapper remounts and its
  // entrance animation replays instead of a jarring instant swap.
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

  function handleSectionChange(section) {
    setActiveSection(section)
    setPanelKey((key) => key + 1)
  }

  function handleLiveTabChange(id) {
    setActiveLiveTab(id)
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

  const ActiveLiveComponent = LIVE_TABS.find((tab) => tab.id === activeLiveTab).Component

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

      <div className="section-switch" role="tablist" aria-label="Data source">
        <button
          role="tab"
          data-section="live"
          aria-selected={activeSection === 'live'}
          className={`section-switch-item ${activeSection === 'live' ? 'active' : ''}`}
          onClick={() => handleSectionChange('live')}
        >
          <span className="section-switch-dot" />
          Live
        </button>
        <button
          role="tab"
          data-section="history"
          aria-selected={activeSection === 'history'}
          className={`section-switch-item ${activeSection === 'history' ? 'active' : ''}`}
          onClick={() => handleSectionChange('history')}
        >
          <span className="section-switch-dot" />
          Full History
        </button>
      </div>

      {activeSection === 'live' && (
        <nav className="tab-nav" role="tablist" aria-label="Live data sections">
          {LIVE_TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeLiveTab === tab.id}
              className={`tab-nav-item ${activeLiveTab === tab.id ? 'active' : ''}`}
              onClick={() => handleLiveTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      )}

      <main key={panelKey} className="tab-panel">
        {activeSection === 'live' ? <ActiveLiveComponent /> : <FullHistory />}
      </main>
    </div>
  )
}

export default App
