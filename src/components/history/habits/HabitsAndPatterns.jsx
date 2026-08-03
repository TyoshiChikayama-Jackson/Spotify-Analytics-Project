import StreakStats from './StreakStats.jsx'
import SessionStats from './SessionStats.jsx'
import DiscoveryChart from './DiscoveryChart.jsx'
import ShuffleRatioChart from './ShuffleRatioChart.jsx'
import PlatformBreakdown from './PlatformBreakdown.jsx'

export default function HabitsAndPatterns({ entries }) {
  return (
    <div className="card-grid">
      <div className="panel grid-card grid-card-md">
        <StreakStats entries={entries} />
      </div>
      <div className="panel grid-card grid-card-lg">
        <SessionStats entries={entries} />
      </div>
      <div className="panel grid-card grid-card-full">
        <DiscoveryChart entries={entries} />
      </div>
      <div className="panel grid-card grid-card-md">
        <ShuffleRatioChart entries={entries} />
      </div>
      <div className="panel grid-card grid-card-full">
        <PlatformBreakdown entries={entries} />
      </div>
    </div>
  )
}
