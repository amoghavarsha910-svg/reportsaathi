import { Check, LoaderCircle, ScanText, ShieldCheck, Languages } from 'lucide-react'

const STEPS = [
  { label: '1. Extracting text...', icon: ScanText },
  { label: '2. Redacting personal details...', icon: ShieldCheck },
  { label: '3. Translating lab terms...', icon: Languages },
]

export default function AnalysisProgress({ activeStep = 0 }) {
  return (
    <section className="panel-card p-5" aria-live="polite" aria-busy="true">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-teal-50 p-2.5 text-teal-800"><LoaderCircle className="animate-spin" size={20} aria-hidden="true" /></span>
        <div>
          <h2 className="font-semibold text-slate-900">Preparing your explanation</h2>
          <p className="text-sm text-slate-500">This usually takes a few moments.</p>
        </div>
      </div>
      <ol className="mt-5 grid gap-3 sm:grid-cols-3">
        {STEPS.map(({ label, icon: Icon }, index) => {
          const complete = index < activeStep
          const current = index === activeStep
          return (
            <li key={label} className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium ${current ? 'bg-teal-50 text-teal-900' : complete ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-50 text-slate-400'}`}>
              {complete ? <Check size={16} aria-hidden="true" /> : <Icon size={16} aria-hidden="true" />}
              {label}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
