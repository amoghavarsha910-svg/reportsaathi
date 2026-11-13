import { BadgeCheck, RotateCcw, Save } from 'lucide-react'

export default function ReportSummary({ result, onReset, onSave, isSaving = false, saveMessage = '', isSample = false, isHistory = false }) {
  const analysis = result.analysis
  const biomarkers = analysis.biomarkers || []
  const normalCount = biomarkers.filter((item) => item.status === 'normal').length
  const attentionCount = biomarkers.length - normalCount
  const redactionCount = result.pii_redacted_count || 0

  return (
    <section className="panel-card overflow-hidden" aria-labelledby="report-summary-title">
      <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50/80 to-white p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="section-kicker">{isSample ? 'Built-in sample report' : 'Your report, explained'}</p>
            <h2 id="report-summary-title" className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
              {analysis.report_type || 'Lab Report Summary'}
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="button-secondary shrink-0" onClick={onSave} disabled={isSaving}>
              <Save size={16} aria-hidden="true" />
              {isSaving ? 'Saving...' : 'Save Summary to History'}
            </button>
            <button type="button" className="button-secondary shrink-0" onClick={onReset}>
              <RotateCcw size={17} aria-hidden="true" />
              Analyze Another Report
            </button>
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-[15px] leading-7 text-slate-700">{analysis.overall_summary}</p>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <CountPill label="Total Tests" count={biomarkers.length} tone="slate" />
          <CountPill label="Normal" count={normalCount} tone="emerald" />
          <CountPill label="Attention Needed" count={attentionCount} tone={attentionCount ? 'amber' : 'emerald'} />
        </div>

        <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-3 py-1.5 text-xs font-medium text-teal-900">
          <BadgeCheck size={16} className="text-teal-700" aria-hidden="true" />
          {isSample
            ? 'Fictional sample; no patient identifiers included'
            : isHistory
              ? 'Saved scrubbed summary; uploaded report file was not stored'
            : redactionCount > 0
              ? `${redactionCount} personal detail${redactionCount === 1 ? '' : 's'} redacted before AI analysis`
              : 'Personal details checked; no matching identifiers found'}
        </p>
        {saveMessage && <p className="mt-2 text-sm font-medium text-teal-800" role="status">{saveMessage}</p>}
        {analysis.ocr_confidence_note && <p className="mt-3 text-sm text-slate-600">{analysis.ocr_confidence_note}</p>}
        {isSample && <p className="mt-3 text-xs text-slate-500">This is a fictional example for exploring the interface, not a real patient report.</p>}
      </div>

      {analysis.general_next_steps?.length > 0 && (
        <div className="p-5 sm:p-7">
          <h3 className="text-sm font-semibold text-slate-800">General next steps</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
            {analysis.general_next_steps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}
          </ul>
        </div>
      )}
    </section>
  )
}

function CountPill({ label, count, tone }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-800',
    emerald: 'bg-emerald-50 text-emerald-800',
    amber: 'bg-amber-50 text-amber-900',
  }
  return (
    <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${tones[tone]}`}>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xl font-semibold tabular-nums">{count}</span>
    </div>
  )
}
