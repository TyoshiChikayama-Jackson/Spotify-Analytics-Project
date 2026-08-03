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
import HabitsAndPatternsPage from './components/history/HabitsAndPatternsPage.jsx'
import ObsessionAndLoyaltyPage from './components/history/ObsessionAndLoyaltyPage.jsx'
import BigPicturePage from './components/history/BigPicturePage.jsx'
import MoreInsightsPage from './components/history/MoreInsightsPage.jsx'
import GenreAnalysisPage from './components/history/GenreAnalysisPage.jsx'
import Sidebar from './components/Sidebar.jsx'
import './App.css'

const SECTIONS = {
  'recently-played': { label: 'Recently Played', Component: RecentlyPlayed },
  'top-tracks': { label: 'Top Tracks', Component: TopTracks },
  'top-artists': { label: 'Top Artists', Component: TopArtists },
  library: { label: 'Library', Component: Library },
  habits: { label: 'Habits & Patterns', Component: HabitsAndPatternsPage },
  loyalty: { label: 'Obsession & Loyalty', Component: ObsessionAndLoyaltyPage },
  bigpicture: { label: 'Big Picture', Component: BigPicturePage },
  moreinsights: { label: 'More Insights', Component: MoreInsightsPage },
  genre: { label: 'Genre Analysis', Component: GenreAnalysisPage },
}

const DEFAULT_SECTION_ID = 'recently-played'

function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeSectionId, setActiveSectionId] = useState(DEFAULT_SECTION_ID)
  // Bumped whenever the visible section changes so the panel wrapper remounts
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

  const activeSection = SECTIONS[activeSectionId] ?? SECTIONS[DEFAULT_SECTION_ID]
  const ActiveComponent = activeSection.Component

  return (
    <div className="app-shell">
      <Sidebar activeSectionId={activeSectionId} onSelect={openSection} />

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

        {/* Now Playing is pinned outside the section navigation entirely —
            it's always visible regardless of which sidebar item is active. */}
        <NowPlaying />

        <main key={panelKey} className="tab-panel">
          <ActiveComponent />
        </main>
      </div>
    </div>
  )
}

export default App
