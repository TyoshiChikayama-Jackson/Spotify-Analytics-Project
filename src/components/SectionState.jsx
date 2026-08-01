import { SkeletonRows, SkeletonChart } from './Skeleton.jsx'

export function SectionLoading({ variant = 'rows', count }) {
  if (variant === 'chart') {
    return <SkeletonChart />
  }
  return <SkeletonRows count={count} />
}

export function SectionError({ message, onRetry }) {
  return (
    <div className="section-state">
      <p className="error">{message}</p>
      {onRetry && (
        <button className="secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function SectionEmpty({ children }) {
  return <p className="section-state muted">{children}</p>
}

export function RefreshButton({ onClick, disabled }) {
  return (
    <button className="secondary refresh-button" onClick={onClick} disabled={disabled}>
      {disabled ? 'Refreshing…' : 'Refresh'}
    </button>
  )
}
