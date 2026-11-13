import { useCallback, useEffect, useMemo, useState } from 'react'
import { Activity, ChevronDown, HeartPulse, History, LockKeyhole, LogIn, LogOut, Sparkles } from 'lucide-react'

import AnalysisProgress from './components/AnalysisProgress.jsx'
import AuthModal from './components/AuthModal.jsx'
import BiomarkerCard from './components/BiomarkerCard.jsx'
import BiomarkerFilters from './components/BiomarkerFilters.jsx'
import DisclaimerBanner from './components/DisclaimerBanner.jsx'
import ReportSummary from './components/ReportSummary.jsx'
import SavedReportsDrawer from './components/SavedReportsDrawer.jsx'
import UploadDropzone from './components/UploadDropzone.jsx'
import { sampleReport } from './data/sampleReport.js'
import { deleteSavedReport, listSavedReports, saveReportSummary } from './lib/reportsHistory.js'
import { supabase } from './lib/supabase.js'
import { isAuthRequiredError } from './lib/session.js'

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const ATTENTION_STATUSES = new Set(['high', 'low', 'borderline'])

export default function App() {
  const [health, setHealth] = useState(null)
  const [backendReady, setBackendReady] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [language, setLanguage] = useState('en')
  const [result, setResult] = useState(null)
  const [isSample, setIsSample] = useState(false)
  const [isHistory, setIsHistory] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [session, setSession] = useState(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [activeStep, setActiveStep] = useState(0)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [groupByCategory, setGroupByCategory] = useState(true)
  const [normalResultsOpen, setNormalResultsOpen] = useState(true)

  useEffect(() => {
    let active = true
    const poll = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health`)
        if (!response.ok) throw new Error('Backend health check failed')
        const data = await response.json()
        if (active) {
          setHealth(data)
          setBackendReady(true)
        }
      } catch {
        if (active) {
          setHealth(null)
          setBackendReady(false)
        }
      }
    }
    poll()
    const timer = window.setInterval(poll, 5000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  useEffect(() => {
    if (!supabase) return undefined
    let active = true
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (active && !sessionError) setSession(data.session)
    }).catch(() => {
      if (active) setSession(null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) setAuthModalOpen(false)
    })
    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!busy) {
      setActiveStep(0)
      return undefined
    }
    const timer = window.setInterval(() => {
      setActiveStep((step) => Math.min(step + 1, 3))
    }, 5000)
    return () => window.clearInterval(timer)
  }, [busy])

  function handleFileChange(file, validationError = '') {
    setSelectedFile(file)
    setError(validationError)
    setResult(null)
    setIsSample(false)
    setIsHistory(false)
    setSaveMessage('')
  }

  async function handleAnalyze() {
    if (!selectedFile || busy) return
    setBusy(true)
    setActiveStep(0)
    setError('')
    setResult(null)
    setIsSample(false)
    setIsHistory(false)
    setSaveMessage('')
    try {
      const form = new FormData()
      form.append('file', selectedFile)
      form.append('language', language)
      const response = await fetch(`${API_URL}/api/analyze`, { method: 'POST', body: form })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Analysis could not be completed. Please try again.')
      setResult(data)
      setFilter('all')
      setQuery('')
    } catch (requestError) {
      setError(requestError.message || 'Could not connect to the backend.')
    } finally {
      setBusy(false)
    }
  }

  function handleTrySample() {
    setSelectedFile(null)
    setError('')
    setResult(sampleReport)
    setIsSample(true)
    setIsHistory(false)
    setSaveMessage('')
    setFilter('all')
    setQuery('')
  }

  function handleReset() {
    setSelectedFile(null)
    setResult(null)
    setIsSample(false)
    setIsHistory(false)
    setError('')
    setSaveMessage('')
    setQuery('')
    setFilter('all')
  }

  async function handleSaveSummary() {
    if (!result) return
    if (!supabase) {
      setAuthModalOpen(true)
      return
    }
    setSaving(true)
    setSaveMessage('')
    try {
      await saveReportSummary({
        title: result.analysis.report_type || 'Lab report summary',
        language,
        summary: result.analysis,
      })
      setSaveMessage('Summary saved to your report history.')
    } catch (saveError) {
      if (isAuthRequiredError(saveError)) {
        if (supabase) await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
        setSession(null)
        setSaveMessage('Your session expired. Sign in again to save this summary.')
        setAuthModalOpen(true)
      } else {
        setSaveMessage(saveError.message || 'Could not save this summary.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRequireSignIn = useCallback(async () => {
    setSession(null)
    setHistoryOpen(false)
    setAuthModalOpen(true)
    if (supabase) await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
  }, [])

  function handleLoadSavedReport(report) {
    setSelectedFile(null)
    setResult({
      extraction_meta: { filename: report.title, method: 'saved history', page_count: 0, char_count: 0 },
      pii_redacted_count: 0,
      analysis: report.summary,
    })
    setLanguage(report.language || 'en')
    setIsSample(false)
    setIsHistory(true)
    setError('')
    setQuery('')
    setFilter('all')
    setSaveMessage('')
    setHistoryOpen(false)
  }

  const biomarkers = result?.analysis?.biomarkers || []
  const filteredBiomarkers = useMemo(() => {
    const searchText = query.trim().toLocaleLowerCase()
    return biomarkers.filter((marker) => {
      const matchesFilter = filter === 'all'
        || (filter === 'normal' && marker.status === 'normal')
        || (filter === 'attention' && ATTENTION_STATUSES.has(marker.status))
      const searchable = `${marker.test_name} ${marker.category} ${marker.status}`.toLocaleLowerCase()
      return matchesFilter && (!searchText || searchable.includes(searchText))
    })
  }, [biomarkers, filter, query])

  const attentionBiomarkers = filteredBiomarkers.filter((marker) => ATTENTION_STATUSES.has(marker.status))
  const normalBiomarkers = filteredBiomarkers.filter((marker) => marker.status === 'normal')
  const unclearBiomarkers = filteredBiomarkers.filter((marker) => !ATTENTION_STATUSES.has(marker.status) && marker.status !== 'normal')

  return (
    <div className="app-shell min-h-screen px-4 pb-8 pt-4 sm:px-6 sm:pt-6">
      <div className="mx-auto max-w-5xl">
        <DisclaimerBanner />

        <header className="flex flex-col gap-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:py-9">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-800 text-white shadow-lg shadow-teal-900/10">
              <HeartPulse size={26} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xl font-bold tracking-tight text-slate-900">ReportSaathi</p>
              <p className="text-sm text-slate-500">Understand your lab report, one result at a time.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-white px-3 py-2 text-teal-900">
              <LockKeyhole size={14} aria-hidden="true" /> {session ? 'Optional history enabled' : 'Guest mode - No account needed'}
            </span>
            <ServicePill label="Service" ready={backendReady} />
            <ServicePill label="OCR" ready={Boolean(health?.tesseract_ready && health?.poppler_ready)} />
            <button type="button" className="header-action" onClick={() => setHistoryOpen(true)}>
              <History size={15} aria-hidden="true" /> My Saved Reports
            </button>
            {session?.user?.email ? (
              <>
                <span className="max-w-40 truncate px-1 text-slate-600" title={session.user.email}>{session.user.email}</span>
                <button type="button" className="header-action" onClick={() => supabase?.auth.signOut()}>
                  <LogOut size={15} aria-hidden="true" /> Sign Out
                </button>
              </>
            ) : (
              <button type="button" className="header-action header-action-primary" onClick={() => setAuthModalOpen(true)}>
                <LogIn size={15} aria-hidden="true" /> Sign In
              </button>
            )}
          </div>
        </header>

        <main className="space-y-6">
          {!result && (
            <>
              <section className="home-intro mb-2 max-w-3xl">
                <p className="section-kicker">A clearer view of your results</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Lab language, made a little simpler.</h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Upload a report for a calm, educational explanation of the terms and values. Start as a guest; no account is needed.</p>
              </section>

              <UploadDropzone
                file={selectedFile}
                language={language}
                onFileChange={handleFileChange}
                onLanguageChange={setLanguage}
                onAnalyze={handleAnalyze}
                onTrySample={handleTrySample}
                busy={busy}
                error={error}
              />
              {busy && <AnalysisProgress activeStep={activeStep} />}
            </>
          )}

          {result && (
            <>
              <ReportSummary
                result={result}
                onReset={handleReset}
                onSave={handleSaveSummary}
                isSaving={saving}
                saveMessage={saveMessage}
                isSample={isSample}
                isHistory={isHistory}
              />
              <section className="space-y-4" aria-labelledby="biomarkers-title">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="section-kicker">Your results</p>
                    <h2 id="biomarkers-title" className="mt-1 text-xl font-semibold text-slate-900">Test-by-test explanation</h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500"><Activity size={15} aria-hidden="true" /> {biomarkers.length} markers</span>
                </div>
                <BiomarkerFilters
                  query={query}
                  onQueryChange={setQuery}
                  filter={filter}
                  onFilterChange={setFilter}
                  groupByCategory={groupByCategory}
                  onGroupChange={setGroupByCategory}
                  resultCount={filteredBiomarkers.length}
                />
                {filteredBiomarkers.length === 0 ? (
                  <div className="panel-card px-5 py-10 text-center text-sm text-slate-500">
                    No tests match those filters. Try another search or choose All.
                  </div>
                ) : (
                  <div className="space-y-5">
                    {attentionBiomarkers.length > 0 && (
                      <BiomarkerSection
                        title="Needs Attention"
                        description="High, low, or borderline values to discuss in context."
                        markers={attentionBiomarkers}
                        groupByCategory={groupByCategory}
                        tone="attention"
                      />
                    )}
                    {unclearBiomarkers.length > 0 && (
                      <BiomarkerSection
                        title="Needs a Closer Look"
                        description="Some report details could not be confidently matched."
                        markers={unclearBiomarkers}
                        groupByCategory={groupByCategory}
                        tone="unclear"
                      />
                    )}
                    {normalBiomarkers.length > 0 && (
                      <section className="panel-card normal-results-panel overflow-hidden">
                        <button
                          type="button"
                          className="normal-results-toggle"
                          aria-expanded={normalResultsOpen}
                          onClick={() => setNormalResultsOpen((open) => !open)}
                        >
                          <span className="flex min-w-0 items-center gap-3 text-left">
                            <span className="normal-results-icon"><Activity size={19} aria-hidden="true" /></span>
                            <span>
                              <span className="block text-base font-semibold text-slate-900">Within Normal Range</span>
                              <span className="mt-0.5 block text-sm text-slate-500">{normalBiomarkers.length} result{normalBiomarkers.length === 1 ? '' : 's'} shown within the provided reference range</span>
                            </span>
                          </span>
                          <ChevronDown size={19} className={`shrink-0 text-slate-500 transition-transform ${normalResultsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </button>
                        {normalResultsOpen && (
                          <div className="normal-results-content">
                            <BiomarkerGrid markers={normalBiomarkers} groupByCategory={groupByCategory} />
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                )}
              </section>
              <div className="flex items-start gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm leading-6 text-slate-600">
                <Sparkles size={17} className="mt-1 shrink-0 text-teal-700" aria-hidden="true" />
                These explanations are for learning and conversation preparation. A clinician can interpret results in the context of your health history.
              </div>
            </>
          )}
        </main>

        <DisclaimerBanner placement="bottom" />
        <footer className="py-5 text-center text-xs text-slate-400">ReportSaathi - Simple explanations for more informed conversations</footer>
      </div>
      <AuthModal
        open={authModalOpen}
        supabase={supabase}
        onClose={() => setAuthModalOpen(false)}
        onAuthenticated={setSession}
      />
      <SavedReportsDrawer
        open={historyOpen}
        session={session}
        onClose={() => setHistoryOpen(false)}
        onSignIn={handleRequireSignIn}
        onRequireSignIn={handleRequireSignIn}
        onLoad={handleLoadSavedReport}
        listSavedReports={listSavedReports}
        deleteSavedReport={deleteSavedReport}
      />
    </div>
  )
}

function BiomarkerSection({ title, description, markers, groupByCategory, tone }) {
  return (
    <section className={`triage-section triage-section-${tone}`} aria-label={title}>
      <div className="triage-heading">
        <div>
          <p className="section-kicker">Results overview</p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        <span className="triage-count">{markers.length}</span>
      </div>
      <BiomarkerGrid markers={markers} groupByCategory={groupByCategory} />
    </section>
  )
}

function BiomarkerGrid({ markers, groupByCategory }) {
  const groups = groupByCategory
    ? Object.entries(markers.reduce((grouped, marker) => {
      const category = marker.category || 'Other tests'
      grouped[category] = [...(grouped[category] || []), marker]
      return grouped
    }, {}))
    : [['All tests', markers]]

  return (
    <div className="space-y-5">
      {groups.map(([category, categoryMarkers]) => (
        <section key={category} aria-label={category}>
          {groupByCategory && <h4 className="biomarker-category-heading">{category}</h4>}
          <div className="grid gap-4 lg:grid-cols-2">
            {categoryMarkers.map((marker, index) => <BiomarkerCard key={`${marker.test_name}-${index}`} biomarker={marker} />)}
          </div>
        </section>
      ))}
    </div>
  )
}

function ServicePill({ label, ready }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-slate-600">
      <span className={`h-1.5 w-1.5 rounded-full ${ready ? 'bg-emerald-500' : 'bg-slate-300'}`} />
      {label} {ready ? 'ready' : 'checking'}
    </span>
  )
}
