import { useMemo } from 'react'
import { milestoneFacts } from '../../../utils/moreInsightsStats.js'
import AnimatedNumber from '../../AnimatedNumber.jsx'

function formatDate(day) {
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function MilestoneFacts({ entries }) {
  const facts = useMemo(() => milestoneFacts(entries), [entries])

  if (!facts) return null

  return (
    <div className="chart-block">
      <h3 className="chart-title">Milestones</h3>

      <div className="wrapped-card" style={{ marginBottom: '1rem' }}>
        <div className="wrapped-hero">
          <span className="wrapped-hero-value">
            <AnimatedNumber value={Math.round(facts.totalDaysEquivalent)} />
          </span>
          <span className="wrapped-hero-label">full 24-hour days of music, all-time</span>
        </div>
        <p className="muted small" style={{ margin: 0 }}>
          That's <AnimatedNumber value={Math.round(facts.totalHours)} /> hours of listening.
        </p>
      </div>

      <div className="highlight-grid">
        {facts.mostPlayedTrack && (
          <div className="highlight-tile">
            <span className="stat-value">
              <AnimatedNumber value={facts.mostPlayedTrack.playCount} format={(n) => `${n}×`} />
            </span>
            <span className="muted small">
              Most played track — {facts.mostPlayedTrack.trackName}
              {facts.mostPlayedTrack.artistName ? ` · ${facts.mostPlayedTrack.artistName}` : ''}
            </span>
          </div>
        )}

        {facts.busiestTrackDay && (
          <div className="highlight-tile">
            <span className="stat-value">
              <AnimatedNumber value={facts.busiestTrackDay.playCount} format={(n) => `${n}×`} />
            </span>
            <span className="muted small">
              Most plays of one track in a day — {facts.busiestTrackDay.trackName} on{' '}
              {formatDate(facts.busiestTrackDay.day)}
            </span>
          </div>
        )}

        <div className="highlight-tile">
          <span className="stat-value">
            <AnimatedNumber value={facts.distinctArtists} />
          </span>
          <span className="muted small">Distinct artists played, all-time</span>
        </div>

        <div className="highlight-tile">
          <span className="stat-value">
            <AnimatedNumber value={facts.distinctTracks} />
          </span>
          <span className="muted small">Distinct tracks played, all-time</span>
        </div>
      </div>
    </div>
  )
}
