import AutoplayRatio from './AutoplayRatio.jsx'
import InstantReplays from './InstantReplays.jsx'
import BackButtonUsage from './BackButtonUsage.jsx'
import DiversityScore from './DiversityScore.jsx'
import AlbumLoyalty from './AlbumLoyalty.jsx'
import GrowthCurves from './GrowthCurves.jsx'
import MostImproved from './MostImproved.jsx'

export default function ListeningBehavior({ entries }) {
  return (
    <div className="card-grid">
      <div className="panel grid-card grid-card-md">
        <AutoplayRatio entries={entries} />
      </div>
      <div className="panel grid-card grid-card-md">
        <DiversityScore entries={entries} />
      </div>
      <div className="panel grid-card grid-card-lg">
        <InstantReplays entries={entries} />
      </div>
      <div className="panel grid-card grid-card-sm">
        <MostImproved entries={entries} />
      </div>
      <div className="panel grid-card grid-card-md">
        <BackButtonUsage entries={entries} />
      </div>
      <div className="panel grid-card grid-card-lg">
        <AlbumLoyalty entries={entries} />
      </div>
      <div className="panel grid-card grid-card-full">
        <GrowthCurves entries={entries} />
      </div>
    </div>
  )
}
