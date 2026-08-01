import { useRef, useState } from 'react'
import { parseImportedFiles } from '../../utils/streamingHistoryParser.js'
import { saveHistory, clearHistory } from '../../utils/historyStorage.js'

const STAGE_LABELS = {
  unzipping: 'Unzipping…',
  parsing: 'Parsing files…',
  deduplicating: 'Deduplicating entries…',
  saving: 'Saving to local storage…',
}

export default function ImportHistory({ summary, onImported, onCleared }) {
  const inputRef = useRef(null)
  const [status, setStatus] = useState('idle') // idle | working | done | error
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleFiles(fileList) {
    setStatus('working')
    setError(null)
    setResult(null)

    try {
      const { entries, fileResults, duplicateCount } = await parseImportedFiles(fileList, {
        onProgress: setProgress,
      })

      setProgress({ stage: 'saving' })
      await saveHistory(entries, { fileResults })

      setResult({ entryCount: entries.length, fileResults, duplicateCount })
      setStatus('done')
      onImported?.()
    } catch (err) {
      setError(err.message)
      setStatus('error')
    } finally {
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function handleClear() {
    await clearHistory()
    setResult(null)
    setStatus('idle')
    onCleared?.()
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Import History</h2>
      </div>

      <p className="privacy-note">
        <strong>Nothing leaves your browser.</strong> This site has no backend — your export
        file is parsed and stored entirely on your own device (in IndexedDB). It is never
        uploaded anywhere.
      </p>

      <p className="muted small">
        Request your data from{' '}
        <a href="https://www.spotify.com/account/privacy/" target="_blank" rel="noreferrer">
          Spotify's Privacy settings
        </a>{' '}
        and choose <strong>Extended streaming history</strong>. Once it arrives (can take up to
        30 days), upload the <code>.zip</code> here, or the extracted{' '}
        <code>Streaming_History_Audio_*.json</code> files directly.
      </p>

      {summary && status !== 'working' && (
        <div className="import-summary">
          <p>
            Currently storing <strong>{summary.entryCount.toLocaleString()}</strong> plays,
            imported {new Date(summary.importedAt).toLocaleString()}.
          </p>
          <button className="secondary" onClick={handleClear}>
            Clear stored history
          </button>
        </div>
      )}

      <div className="import-controls">
        <input
          ref={inputRef}
          type="file"
          accept=".zip,.json"
          multiple
          disabled={status === 'working'}
          onChange={(event) => {
            if (event.target.files.length > 0) handleFiles(event.target.files)
          }}
        />
      </div>

      {status === 'working' && (
        <p className="section-state muted">
          {STAGE_LABELS[progress?.stage] ?? 'Working…'}
          {progress?.stage === 'parsing' && progress.fileCount > 1
            ? ` (${progress.fileIndex + 1}/${progress.fileCount}: ${progress.fileName})`
            : ''}
        </p>
      )}

      {status === 'error' && <p className="error">{error}</p>}

      {status === 'done' && result && (
        <div className="import-summary">
          <p>
            Imported <strong>{result.entryCount.toLocaleString()}</strong> track plays from{' '}
            {result.fileResults.length} file{result.fileResults.length === 1 ? '' : 's'}.
            {result.duplicateCount > 0 &&
              ` (${result.duplicateCount.toLocaleString()} duplicate entries were merged.)`}
          </p>
        </div>
      )}
    </section>
  )
}
