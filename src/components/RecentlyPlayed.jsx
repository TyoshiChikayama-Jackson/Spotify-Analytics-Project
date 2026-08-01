import { getRecentlyPlayed } from '../api/spotifyData.js'
import { useSpotifyData } from '../hooks/useSpotifyData.js'
import { SectionLoading, SectionError, SectionEmpty, RefreshButton } from './SectionState.jsx'
import RecentlyPlayedChart from './RecentlyPlayedChart.jsx'

function formatPlayedAt(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function RecentlyPlayed() {
  const { data, loading, error, refreshing, refresh } = useSpotifyData(
    () => getRecentlyPlayed(50),
    [],
  )
  const items = data?.items ?? []

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Recently Played</h2>
        <RefreshButton onClick={refresh} disabled={refreshing} />
      </div>

      {loading && <SectionLoading count={8} />}
      {!loading && error && <SectionError message={error} onRetry={refresh} />}

      {!loading && !error && items.length === 0 && (
        <SectionEmpty>No recent listening history yet.</SectionEmpty>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <RecentlyPlayedChart items={items} />

          <div className="data-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Track</th>
                  <th>Artist</th>
                  <th>Played at</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={`${item.played_at}-${index}`} style={{ '--i': index }}>
                    <td>{item.track.name}</td>
                    <td>{item.track.artists.map((a) => a.name).join(', ')}</td>
                    <td className="muted">{formatPlayedAt(item.played_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
