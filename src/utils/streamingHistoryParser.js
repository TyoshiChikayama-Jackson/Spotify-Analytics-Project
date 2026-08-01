import JSZip from 'jszip'

// A raw Extended Streaming History JSON file is an array of entries. Podcast/
// audiobook entries carry episode_name/episode_show_name instead of track
// fields — this importer is music-only, so those are dropped.
function isMusicEntry(raw) {
  return Boolean(raw.spotify_track_uri) && raw.master_metadata_track_name != null
}

function normalizeEntry(raw) {
  return {
    id: `${raw.spotify_track_uri}-${raw.ts}`,
    timestamp: raw.ts,
    trackName: raw.master_metadata_track_name,
    artistName: raw.master_metadata_album_artist_name,
    albumName: raw.master_metadata_album_album_name,
    trackUri: raw.spotify_track_uri,
    msPlayed: raw.ms_played ?? 0,
    reasonStart: raw.reason_start ?? null,
    reasonEnd: raw.reason_end ?? null,
    shuffle: Boolean(raw.shuffle),
    skipped: raw.skipped ?? null,
    platform: raw.platform ?? null,
    country: raw.conn_country ?? null,
  }
}

// Parses one Extended Streaming History JSON file's text content into
// normalized music-only entries.
export function parseStreamingHistoryJson(jsonText) {
  const raw = JSON.parse(jsonText)
  if (!Array.isArray(raw)) {
    throw new Error('Expected a JSON array of streaming history entries')
  }
  return raw.filter(isMusicEntry).map(normalizeEntry)
}

// True for files that look like Extended Streaming History exports, so
// non-matching JSON in a zip (e.g. Marquee.json, Follow.json) can be skipped.
function looksLikeStreamingHistoryFile(filename) {
  return /Streaming_History_Audio.*\.json$/i.test(filename)
}

// Reads a set of already-extracted .json File objects and returns the
// combined, normalized, music-only entries plus per-file stats.
export async function parseJsonFiles(files, { onProgress } = {}) {
  const entries = []
  const fileResults = []

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i]
    onProgress?.({ stage: 'parsing', fileIndex: i, fileCount: files.length, fileName: file.name })

    const text = await file.text()
    const parsed = parseStreamingHistoryJson(text)
    entries.push(...parsed)
    fileResults.push({ fileName: file.name, entryCount: parsed.length })
  }

  return { entries, fileResults }
}

// Reads a .zip export, extracts every Streaming_History_Audio_*.json member,
// and returns the combined normalized entries plus per-file stats.
export async function parseZipFile(zipFile, { onProgress } = {}) {
  onProgress?.({ stage: 'unzipping' })
  const zip = await JSZip.loadAsync(zipFile)

  const historyEntries = Object.values(zip.files).filter(
    (entry) => !entry.dir && looksLikeStreamingHistoryFile(entry.name),
  )

  if (historyEntries.length === 0) {
    throw new Error(
      'No Streaming_History_Audio_*.json files found in this zip. Make sure it is the ' +
        '"Extended Streaming History" export, not the shorter account-data export.',
    )
  }

  const entries = []
  const fileResults = []

  for (let i = 0; i < historyEntries.length; i += 1) {
    const zipEntry = historyEntries[i]
    onProgress?.({
      stage: 'parsing',
      fileIndex: i,
      fileCount: historyEntries.length,
      fileName: zipEntry.name,
    })

    const text = await zipEntry.async('text')
    const parsed = parseStreamingHistoryJson(text)
    entries.push(...parsed)
    fileResults.push({ fileName: zipEntry.name, entryCount: parsed.length })
  }

  return { entries, fileResults }
}

// Entry point for the upload UI: dispatches to zip or multi-JSON parsing
// based on what was selected, and de-duplicates by id (a track can appear in
// more than one export chunk if the user re-requests overlapping ranges).
export async function parseImportedFiles(fileList, { onProgress } = {}) {
  const files = Array.from(fileList)
  if (files.length === 0) {
    throw new Error('No files selected')
  }

  const isZip = files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')
  const { entries, fileResults } = isZip
    ? await parseZipFile(files[0], { onProgress })
    : await parseJsonFiles(files, { onProgress })

  onProgress?.({ stage: 'deduplicating' })
  const byId = new Map(entries.map((entry) => [entry.id, entry]))
  const deduped = [...byId.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp))

  return { entries: deduped, fileResults, duplicateCount: entries.length - deduped.length }
}
