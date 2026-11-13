import { FileText, FlaskConical, ShieldCheck, UploadCloud, X } from 'lucide-react'
import { useRef, useState } from 'react'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी (Hindi)' },
  { value: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
]
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg']

function validateFile(file) {
  const name = file.name.toLowerCase()
  if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) {
    return 'Choose a PDF, JPG, or PNG report.'
  }
  if (file.size > 10 * 1024 * 1024) return 'This file is larger than the 10 MB limit.'
  return ''
}

export default function UploadDropzone({
  file,
  language,
  onFileChange,
  onLanguageChange,
  onAnalyze,
  onTrySample,
  busy,
  error,
}) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function selectFile(candidate) {
    if (!candidate) return
    const validationError = validateFile(candidate)
    onFileChange(validationError ? null : candidate, validationError)
  }

  return (
    <section className="panel-card p-5 sm:p-7" aria-labelledby="upload-title">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Start with a report</p>
          <h2 id="upload-title" className="mt-1 text-xl font-semibold text-slate-900">Upload a lab report</h2>
          <p className="mt-1 text-sm text-slate-600">PDF, JPG, or PNG · Up to 10 MB</p>
        </div>
        <span className="hidden rounded-xl bg-teal-50 p-3 text-teal-800 sm:block">
          <FileText size={22} aria-hidden="true" />
        </span>
      </div>

      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        onChange={(event) => {
          selectFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      <div
        onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false)
        }}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          selectFile(event.dataTransfer.files?.[0])
        }}
        className={`rounded-2xl border-2 border-dashed p-6 text-center transition sm:p-9 ${dragging ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-slate-50/80 hover:border-teal-400 hover:bg-teal-50/60'}`}
      >
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm">
          <UploadCloud size={24} aria-hidden="true" />
        </span>
        <p className="mt-4 font-medium text-slate-900">Drag your report here</p>
        <p className="mt-1 text-sm text-slate-500">or select a file from your device</p>
        <button type="button" className="button-secondary mt-4" onClick={() => inputRef.current?.click()}>
          Choose a file
        </button>
        {file && (
          <div className="mx-auto mt-4 flex max-w-md items-center justify-between gap-3 rounded-xl border border-teal-100 bg-white px-3 py-2 text-left text-sm">
            <span className="flex min-w-0 items-center gap-2 text-slate-700">
              <FileText size={17} className="shrink-0 text-teal-700" aria-hidden="true" />
              <span className="truncate">{file.name}</span>
            </span>
            <button type="button" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Remove selected file" onClick={() => onFileChange(null, '')}>
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {error && <p className="mt-3 text-sm font-medium text-rose-700" role="alert">{error}</p>}

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-700">Explanation language</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Explanation language">
            {LANGUAGES.map((option) => (
              <button
                type="button"
                key={option.value}
                aria-pressed={language === option.value}
                onClick={() => onLanguageChange(option.value)}
                className={`language-pill ${language === option.value ? 'language-pill-active' : ''}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="button-primary sm:min-w-48" onClick={onAnalyze} disabled={!file || busy}>
          {busy ? 'Analyzing report...' : 'Analyze my report'}
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-xs leading-5 text-slate-600">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
          <span>Patient names &amp; phone numbers are automatically redacted before AI analysis</span>
        </p>
        <button type="button" className="button-sample" onClick={onTrySample} disabled={busy}>
          <FlaskConical size={17} aria-hidden="true" />
          Try Sample Report
        </button>
      </div>
    </section>
  )
}
