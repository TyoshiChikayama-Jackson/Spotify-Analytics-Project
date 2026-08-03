import FullHistoryPage from './FullHistoryPage.jsx'
import GenreAnalysis from './genre/GenreAnalysis.jsx'

export default function GenreAnalysisPage() {
  return <FullHistoryPage>{(entries) => <GenreAnalysis entries={entries} />}</FullHistoryPage>
}
