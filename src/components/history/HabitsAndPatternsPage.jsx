import FullHistoryPage from './FullHistoryPage.jsx'
import HabitsAndPatterns from './habits/HabitsAndPatterns.jsx'

export default function HabitsAndPatternsPage() {
  return <FullHistoryPage>{(entries) => <HabitsAndPatterns entries={entries} />}</FullHistoryPage>
}
