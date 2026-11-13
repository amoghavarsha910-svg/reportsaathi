import { CheckCheck, ChevronDown, Copy, HelpCircle } from 'lucide-react'
import { useState } from 'react'

const STATUS_STYLE = {
  normal: { label: 'Normal', badge: 'bg-emerald-100 text-emerald-800', card: 'border-emerald-100', marker: 'left-1/2 bg-emerald-600' },
  borderline: { label: 'Borderline', badge: 'bg-amber-100 text-amber-900', card: 'border-amber-200', marker: 'left-[72%] bg-amber-600' },
  high: { label: 'High', badge: 'bg-rose-100 text-rose-800', card: 'border-rose-200', marker: 'left-[91%] bg-rose-600' },
  low: { label: 'Low', badge: 'bg-rose-100 text-rose-800', card: 'border-rose-200', marker: 'left-[9%] bg-rose-600' },
  unclear: { label: 'Unclear', badge: 'bg-slate-200 text-slate-700', card: 'border-slate-200', marker: 'left-1/2 bg-slate-500' },
}

export default function BiomarkerCard({ biomarker }) {
  const [checked, setChecked] = useState({})
  const [copied, setCopied] = useState(false)
  const visual = STATUS_STYLE[biomarker.status] || STATUS_STYLE.unclear
  const questions = biomarker.doctor_questions || []

  async function copyQuestions() {
    if (!questions.length) return
    try {
      await navigator.clipboard.writeText(questions.map((question) => `- ${question}`).join('\n'))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <article className={`panel-card border ${visual.card} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{biomarker.category}</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{biomarker.test_name}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${visual.badge}`}>{visual.label}</span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Observed value</p>
          <p className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            {biomarker.observed_value}{biomarker.unit ? <span className="ml-1 text-sm font-medium text-slate-600">{biomarker.unit}</span> : null}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Reference range</p>
          <p className="mt-1 text-base font-semibold text-slate-800">{biomarker.reference_range || 'Not shown'}</p>
        </div>
      </div>

      <div className="mt-4" aria-label={`Qualitative range cue: ${visual.label}; not to scale`}>
        <div className="relative h-2 rounded-full bg-slate-100">
          <span className="absolute left-1/4 top-0 h-2 w-1/2 rounded-full bg-emerald-100" />
          <span className={`absolute top-1/2 z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ${visual.marker}`} />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] font-medium uppercase tracking-wider text-slate-400">
          <span>Below</span><span>Reference area</span><span>Above</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-400">Visual status cue only; not a numeric scale.</p>
      </div>

      <p className="mt-5 text-sm leading-6 text-slate-700">{biomarker.simple_explanation}</p>

      <details className="group mt-4 border-t border-slate-100 pt-3">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-800 marker:hidden">
          Common factors that influence this
          <ChevronDown size={17} className="shrink-0 text-slate-500 transition group-open:rotate-180" aria-hidden="true" />
        </summary>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
          {(biomarker.what_can_affect_it || []).map((factor) => <li key={factor}>{factor}</li>)}
        </ul>
      </details>

      <div className="mt-4 border-t border-slate-100 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <HelpCircle size={16} className="text-teal-700" aria-hidden="true" />
            Questions to ask your doctor
          </h4>
          <button type="button" className="copy-button" onClick={copyQuestions} disabled={!questions.length}>
            {copied ? <CheckCheck size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy questions'}
          </button>
        </div>
        <ul className="mt-3 space-y-2">
          {questions.map((question, index) => (
            <li key={question}>
              <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-5 text-slate-600">
                <input
                  type="checkbox"
                  className="mt-1 accent-teal-700"
                  checked={Boolean(checked[index])}
                  onChange={(event) => setChecked((previous) => ({ ...previous, [index]: event.target.checked }))}
                />
                <span>{question}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
