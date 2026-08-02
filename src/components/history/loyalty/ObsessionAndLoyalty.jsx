import OnRepeatTimeline from './OnRepeatTimeline.jsx'
import ArtistRiseFallChart from './ArtistRiseFallChart.jsx'
import SkipPatternsByArtist from './SkipPatternsByArtist.jsx'

export default function ObsessionAndLoyalty({ entries }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Obsession &amp; Loyalty</h2>
      </div>

      <OnRepeatTimeline entries={entries} />
      <ArtistRiseFallChart entries={entries} />
      <SkipPatternsByArtist entries={entries} />
    </section>
  )
}
