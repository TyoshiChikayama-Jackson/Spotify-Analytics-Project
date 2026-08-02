import AutoplayRatio from './AutoplayRatio.jsx'
import InstantReplays from './InstantReplays.jsx'
import BackButtonUsage from './BackButtonUsage.jsx'
import DiversityScore from './DiversityScore.jsx'
import AlbumLoyalty from './AlbumLoyalty.jsx'
import GrowthCurves from './GrowthCurves.jsx'
import MostImproved from './MostImproved.jsx'

export default function ListeningBehavior({ entries }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Listening Behavior</h2>
      </div>

      <AutoplayRatio entries={entries} />
      <InstantReplays entries={entries} />
      <BackButtonUsage entries={entries} />
      <DiversityScore entries={entries} />
      <AlbumLoyalty entries={entries} />
      <GrowthCurves entries={entries} />
      <MostImproved entries={entries} />
    </section>
  )
}
