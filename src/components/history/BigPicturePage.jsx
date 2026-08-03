import FullHistoryPage from './FullHistoryPage.jsx'
import BigPicture from './bigpicture/BigPicture.jsx'

export default function BigPicturePage() {
  return <FullHistoryPage>{(entries) => <BigPicture entries={entries} />}</FullHistoryPage>
}
