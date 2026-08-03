import FullHistoryPage from './FullHistoryPage.jsx'
import ObsessionAndLoyalty from './loyalty/ObsessionAndLoyalty.jsx'

export default function ObsessionAndLoyaltyPage() {
  return <FullHistoryPage>{(entries) => <ObsessionAndLoyalty entries={entries} />}</FullHistoryPage>
}
