import { CalendarDays, Clock3, FileHeart, FileText, LoaderCircle, LogIn, Search, SlidersHorizontal, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { isAuthRequiredError } from '../lib/session.js'

export default function SavedReportsDrawer({ open, session, onClose, onSignIn, onRequireSignIn, onLoad, listSavedReports, deleteSavedReport }) {
  const [reports, setReports] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('any')
  const [panelFilter, setPanelFilter] = useState('all')

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

  const panelTypes = useMemo(() => [...new Set(reports.map((report) => report.summary?.report_type || report.title).filter(Boolean))].sort(), [reports])
  const filteredReports = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    const now = Date.now()
    return reports.filter((report) => {
      const panelType = report.summary?.report_type || report.title || 'Lab report'
      const reportDate = report.created_at ? new Date(report.created_at).getTime() : NaN
      const matchesSearch = !needle || `${report.title} ${panelType} ${(report.summary?.biomarkers || []).map((item) => item.test_name).join(' ')}`.toLocaleLowerCase().includes(needle)
      const matchesPanel = panelFilter === 'all' || panelType === panelFilter
      const matchesDate = dateFilter === 'any'
        || (dateFilter === 'month' && Number.isFinite(reportDate) && reportDate >= now - 30 * 24 * 60 * 60 * 1000)
        || (dateFilter === 'older' && (!Number.isFinite(reportDate) || reportDate < now - 30 * 24 * 60 * 60 * 1000))
      return matchesSearch && matchesPanel && matchesDate
    })
  }, [reports, search, dateFilter, panelFilter])

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
    <div className="history-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="history-drawer" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <header className="history-header">
          <div className="flex items-center gap-3">
            <span className="history-header-icon"><Clock3 size={20} aria-hidden="true" /></span>
            <div>
              <p className="section-kicker">Private to your account</p>
              <h2 id="history-title" className="mt-1 text-xl font-semibold text-slate-900">My Saved Reports</h2>
            </div>
          </div>
          <button type="button" className="drawer-close" aria-label="Close saved reports" onClick={onClose}>
            <X size={19} aria-hidden="true" />
          </button>
        </header>

        {!session ? (
          <div className="history-auth-empty">
            <EmptyHistoryIllustration />
            <h3 className="mt-5 text-lg font-semibold text-slate-900">History is optional</h3>
            <p className="mt-2 max-w-xs text-sm text-slate-600">Sign in to save summaries across devices. You can keep using ReportSaathi as a guest without an account.</p>
            <button type="button" className="button-primary mt-5" onClick={onSignIn}><LogIn size={17} aria-hidden="true" /> Sign In</button>
          </div>
        ) : (
          <div className="history-content">
            {reports.length > 0 && (
              <div className="history-filters">
                <label className="history-search-wrap">
                  <Search size={17} aria-hidden="true" />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search reports or tests"
                    aria-label="Search saved reports"
                  />
                </label>
                <div className="history-filter-row">
                  <label>
                    <CalendarDays size={15} aria-hidden="true" />
                    <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter saved reports by date">
                      <option value="any">Any date</option>
                      <option value="month">Last 30 days</option>
                      <option value="older">Older</option>
                    </select>
                  </label>
                  <label>
                    <SlidersHorizontal size={15} aria-hidden="true" />
                    <select value={panelFilter} onChange={(event) => setPanelFilter(event.target.value)} aria-label="Filter saved reports by panel type">
                      <option value="all">All panels</option>
                      {panelTypes.map((panelType) => <option value={panelType} key={panelType}>{panelType}</option>)}
                    </select>
                  </label>
                </div>
                <p className="history-result-count">Showing {filteredReports.length} of {reports.length} saved report{reports.length === 1 ? '' : 's'}</p>
              </div>
            )}

            {busy && <p className="history-loading"><LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> Loading your reports...</p>}
            {error && <p className="history-error" role="alert">{error}</p>}
            {!busy && !error && reports.length === 0 && (
              <div className="history-empty">
                <EmptyHistoryIllustration />
                <h3 className="mt-5 text-lg font-semibold text-slate-900">Your history starts here</h3>
                <p className="mt-2 max-w-xs text-sm text-slate-600">When you save an explanation, it will appear here for easy reference. Uploaded report files are never saved.</p>
              </div>
            )}
            {!busy && !error && reports.length > 0 && filteredReports.length === 0 && (
              <div className="history-empty history-empty-compact">
                <Search size={25} aria-hidden="true" />
                <h3 className="mt-3 font-semibold text-slate-900">No matching reports</h3>
                <p className="mt-1 text-sm text-slate-600">Try a different search term or filter.</p>
              </div>
            )}
            <ul className="history-report-list">
              {filteredReports.map((report) => (
                <li key={report.id} className="history-report-card">
                  <div className="flex items-start gap-3">
                    <span className="history-report-icon"><FileText size={18} aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{report.title}</p>
                      <p className="mt-0.5 text-xs font-medium text-teal-800">{report.summary?.report_type || 'Lab report'}</p>
                      <p className="mt-1 text-xs text-slate-500">{report.created_at ? new Date(report.created_at).toLocaleString() : 'Saved report'}</p>
                      {report.summary?.overall_summary && <p className="history-report-preview mt-2 text-sm text-slate-600">{report.summary.overall_summary}</p>}
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" className="button-secondary" onClick={() => onLoad(report)}>Open summary</button>
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

function EmptyHistoryIllustration() {
  return (
    <div className="history-empty-illustration" aria-hidden="true">
      <span><FileHeart size={34} strokeWidth={1.6} /></span>
      <i />
    </div>
  )
}
