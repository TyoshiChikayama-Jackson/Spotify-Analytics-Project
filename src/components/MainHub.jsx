const ICONS = {
  recentlyPlayed: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6v4l2.8 2.8" />
    </svg>
  ),
  topTracks: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 15V7l10-2v8" />
      <circle cx="4" cy="15" r="2" />
      <circle cx="14" cy="13" r="2" />
    </svg>
  ),
  topArtists: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  ),
  library: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 4v12M8 3v13M13 6v10M17 4v12" />
    </svg>
  ),
  fullHistory: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3.5 10a6.5 6.5 0 1 0 2-4.7" />
      <path d="M3.5 4v3.5H7" />
      <path d="M10 6.5V10l2.5 1.5" />
    </svg>
  ),
}

const HUB_CARDS = [
  { id: 'recently-played', title: 'Recently Played', description: 'Your last 50 tracks, plus listening-activity charts.', icon: ICONS.recentlyPlayed },
  { id: 'top-tracks', title: 'Top Tracks', description: 'Ranked by listening time across 4 weeks, 6 months, or years.', icon: ICONS.topTracks },
  { id: 'top-artists', title: 'Top Artists', description: 'Your top artists and a genre breakdown.', icon: ICONS.topArtists },
  { id: 'library', title: 'Library', description: 'Saved tracks, plus a breakdown by release era.', icon: ICONS.library },
  { id: 'full-history', title: 'Full History', description: 'Deep analytics from your imported streaming history.', icon: ICONS.fullHistory },
]

export default function MainHub({ onSelect }) {
  return (
    <div>
      <p className="hub-intro">Choose a section to explore.</p>
      <div className="hub-grid">
        {HUB_CARDS.map((card) => (
          <button
            key={card.id}
            type="button"
            className="hub-card"
            onClick={() => onSelect(card.id)}
          >
            <span className="hub-card-icon">{card.icon}</span>
            <h2 className="hub-card-title">{card.title}</h2>
            <p className="hub-card-description">{card.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
