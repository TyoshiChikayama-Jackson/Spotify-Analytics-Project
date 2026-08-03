import WeekdayWeekendSplit from './WeekdayWeekendSplit.jsx'
import ComebackTracks from './ComebackTracks.jsx'
import ChronotypeLabel from './ChronotypeLabel.jsx'
import MilestoneFacts from './MilestoneFacts.jsx'

export default function MoreInsights({ entries }) {
  return (
    <div className="card-grid">
      <div className="panel grid-card grid-card-full">
        <MilestoneFacts entries={entries} />
      </div>
      <div className="panel grid-card grid-card-md">
        <ChronotypeLabel entries={entries} />
      </div>
      <div className="panel grid-card grid-card-lg">
        <ComebackTracks entries={entries} />
      </div>
      <div className="panel grid-card grid-card-full">
        <WeekdayWeekendSplit entries={entries} />
      </div>
    </div>
  )
}
