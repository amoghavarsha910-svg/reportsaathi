import { ShieldAlert } from 'lucide-react'

const DISCLAIMER = 'Educational Tool Only: ReportSaathi simplifies lab terminology to help you prepare for doctor visits. It does not provide medical diagnoses or treatment advice.'

export default function DisclaimerBanner({ placement = 'top' }) {
  return (
    <aside
      className={`educational-disclaimer ${placement === 'bottom' ? 'educational-disclaimer-bottom' : ''}`}
      role="note"
      aria-label="Educational use disclaimer"
    >
      <ShieldAlert size={19} className="mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
      <p>{DISCLAIMER}</p>
    </aside>
  )
}
