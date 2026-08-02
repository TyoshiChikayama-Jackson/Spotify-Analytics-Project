import StreakStats from './StreakStats.jsx'
import SessionStats from './SessionStats.jsx'
import DiscoveryChart from './DiscoveryChart.jsx'
import ShuffleRatioChart from './ShuffleRatioChart.jsx'
import PlatformBreakdown from './PlatformBreakdown.jsx'

export default function HabitsAndPatterns({ entries }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Habits &amp; Patterns</h2>
      </div>

      <StreakStats entries={entries} />
      <SessionStats entries={entries} />
      <DiscoveryChart entries={entries} />
      <ShuffleRatioChart entries={entries} />
      <PlatformBreakdown entries={entries} />
    </section>
  )
}
