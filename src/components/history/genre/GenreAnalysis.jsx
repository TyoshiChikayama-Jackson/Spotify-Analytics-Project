import { useEffect, useState } from 'react'
import {
  resolveGenresForHistory,
  loadResolvedGenreMap,
  genreCoverage,
} from '../../../utils/genreAnalysis.js'
import { SectionError } from '../../SectionState.jsx'
import GenreResolutionProgress from './GenreResolutionProgress.jsx'
import TopGenresAllTime from './TopGenresAllTime.jsx'
import GenreTrendChart from './GenreTrendChart.jsx'
import GenreSwitchingStats from './GenreSwitchingStats.jsx'

export default function GenreAnalysis({ entries }) {
  const [status, setStatus] = useState('loading') // loading | resolving | done | error
  const [progress, setProgress] = useState(null)
  const [nameToGenres, setNameToGenres] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function run() {
      setStatus('resolving')
      try {
        await resolveGenresForHistory(entries, {
          onProgress: (p) => {
            if (!cancelled) setProgress(p)
          },
        })
        if (cancelled) return
        const map = await loadResolvedGenreMap()
        if (cancelled) return
        setNameToGenres(map)
        setStatus('done')
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          setStatus('error')
        }
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [entries])

  if (status === 'loading' || status === 'resolving') {
    return (
      <div className="card-grid">
        <div className="panel grid-card grid-card-full">
          <GenreResolutionProgress progress={progress} />
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return <SectionError message={error} />
  }

  const coverage = genreCoverage(entries, nameToGenres)

  return (
    <div className="card-grid">
      <section className="panel grid-card grid-card-full">
        <div className="panel-header">
          <h2>Genre coverage</h2>
        </div>
        <p className="section-state muted" style={{ textAlign: 'left', padding: 0 }}>
          Resolved genres for <strong>{coverage.resolvedArtists.toLocaleString()}</strong> of{' '}
          <strong>{coverage.totalArtists.toLocaleString()}</strong> distinct artists (
          {coverage.unresolvedArtists.toLocaleString()} unresolved), covering{' '}
          <strong>{coverage.coveragePercent.toFixed(1)}%</strong> of your plays. Genre stats below
          are calculated only from the plays with resolved genre data.
        </p>
      </section>

      <div className="panel grid-card grid-card-lg">
        <TopGenresAllTime entries={entries} nameToGenres={nameToGenres} />
      </div>

      <div className="panel grid-card grid-card-full">
        <GenreTrendChart entries={entries} nameToGenres={nameToGenres} />
      </div>

      <div className="panel grid-card grid-card-full">
        <GenreSwitchingStats entries={entries} nameToGenres={nameToGenres} />
      </div>
    </div>
  )
}
