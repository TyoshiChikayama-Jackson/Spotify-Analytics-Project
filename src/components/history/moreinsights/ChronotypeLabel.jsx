import { useMemo } from 'react'
import { chronotypeByYear } from '../../../utils/moreInsightsStats.js'

function articleFor(label) {
  return /^[AEIOU]/.test(label) ? 'an' : 'a'
}

export default function ChronotypeLabel({ entries }) {
  const { allTime, years } = useMemo(() => chronotypeByYear(entries), [entries])

  if (!allTime) return null

  // Only worth calling out as "changed" if the label actually differs
  // between the first and most recent year with data.
  const changed =
    years.length > 1 && years[0].chronotype.label !== years[years.length - 1].chronotype.label

  return (
    <div className="chart-block">
      <h3 className="chart-title">Listening chronotype</h3>
      <div className="chronotype-badge">
        <span className="chronotype-label">{allTime.label}</span>
        <span className="muted small">{allTime.share.toFixed(0)}% of your listening, all-time</span>
      </div>

      {changed && (
        <p className="muted small" style={{ marginTop: '0.75rem' }}>
          You were {articleFor(years[0].chronotype.label)}{' '}
          <strong>{years[0].chronotype.label}</strong> in {years[0].year}, but became{' '}
          {articleFor(years[years.length - 1].chronotype.label)}{' '}
          <strong>{years[years.length - 1].chronotype.label}</strong> by{' '}
          {years[years.length - 1].year}.
        </p>
      )}

      {years.length > 1 && (
        <div className="chronotype-year-row">
          {years.map((y) => (
            <div key={y.year} className="chronotype-year-chip">
              <span className="muted small">{y.year}</span>
              <span>{y.chronotype.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
