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
import ListeningBehavior from './behavior/ListeningBehavior.jsx'
import MoreInsights from './moreinsights/MoreInsights.jsx'

const SUB_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'habits', label: 'Habits & Patterns' },
  { id: 'loyalty', label: 'Obsession & Loyalty' },
  { id: 'bigpicture', label: 'Bigger Picture' },
  { id: 'behavior', label: 'Listening Behavior' },
  { id: 'moreinsights', label: 'More Insights' },
]

function Overview({ entries }) {
  return (
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
    </>
  )
}

export default function FullHistory() {
  const [entries, setEntries] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [subTab, setSubTab] = useState(SUB_TABS[0].id)

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
          <nav className="tab-nav" role="tablist" aria-label="Full History sections">
            {SUB_TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={subTab === tab.id}
                className={`tab-nav-item ${subTab === tab.id ? 'active' : ''}`}
                onClick={() => setSubTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div key={subTab} className="tab-panel">
            {subTab === 'overview' && <Overview entries={entries} />}
            {subTab === 'habits' && <HabitsAndPatterns entries={entries} />}
            {subTab === 'loyalty' && <ObsessionAndLoyalty entries={entries} />}
            {subTab === 'bigpicture' && <BigPicture entries={entries} />}
            {subTab === 'behavior' && <ListeningBehavior entries={entries} />}
            {subTab === 'moreinsights' && <MoreInsights entries={entries} />}
          </div>
        </>
      )}
    </div>
  )
}
