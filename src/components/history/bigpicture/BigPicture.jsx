import YearInReview from './YearInReview.jsx'
import LongestGap from './LongestGap.jsx'
import SeasonalPatterns from './SeasonalPatterns.jsx'

export default function BigPicture({ entries }) {
  return (
    <div className="card-grid">
      <div className="panel grid-card grid-card-lg">
        <YearInReview entries={entries} />
      </div>
      <div className="panel grid-card grid-card-md">
        <LongestGap entries={entries} />
      </div>
      <div className="panel grid-card grid-card-full">
        <SeasonalPatterns entries={entries} />
      </div>
    </div>
  )
}
