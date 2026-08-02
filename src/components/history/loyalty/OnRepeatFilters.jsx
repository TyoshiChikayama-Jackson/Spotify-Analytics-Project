const MIN_PLAYS_OPTIONS = [10, 15, 20, 30]

export default function OnRepeatFilters({
  years,
  selectedYear,
  onYearChange,
  query,
  onQueryChange,
  sortOrder,
  onSortOrderChange,
  minPlays,
  onMinPlaysChange,
}) {
  return (
    <div className="on-repeat-filters">
      <div className="on-repeat-filters-row">
        <input
          type="text"
          className="artist-search-input"
          placeholder="Search track or artist…"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
        <select
          className="artist-select on-repeat-sort-select"
          value={sortOrder}
          onChange={(event) => onSortOrderChange(event.target.value)}
        >
          <option value="recent">Most recent first</option>
          <option value="intensity">Highest play count first</option>
        </select>
      </div>

      {years.length > 1 && (
        <div className="chip-row">
          <button
            className={`filter-chip ${selectedYear === 'all' ? 'active' : ''}`}
            onClick={() => onYearChange('all')}
          >
            All years
          </button>
          {years.map((year) => (
            <button
              key={year}
              className={`filter-chip ${selectedYear === year ? 'active' : ''}`}
              onClick={() => onYearChange(year)}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      <div className="chip-row">
        {MIN_PLAYS_OPTIONS.map((option) => (
          <button
            key={option}
            className={`filter-chip ${minPlays === option ? 'active' : ''}`}
            onClick={() => onMinPlaysChange(minPlays === option ? MIN_PLAYS_OPTIONS[0] : option)}
          >
            {option}+ plays
          </button>
        ))}
      </div>
    </div>
  )
}
