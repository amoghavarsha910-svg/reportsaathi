import { ChevronDown, CircleHelp, Ruler } from 'lucide-react'

const STATUS_STYLE = {
  normal: { label: 'Within range', badge: 'badge-normal', card: 'marker-card-normal', pin: 'pin-normal', fallback: 'fallback-normal' },
  borderline: { label: 'Borderline', badge: 'badge-borderline', card: 'marker-card-borderline', pin: 'pin-borderline', fallback: 'fallback-borderline' },
  high: { label: 'High', badge: 'badge-high', card: 'marker-card-attention', pin: 'pin-attention', fallback: 'fallback-high' },
  low: { label: 'Low', badge: 'badge-high', card: 'marker-card-attention', pin: 'pin-attention', fallback: 'fallback-low' },
  unclear: { label: 'Unclear', badge: 'badge-unclear', card: 'marker-card-unclear', pin: 'pin-unclear', fallback: 'fallback-unclear' },
}

const NUMBER = '[-+]?(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?'
const RANGE_PATTERN = new RegExp(`^\\s*(${NUMBER})\\s*(?:-|–|—|to)\\s*(${NUMBER})(?:\\s|$|[a-z])`, 'i')
const VALUE_PATTERN = new RegExp(`^\\s*(${NUMBER})\\s*$`)

function parseNumericRange(referenceRange) {
  if (typeof referenceRange !== 'string') return null
  const match = referenceRange.match(RANGE_PATTERN)
  if (!match) return null

  const min = Number(match[1].replaceAll(',', ''))
  const max = Number(match[2].replaceAll(',', ''))
  return Number.isFinite(min) && Number.isFinite(max) && max > min ? { min, max } : null
}

function parseNumericValue(observedValue) {
  const match = String(observedValue ?? '').match(VALUE_PATTERN)
  if (!match) return null
  const value = Number(match[1].replaceAll(',', ''))
  return Number.isFinite(value) ? value : null
}

function NumericRangeBar({ biomarker, visual, numericRange, value }) {
  const span = numericRange.max - numericRange.min
  const scaleMin = numericRange.min - span * 0.5
  const scaleMax = numericRange.max + span * 0.5
  const markerPosition = value === null ? null : Math.max(0, Math.min(100, ((value - scaleMin) / (scaleMax - scaleMin)) * 100))

  return (
    <div className="range-block">
      <div className="range-heading">
        <span><Ruler size={14} aria-hidden="true" /> Numeric reference range</span>
        <span>{biomarker.unit || 'Value scale'}</span>
      </div>
      <div
        className="numeric-range-track"
        role="img"
        aria-label={`Low zone, normal zone from ${numericRange.min} to ${numericRange.max}, high zone${value === null ? '' : `, observed value ${biomarker.observed_value} ${biomarker.unit || ''}`}`}
      >
        <span className="range-zone range-zone-low" />
        <span className="range-zone range-zone-normal" />
        <span className="range-zone range-zone-high" />
        {markerPosition !== null && <span className={`range-marker ${visual.pin}`} style={{ left: `${markerPosition}%` }} />}
      </div>
      <div className="range-scale-labels">
        <span>Low</span>
        <span>{numericRange.min}–{numericRange.max} {biomarker.unit}</span>
        <span>High</span>
      </div>
      <p className="range-caption">
        {value === null
          ? 'The observed value could not be placed on this numeric scale.'
          : `Observed: ${biomarker.observed_value}${biomarker.unit ? ` ${biomarker.unit}` : ''}`}
      </p>
    </div>
  )
}

function QualitativeRangeCue({ visual, status }) {
  return (
    <div className="range-block">
      <div className="range-heading"><span><Ruler size={14} aria-hidden="true" /> Status reference cue</span><span>Not to scale</span></div>
      <div className="qualitative-range-track" role="img" aria-label={`Qualitative status cue: ${visual.label}; not to scale`}>
        <span className="range-zone range-zone-low" />
        <span className="range-zone range-zone-normal" />
        <span className="range-zone range-zone-high" />
        <span className={`range-marker ${visual.fallback} ${status === 'low' ? 'fallback-marker-low' : status === 'high' ? 'fallback-marker-high' : ''}`} />
      </div>
      <div className="range-scale-labels"><span>Below</span><span>Reference area</span><span>Above</span></div>
      <p className="range-caption">No numeric min–max reference bounds were available to scale this result.</p>
    </div>
  )
}

export default function BiomarkerCard({ biomarker }) {
  const visual = STATUS_STYLE[biomarker.status] || STATUS_STYLE.unclear
  const numericRange = parseNumericRange(biomarker.reference_range)
  const numericValue = parseNumericValue(biomarker.observed_value)

  return (
    <article className={`biomarker-card panel-card ${visual.card}`}>
      <div className="biomarker-card-heading">
        <div className="min-w-0">
          <p className="biomarker-category">{biomarker.category || 'Other tests'}</p>
          <h4 className="mt-1 text-lg font-semibold text-slate-900">{biomarker.test_name}</h4>
        </div>
        <span className={`status-badge ${visual.badge}`}>{visual.label}</span>
      </div>

      <div className="biomarker-values">
        <div className="observed-value-card">
          <p className="value-label">Observed value</p>
          <p className="observed-value">
            {biomarker.observed_value}
            {biomarker.unit ? <span>{biomarker.unit}</span> : null}
          </p>
        </div>
        <div className="reference-value-card">
          <p className="value-label">Lab reference range</p>
          <p className="reference-value">{biomarker.reference_range || 'Not shown on report'}</p>
        </div>
      </div>

      {numericRange
        ? <NumericRangeBar biomarker={biomarker} visual={visual} numericRange={numericRange} value={numericValue} />
        : <QualitativeRangeCue visual={visual} status={biomarker.status} />}

      <div className="meaning-block">
        <p className="meaning-label">In plain language</p>
        <p className="meaning-copy">{biomarker.simple_explanation}</p>
      </div>

      {(biomarker.what_can_affect_it || []).length > 0 && (
        <details className="factors-details group">
          <summary>
            <span><CircleHelp size={16} aria-hidden="true" /> Common factors that can influence this</span>
            <ChevronDown size={17} className="shrink-0 transition group-open:rotate-180" aria-hidden="true" />
          </summary>
          <ul>
            {biomarker.what_can_affect_it.map((factor) => <li key={factor}>{factor}</li>)}
          </ul>
        </details>
      )}
    </article>
  )
}
