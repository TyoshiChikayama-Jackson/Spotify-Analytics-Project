import WeekdayWeekendSplit from './WeekdayWeekendSplit.jsx'
import ComebackTracks from './ComebackTracks.jsx'
import ChronotypeLabel from './ChronotypeLabel.jsx'
import MilestoneFacts from './MilestoneFacts.jsx'

export default function MoreInsights({ entries }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>More Insights</h2>
      </div>

      <MilestoneFacts entries={entries} />
      <ChronotypeLabel entries={entries} />
      <WeekdayWeekendSplit entries={entries} />
      <ComebackTracks entries={entries} />
    </section>
  )
}
