import { Check, FileSearch2, LoaderCircle, LockKeyhole, Sparkles, Wifi } from 'lucide-react'

const STEPS = [
  { label: 'Connecting to analysis engine...', icon: Wifi },
  { label: 'Extracting lab values via Tesseract OCR...', icon: FileSearch2 },
  { label: 'Redacting personal identifiers (Name, Phone, UHID)...', icon: LockKeyhole },
  { label: 'Generating plain-language insights...', icon: Sparkles },
]

export default function AnalysisProgress({ activeStep = 0 }) {
  return (
    <section className="analysis-progress panel-card p-5 sm:p-7" aria-live="polite" aria-busy="true" aria-label="Report analysis progress">
      <div className="flex items-start gap-4">
        <span className="analysis-progress-icon"><LoaderCircle className="animate-spin" size={22} aria-hidden="true" /></span>
        <div>
          <p className="section-kicker">Secure processing</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">Preparing your explanation</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">The first run may take around 30 seconds while the analysis engine wakes up. Keep this page open while we work.</p>
        </div>
      </div>

      <ol className="analysis-stepper mt-6">
        {STEPS.map(({ label, icon: Icon }, index) => {
          const complete = index < activeStep
          const current = index === activeStep
          return (
            <li key={label} className={`analysis-step ${current ? 'analysis-step-current' : ''} ${complete ? 'analysis-step-complete' : ''}`}>
              <span className="analysis-step-mark">
                {complete ? <Check size={17} aria-hidden="true" /> : <Icon size={17} aria-hidden="true" />}
              </span>
              <span className="analysis-step-label">{label}</span>
              {current && <span className="analysis-step-pulse" aria-hidden="true" />}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
