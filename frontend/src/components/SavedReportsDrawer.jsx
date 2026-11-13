import { Clock3, FileText, LoaderCircle, LogIn, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { isAuthRequiredError } from '../lib/session.js'

export default function SavedReportsDrawer({ open, session, onClose, onSignIn, onRequireSignIn, onLoad, listSavedReports, deleteSavedReport }) {
  const [reports, setReports] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')
  useEffect(() => {
    if (!open || !session) return undefined
    let active = true
    async function loadReports() {
      setBusy(true)
      setError('')
      try {
        const data = await listSavedReports()
        if (active) setReports(data)
      } catch (requestError) {
        if (!active) return
        if (isAuthRequiredError(requestError)) onRequireSignIn?.()
        else setError(requestError.message || 'Could not load saved reports.')
      } finally {
        if (active) setBusy(false)
      }
    }
    loadReports()
    return () => { active = false }
  }, [open, session, listSavedReports, onRequireSignIn])

  async function deleteReport(report) {
    if (!window.confirm(`Delete “${report.title}” from your history?`)) return
    setDeletingId(report.id)
    setError('')
    try {
      await deleteSavedReport(report.id)
      setReports((current) => current.filter((item) => item.id !== report.id))
    } catch (requestError) {
      if (isAuthRequiredError(requestError)) onRequireSignIn?.()
      else setError(requestError.message || 'Could not delete this report.')
    } finally {
      setDeletingId('')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 bg-slate-950/35" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="history-drawer ml-auto flex h-full w-full max-w-md flex-col bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-5">
          <div>
            <p className="section-kicker">Private to your account</p>
            <h2 id="history-title" className="mt-1 text-xl font-semibold text-slate-900">My Saved Reports</h2>
          </div>
          <button type="button" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Close saved reports" onClick={onClose}>
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        {!session ? (
          <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
            <span className="rounded-2xl bg-teal-50 p-4 text-teal-800"><Clock3 size={27} aria-hidden="true" /></span>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">History is optional</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Sign in to save summaries across devices. You can continue using ReportSaathi as a guest without an account.</p>
            <button type="button" className="button-primary mt-5" onClick={onSignIn}><LogIn size={17} aria-hidden="true" /> Sign In</button>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            {busy && <p className="flex items-center gap-2 py-8 text-sm text-slate-500"><LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> Loading your reports...</p>}
            {error && <p className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800" role="alert">{error}</p>}
            {!busy && !error && reports.length === 0 && <p className="py-10 text-center text-sm leading-6 text-slate-500">No saved summaries yet. Analyze a report and save its summary to find it here.</p>}
            <ul className="space-y-3">
              {reports.map((report) => (
                <li key={report.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <span className="rounded-xl bg-teal-50 p-2 text-teal-800"><FileText size={19} aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{report.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{report.created_at ? new Date(report.created_at).toLocaleString() : 'Saved report'}</p>
                      {report.summary?.overall_summary && <p className="mt-2 line-clamp-3 text-sm leading-5 text-slate-600">{report.summary.overall_summary}</p>}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" className="button-secondary" onClick={() => onLoad(report)}>Reload</button>
                    <button type="button" className="history-delete" disabled={deletingId === report.id} onClick={() => deleteReport(report)}>
                      <Trash2 size={15} aria-hidden="true" /> {deletingId === report.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>
    </div>
  )
}
