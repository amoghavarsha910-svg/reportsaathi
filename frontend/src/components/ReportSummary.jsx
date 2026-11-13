import { BadgeCheck, Check, CheckCheck, ClipboardCheck, Copy, RotateCcw, Save, Stethoscope } from 'lucide-react'
import { useMemo, useState } from 'react'

export default function ReportSummary({ result, onReset, onSave, isSaving = false, saveMessage = '', isSample = false, isHistory = false }) {
  const analysis = result.analysis
  const biomarkers = analysis.biomarkers || []
  const normalCount = biomarkers.filter((item) => item.status === 'normal').length
  const attentionCount = biomarkers.filter((item) => ['high', 'low', 'borderline'].includes(item.status)).length
  const unclearCount = biomarkers.filter((item) => item.status === 'unclear').length
  const redactionCount = result.pii_redacted_count || 0
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState('')
  const [checkedQuestions, setCheckedQuestions] = useState({})

  const doctorQuestions = useMemo(() => {
    const seen = new Set()
    return biomarkers.flatMap((marker) => (marker.doctor_questions || []).map((question) => ({
      key: `${marker.test_name}:${question}`,
      testName: marker.test_name,
      question,
    }))).filter((item) => {
      if (seen.has(item.question)) return false
      seen.add(item.question)
      return true
    })
  }, [biomarkers])

  async function copySummary() {
    setCopyError('')
    try {
      await navigator.clipboard.writeText(formatShareSummary(analysis))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2200)
    } catch {
      setCopyError('Copy was unavailable in this browser. You can still select and copy the summary text.')
    }
  }

  return (
    <>
      <section className="report-summary panel-card overflow-hidden" aria-labelledby="report-summary-title">
        <div className="report-summary-top">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="section-kicker">{isSample ? 'Built-in sample report' : 'Your report, explained'}</p>
              <h2 id="report-summary-title" className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                {analysis.report_type || 'Lab Report Summary'}
              </h2>
            </div>
            <div className="summary-action-bar">
              <button type="button" className="button-secondary" onClick={copySummary}>
                {copied ? <CheckCheck size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                {copied ? 'Copied summary' : 'Copy Summary'}
              </button>
              <button type="button" className="button-secondary" onClick={onSave} disabled={isSaving}>
                <Save size={16} aria-hidden="true" />
                {isSaving ? 'Saving...' : 'Save to History'}
              </button>
              <button type="button" className="button-secondary" onClick={onReset}>
                <RotateCcw size={16} aria-hidden="true" />
                New Report
              </button>
            </div>
          </div>

          <p className="summary-lead mt-5 max-w-3xl text-base text-slate-700">{analysis.overall_summary}</p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <CountPill label="Total tests" count={biomarkers.length} tone="slate" />
            <CountPill label="Within range" count={normalCount} tone="emerald" />
            <CountPill label="Needs attention" count={attentionCount} tone={attentionCount ? 'amber' : 'emerald'} />
            <CountPill label="Needs review" count={unclearCount} tone="slate" />
          </div>

          <p className="privacy-note mt-5 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-3 py-1.5 text-xs font-medium text-teal-900">
            <BadgeCheck size={16} className="shrink-0 text-teal-700" aria-hidden="true" />
            {isSample
              ? 'Fictional sample; no patient identifiers included'
              : isHistory
                ? 'Saved scrubbed summary; uploaded report file was not stored'
                : redactionCount > 0
                  ? `${redactionCount} personal detail${redactionCount === 1 ? '' : 's'} redacted before AI analysis`
                  : 'Personal details checked; no matching identifiers found'}
          </p>
          {saveMessage && <p className="mt-3 text-sm font-medium text-teal-800" role="status">{saveMessage}</p>}
          {copyError && <p className="mt-3 text-sm font-medium text-rose-700" role="status">{copyError}</p>}
          {analysis.ocr_confidence_note && <p className="mt-3 text-sm text-slate-600">{analysis.ocr_confidence_note}</p>}
          {isSample && <p className="mt-3 text-xs text-slate-500">This is a fictional example for exploring the interface, not a real patient report.</p>}
        </div>

        {analysis.general_next_steps?.length > 0 && (
          <div className="summary-next-steps">
            <h3 className="text-sm font-semibold text-slate-800">General next steps</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {analysis.general_next_steps.map((step, index) => <li key={`${index}-${step}`}>{step}</li>)}
            </ul>
          </div>
        )}
      </section>

      <section className="doctor-visit-card panel-card" aria-labelledby="doctor-questions-title">
        <div className="doctor-visit-heading">
          <span className="doctor-visit-icon"><Stethoscope size={20} aria-hidden="true" /></span>
          <div>
            <p className="section-kicker">Take this to your appointment</p>
            <h3 id="doctor-questions-title" className="mt-1 text-lg font-semibold text-slate-900">Questions to Ask Your Doctor</h3>
            <p className="mt-1 text-sm text-slate-600">Choose the questions you want to bring up. These are conversation prompts, not a care plan.</p>
          </div>
          <span className="doctor-question-count">{doctorQuestions.length}</span>
        </div>
        {doctorQuestions.length > 0 ? (
          <ul className="doctor-question-list">
            {doctorQuestions.map((item) => (
              <li key={item.key}>
                <label className={`doctor-question ${checkedQuestions[item.key] ? 'doctor-question-checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={Boolean(checkedQuestions[item.key])}
                    onChange={(event) => setCheckedQuestions((current) => ({ ...current, [item.key]: event.target.checked }))}
                  />
                  <span className="doctor-question-content">
                    <span className="doctor-question-test">{item.testName}</span>
                    <span>{item.question}</span>
                  </span>
                  {checkedQuestions[item.key] && <Check size={17} className="doctor-question-check" aria-hidden="true" />}
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <div className="doctor-question-empty">
            <ClipboardCheck size={20} aria-hidden="true" />
            <p>Ask your clinician which results are most useful to discuss in the context of your health history.</p>
          </div>
        )}
      </section>
    </>
  )
}

function formatShareSummary(analysis) {
  const biomarkers = analysis.biomarkers || []
  const lines = [
    'ReportSaathi — Educational Lab Summary',
    `Panel: ${analysis.report_type || 'Lab report'}`,
    '',
    analysis.overall_summary || '',
    '',
    'Results snapshot',
    ...biomarkers.map((marker) => {
      const value = [marker.observed_value, marker.unit].filter(Boolean).join(' ')
      const range = marker.reference_range ? ` (reference: ${marker.reference_range})` : ''
      return `• ${marker.test_name}: ${value || 'Value not shown'} — ${marker.status}${range}\n  ${marker.simple_explanation}`
    }),
  ]

  if (analysis.general_next_steps?.length) {
    lines.push('', 'General next steps', ...analysis.general_next_steps.map((step) => `• ${step}`))
  }

  const questions = [...new Set(biomarkers.flatMap((marker) => marker.doctor_questions || []))]
  if (questions.length) {
    lines.push('', 'Questions to ask your doctor', ...questions.map((question) => `• ${question}`))
  }

  lines.push('', 'Educational use only — discuss results with a qualified clinician.')
  return lines.join('\n')
}

function CountPill({ label, count, tone }) {
  const tones = {
    slate: 'count-pill-slate',
    emerald: 'count-pill-emerald',
    amber: 'count-pill-amber',
  }
  return (
    <div className={`count-pill ${tones[tone]}`}>
      <span>{label}</span>
      <span className="text-xl font-semibold tabular-nums">{count}</span>
    </div>
  )
}
