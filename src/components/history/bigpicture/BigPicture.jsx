import YearInReview from './YearInReview.jsx'
import LongestGap from './LongestGap.jsx'
import SeasonalPatterns from './SeasonalPatterns.jsx'

export default function BigPicture({ entries }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Bigger Picture</h2>
      </div>

      <YearInReview entries={entries} />
      <LongestGap entries={entries} />
      <SeasonalPatterns entries={entries} />
    </section>
  )
}
