import { useHistoryEntries } from '../../hooks/useHistoryEntries.js'
import { SectionLoading, SectionError } from '../SectionState.jsx'
import ImportHistory from './ImportHistory.jsx'

// Shared scaffold for every Full History sidebar page: loads entries, shows
// the import uploader (reachable from any of the 5 pages, not just one hub),
// and renders `children(entries)` once real history data exists.
export default function FullHistoryPage({ children }) {
  const { entries, summary, loading, error, reload } = useHistoryEntries()

  if (loading) return <SectionLoading />
  if (error) return <SectionError message={error} onRetry={reload} />

  const hasData = entries && entries.length > 0

  return (
    <div>
      <ImportHistory summary={summary} onImported={reload} onCleared={reload} />

      {!hasData && (
        <section className="panel">
          <p className="section-state muted">
            No imported history yet. Upload your Extended Streaming History export above to see
            all-time analytics here.
          </p>
        </section>
      )}

      {hasData && children(entries)}
    </div>
  )
}
