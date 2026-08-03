const ICONS = {
  overview: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </svg>
  ),
  habits: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 15V9M8 15V5M13 15v-3M17 15V7" />
    </svg>
  ),
  loyalty: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 16.5 4 11c-1.6-1.5-1.5-4 .2-5.4 1.5-1.1 3.4-.8 4.6.5l1.2 1.3 1.2-1.3c1.2-1.3 3.1-1.6 4.6-.5 1.7 1.4 1.8 3.9.2 5.4l-6 5.5z" />
    </svg>
  ),
  bigPicture: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" />
      <circle cx="10" cy="10" r="3.5" />
    </svg>
  ),
  behavior: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 11l3-4 3 5 3-7 4 8" />
    </svg>
  ),
  moreInsights: (
    <svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 2.5v2M10 15.5v2M4 10H2M18 10h-2M5 5l1.4 1.4M13.6 13.6 15 15M15 5l-1.4 1.4M6.4 13.6 5 15" />
      <circle cx="10" cy="10" r="3.5" />
    </svg>
  ),
}

const CARDS = [
  { id: 'overview', title: 'Overview', description: 'Highlights, listening over time, and all-time favorites.', icon: ICONS.overview },
  { id: 'habits', title: 'Habits & Patterns', description: 'Streaks, sessions, discovery rate, shuffle, and platform mix.', icon: ICONS.habits },
  { id: 'loyalty', title: 'Obsession & Loyalty', description: 'On-repeat tracks, artist rise & fall, and skip patterns.', icon: ICONS.loyalty },
  { id: 'bigpicture', title: 'Bigger Picture', description: 'Year in review, longest gaps, and seasonal patterns.', icon: ICONS.bigPicture },
  { id: 'behavior', title: 'Listening Behavior', description: 'Autoplay, instant replays, diversity, and library growth.', icon: ICONS.behavior },
  { id: 'moreinsights', title: 'More Insights', description: 'Weekday vs. weekend, comebacks, chronotype, and milestones.', icon: ICONS.moreInsights },
]

export default function FullHistoryHub({ onSelect }) {
  return (
    <div>
      <p className="hub-intro">Deep analytics from your imported streaming history.</p>
      <div className="hub-grid">
        {CARDS.map((card) => (
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
