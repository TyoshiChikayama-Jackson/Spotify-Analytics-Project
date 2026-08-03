import OnRepeatTimeline from './OnRepeatTimeline.jsx'
import ArtistRiseFallChart from './ArtistRiseFallChart.jsx'
import SkipPatternsByArtist from './SkipPatternsByArtist.jsx'

export default function ObsessionAndLoyalty({ entries }) {
  return (
    <div className="card-grid">
      <div className="panel grid-card grid-card-full">
        <OnRepeatTimeline entries={entries} />
      </div>
      <div className="panel grid-card grid-card-full">
        <ArtistRiseFallChart entries={entries} />
      </div>
      <div className="panel grid-card grid-card-full">
        <SkipPatternsByArtist entries={entries} />
      </div>
    </div>
  )
}
