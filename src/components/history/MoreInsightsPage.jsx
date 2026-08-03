import FullHistoryPage from './FullHistoryPage.jsx'
import MoreInsights from './moreinsights/MoreInsights.jsx'

export default function MoreInsightsPage() {
  return <FullHistoryPage>{(entries) => <MoreInsights entries={entries} />}</FullHistoryPage>
}
