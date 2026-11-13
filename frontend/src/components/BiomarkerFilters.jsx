import { Search, SlidersHorizontal } from 'lucide-react'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'attention', label: 'Needs Attention' },
  { value: 'normal', label: 'Within Reference Range' },
]

export default function BiomarkerFilters({
  query,
  onQueryChange,
  filter,
  onFilterChange,
  groupByCategory,
  onGroupChange,
  resultCount,
}) {
  return (
    <section className="panel-card p-4 sm:p-5" aria-label="Filter biomarkers">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search tests or categories"
            className="search-input"
            aria-label="Search biomarkers by test or category"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by status">
          {FILTERS.map((option) => (
            <button
              type="button"
              key={option.value}
              aria-pressed={filter === option.value}
              onClick={() => onFilterChange(option.value)}
              className={`filter-pill ${filter === option.value ? 'filter-pill-active' : ''}`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <SlidersHorizontal size={16} aria-hidden="true" />
          Group by
          <select value={groupByCategory ? 'category' : 'none'} onChange={(event) => onGroupChange(event.target.value === 'category')} className="select-input">
            <option value="category">Category</option>
            <option value="none">None</option>
          </select>
        </label>
      </div>
      <p className="mt-3 text-xs text-slate-500">Showing {resultCount} test{resultCount === 1 ? '' : 's'}</p>
    </section>
  )
}
