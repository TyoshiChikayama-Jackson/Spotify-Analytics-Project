import { useState } from 'react'

const ICONS = {
  recentlyPlayed: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6v4l2.8 2.8" />
    </svg>
  ),
  topTracks: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15V7l10-2v8" />
      <circle cx="4" cy="15" r="2" />
      <circle cx="14" cy="13" r="2" />
    </svg>
  ),
  topArtists: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  ),
  library: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4v12M8 3v13M13 6v10M17 4v12" />
    </svg>
  ),
  habits: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 15V9M8 15V5M13 15v-3M17 15V7" />
    </svg>
  ),
  loyalty: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 16.5 4 11c-1.6-1.5-1.5-4 .2-5.4 1.5-1.1 3.4-.8 4.6.5l1.2 1.3 1.2-1.3c1.2-1.3 3.1-1.6 4.6-.5 1.7 1.4 1.8 3.9.2 5.4l-6 5.5z" />
    </svg>
  ),
  bigPicture: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" />
      <circle cx="10" cy="10" r="3.5" />
    </svg>
  ),
  moreInsights: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 2.5v2M10 15.5v2M4 10H2M18 10h-2M5 5l1.4 1.4M13.6 13.6 15 15M15 5l-1.4 1.4M6.4 13.6 5 15" />
      <circle cx="10" cy="10" r="3.5" />
    </svg>
  ),
  genre: (
    <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6.5" cy="14" r="3" />
      <circle cx="15" cy="6" r="2.5" />
      <path d="M9.3 12.5 12.7 8" />
    </svg>
  ),
}

const GROUPS = [
  {
    label: 'Live',
    items: [
      { id: 'recently-played', label: 'Recently Played', icon: ICONS.recentlyPlayed },
      { id: 'top-tracks', label: 'Top Tracks', icon: ICONS.topTracks },
      { id: 'top-artists', label: 'Top Artists', icon: ICONS.topArtists },
      { id: 'library', label: 'Library', icon: ICONS.library },
    ],
  },
  {
    label: 'Full History',
    items: [
      { id: 'habits', label: 'Habits & Patterns', icon: ICONS.habits },
      { id: 'loyalty', label: 'Obsession & Loyalty', icon: ICONS.loyalty },
      { id: 'bigpicture', label: 'Big Picture', icon: ICONS.bigPicture },
      { id: 'moreinsights', label: 'More Insights', icon: ICONS.moreInsights },
      { id: 'genre', label: 'Genre Analysis', icon: ICONS.genre },
    ],
  },
]

function SidebarContents({ activeSectionId, onSelect }) {
  return (
    <nav className="sidebar-nav" aria-label="Dashboard sections">
      {GROUPS.map((group) => (
        <div className="sidebar-group" key={group.label}>
          <p className="sidebar-group-label">{group.label}</p>
          <ul className="sidebar-list">
            {group.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`sidebar-item${item.id === activeSectionId ? ' active' : ''}`}
                  onClick={() => onSelect(item.id)}
                  aria-current={item.id === activeSectionId ? 'page' : undefined}
                >
                  <span className="sidebar-item-icon">{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export default function Sidebar({ activeSectionId, onSelect }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleSelect(id) {
    onSelect(id)
    setMobileOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className="sidebar-mobile-toggle"
        onClick={() => setMobileOpen((open) => !open)}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileOpen}
      >
        <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>

      <aside className="sidebar">
        <SidebarContents activeSectionId={activeSectionId} onSelect={handleSelect} />
      </aside>

      {mobileOpen && (
        <div className="sidebar-drawer-backdrop" onClick={() => setMobileOpen(false)}>
          <aside className="sidebar sidebar-drawer" onClick={(event) => event.stopPropagation()}>
            <SidebarContents activeSectionId={activeSectionId} onSelect={handleSelect} />
          </aside>
        </div>
      )}
    </>
  )
}
