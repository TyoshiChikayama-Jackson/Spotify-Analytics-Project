import { getSavedTracks } from '../api/spotifyData.js'
import { useSpotifyData } from '../hooks/useSpotifyData.js'
import { SectionLoading, SectionError, SectionEmpty, RefreshButton } from './SectionState.jsx'
import SavedTracksByEra from './SavedTracksByEra.jsx'
import AnimatedNumber from './AnimatedNumber.jsx'
import AddToQueueButton from './AddToQueueButton.jsx'

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

          <h3 className="chart-title" style={{ marginTop: '1.5rem' }}>
            Recently saved
          </h3>
          <ol className="ranked-list">
            {items.slice(0, 50).map((item, index) => (
              <li key={item.track.id} className="ranked-item" style={{ '--i': index }}>
                <span className="rank">{index + 1}</span>
                {item.track.album?.images?.[item.track.album.images.length - 1]?.url && (
                  <img
                    className="album-art-sm"
                    src={item.track.album.images[item.track.album.images.length - 1].url}
                    alt={item.track.album.name}
                  />
                )}
                <div className="ranked-item-info">
                  <p className="track-name">{item.track.name}</p>
                  <p className="muted small">
                    {item.track.artists.map((a) => a.name).join(', ')}
                  </p>
                </div>
                <AddToQueueButton trackUri={item.track.uri} trackName={item.track.name} />
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
