import { useCallback, useEffect, useState } from 'react'
import { loadHistory, loadImportSummary } from '../../utils/historyStorage.js'
import { SectionLoading, SectionError } from '../SectionState.jsx'
import ImportHistory from './ImportHistory.jsx'
import HistoryHighlights from './HistoryHighlights.jsx'
import HoursByYearChart from './HoursByYearChart.jsx'
import ListeningOverTimeChart from './ListeningOverTimeChart.jsx'
import ListeningHeatmap from './ListeningHeatmap.jsx'
import SkipRateChart from './SkipRateChart.jsx'
import TopAllTime from './TopAllTime.jsx'
import HabitsAndPatterns from './habits/HabitsAndPatterns.jsx'
import ObsessionAndLoyalty from './loyalty/ObsessionAndLoyalty.jsx'
import BigPicture from './bigpicture/BigPicture.jsx'

export default function FullHistory() {
  const [entries, setEntries] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [storedEntries, storedSummary] = await Promise.all([
        loadHistory(),
        loadImportSummary(),
      ])
      setEntries(storedEntries)
      setSummary(storedSummary)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return <SectionLoading />
  }

  if (error) {
    return <SectionError message={error} onRetry={load} />
  }

  const hasData = entries && entries.length > 0

  return (
    <div>
      <ImportHistory summary={summary} onImported={load} onCleared={load} />

      {!hasData && (
        <section className="panel">
          <p className="section-state muted">
            No imported history yet. Upload your Extended Streaming History export above to see
            all-time analytics here.
          </p>
        </section>
      )}

      {hasData && (
        <>
          <section className="panel">
            <div className="panel-header">
              <h2>Highlights</h2>
            </div>
            <HistoryHighlights entries={entries} />
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>Listening over time</h2>
            </div>
            <div className="chart-grid">
              <HoursByYearChart entries={entries} />
              <ListeningOverTimeChart entries={entries} />
            </div>
            <SkipRateChart entries={entries} />
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>When you listen</h2>
            </div>
            <ListeningHeatmap entries={entries} />
          </section>

          <section className="panel">
            <div className="panel-header">
              <h2>All-time favorites</h2>
            </div>
            <TopAllTime entries={entries} />
          </section>

          <HabitsAndPatterns entries={entries} />
          <ObsessionAndLoyalty entries={entries} />
          <BigPicture entries={entries} />
        </>
      )}
    </div>
  )
}
