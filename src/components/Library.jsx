import { getSavedTracks } from '../api/spotifyData.js'
import { useSpotifyData } from '../hooks/useSpotifyData.js'
import { SectionLoading, SectionError, SectionEmpty, RefreshButton } from './SectionState.jsx'
import SavedTracksByEra from './SavedTracksByEra.jsx'
import AnimatedNumber from './AnimatedNumber.jsx'

export default function Library() {
  const { data, loading, error, refreshing, refresh } = useSpotifyData(
    () => getSavedTracks(200),
    [],
  )
  const items = data?.items ?? []

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Library</h2>
        <RefreshButton onClick={refresh} disabled={refreshing} />
      </div>

      {loading && <SectionLoading variant="chart" />}
      {!loading && error && <SectionError message={error} onRetry={refresh} />}

      {!loading && !error && items.length === 0 && (
        <SectionEmpty>No saved tracks yet.</SectionEmpty>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <p className="stat-tile">
            <span className="stat-value">
              <AnimatedNumber value={data.total} />
            </span>
            <span className="muted"> saved tracks</span>
            {data.total > items.length && (
              <span className="muted small">
                {' '}
                (showing decade breakdown for the {items.length} most recently saved)
              </span>
            )}
          </p>
          <SavedTracksByEra items={items} />
        </>
      )}
    </section>
  )
}
