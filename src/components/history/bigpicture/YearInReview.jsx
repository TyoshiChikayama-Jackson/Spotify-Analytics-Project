import { useMemo, useState } from 'react'
import { yearInReviewSummaries } from '../../../utils/bigPictureStats.js'
import AnimatedNumber from '../../AnimatedNumber.jsx'

function formatMonthLabel(month) {
  if (!month) return '—'
  const [year, monthNum] = month.split('-')
  const date = new Date(Number(year), Number(monthNum) - 1, 1)
  return date.toLocaleDateString(undefined, { month: 'long' })
}

export default function YearInReview({ entries }) {
  const summaries = useMemo(() => yearInReviewSummaries(entries), [entries])
  const [selectedYear, setSelectedYear] = useState(summaries[summaries.length - 1]?.year ?? null)

  if (summaries.length === 0) return null

  const active = summaries.find((s) => s.year === selectedYear) ?? summaries[summaries.length - 1]

  return (
    <div className="chart-block">
      <h3 className="chart-title">Year in review</h3>

      {summaries.length > 1 && (
        <div className="time-range-toggle wrap-toggle">
          {summaries.map((s) => (
            <button
              key={s.year}
              className={`toggle-tab ${active.year === s.year ? 'active' : ''}`}
              onClick={() => setSelectedYear(s.year)}
            >
              {s.year}
            </button>
          ))}
        </div>
      )}

      <div className="wrapped-card" key={active.year}>
        <div className="wrapped-card-year">
          {active.year}
          {active.isPartial && <span className="wrapped-so-far">so far</span>}
        </div>

        <div className="wrapped-hero">
          <span className="wrapped-hero-value">
            <AnimatedNumber value={Math.round(active.totalHours)} />
          </span>
          <span className="wrapped-hero-label">hours listened</span>
        </div>

        <div className="wrapped-grid">
          <div className="wrapped-fact">
            <span className="wrapped-fact-label">Top artist</span>
            <span className="wrapped-fact-value">{active.topArtist?.name ?? '—'}</span>
          </div>
          <div className="wrapped-fact">
            <span className="wrapped-fact-label">Top track</span>
            <span className="wrapped-fact-value">{active.topTrack?.name ?? '—'}</span>
            {active.topTrack?.artistName && (
              <span className="wrapped-fact-sub">{active.topTrack.artistName}</span>
            )}
          </div>
          <div className="wrapped-fact">
            <span className="wrapped-fact-label">Artists explored</span>
            <span className="wrapped-fact-value">
              <AnimatedNumber value={active.distinctArtists} />
            </span>
          </div>
          <div className="wrapped-fact">
            <span className="wrapped-fact-label">Standout month</span>
            <span className="wrapped-fact-value">{formatMonthLabel(active.standoutMonth)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
