const RANGES = [
  { value: 'short_term', label: '4 weeks' },
  { value: 'medium_term', label: '6 months' },
  { value: 'long_term', label: 'Years' },
]

export default function TimeRangeToggle({ value, onChange }) {
  return (
    <div className="time-range-toggle" role="tablist" aria-label="Time range">
      {RANGES.map((range) => (
        <button
          key={range.value}
          role="tab"
          aria-selected={value === range.value}
          className={`toggle-tab ${value === range.value ? 'active' : ''}`}
          onClick={() => onChange(range.value)}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}
