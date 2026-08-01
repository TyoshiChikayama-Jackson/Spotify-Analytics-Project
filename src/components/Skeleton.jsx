export function SkeletonRows({ count = 5 }) {
  return (
    <div className="skeleton-stack">
      {Array.from({ length: count }, (_, i) => (
        <div className="skeleton-row" key={i}>
          <span className="skeleton skeleton-thumb" />
          <span className="skeleton-lines">
            <span className="skeleton skeleton-line" style={{ width: '55%' }} />
            <span className="skeleton skeleton-line" style={{ width: '35%' }} />
          </span>
        </div>
      ))}
    </div>
  )
}

export function SkeletonChart({ height = 200 }) {
  return <span className="skeleton skeleton-chart" style={{ height }} />
}
