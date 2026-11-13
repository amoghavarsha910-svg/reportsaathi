import { FileText, FlaskConical, ShieldCheck, UploadCloud, X } from 'lucide-react'
import { useRef, useState } from 'react'

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिंदी' },
  { value: 'kn', label: 'ಕನ್ನಡ' },
]
const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg']

function validateFile(file) {
  const name = file.name.toLowerCase()
  if (!ALLOWED_EXTENSIONS.some((extension) => name.endsWith(extension))) return 'Choose a PDF, JPG, or PNG report.'
  if (file.size > 10 * 1024 * 1024) return 'This file is larger than the 10 MB limit.'
  return ''
}

export default function UploadDropzone({ file, language, onFileChange, onLanguageChange, onAnalyze, onTrySample, busy, error }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function selectFile(candidate) {
    if (!candidate) return
    const validationError = validateFile(candidate)
    onFileChange(validationError ? null : candidate, validationError)
  }

  return (
    <section className="upload-card panel-card" aria-labelledby="upload-title">
      <div className="upload-card-heading">
        <div>
          <p className="section-kicker">Your report, your starting point</p>
          <h2 id="upload-title" className="mt-1 text-xl font-semibold text-slate-900">Upload a lab report</h2>
          <p className="mt-1 text-sm text-slate-600">PDF, JPG, PNG · Up to 10 MB</p>
        </div>
        <span className="upload-card-icon"><FileText size={21} aria-hidden="true" /></span>
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
        className={`upload-dropzone ${dragging ? 'upload-dropzone-active' : ''}`}
      >
        <span className="upload-cloud-icon"><UploadCloud size={24} aria-hidden="true" /></span>
        <p className="mt-3 font-semibold text-slate-900">Drop your report here</p>
        <p className="mt-1 text-sm text-slate-500">or choose a file from your device</p>
        <button type="button" className="button-secondary mt-4" onClick={() => inputRef.current?.click()}>
          <FileText size={16} aria-hidden="true" /> Select a report
        </button>
        {file && (
          <div className="selected-file">
            <span className="flex min-w-0 items-center gap-2 text-slate-700">
              <FileText size={17} className="shrink-0 text-emerald-700" aria-hidden="true" />
              <span className="truncate">{file.name}</span>
            </span>
            <button type="button" className="selected-file-remove" aria-label="Remove selected file" onClick={() => onFileChange(null, '')}>
              <X size={17} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {error && <p className="upload-error" role="alert">{error}</p>}

      <div className="language-and-analyze">
        <div>
          <p className="language-heading">Explanation language</p>
          <div className="language-pill-group mt-2" role="group" aria-label="Explanation language">
            {LANGUAGES.map((option) => (
              <button type="button" key={option.value} aria-pressed={language === option.value} onClick={() => onLanguageChange(option.value)} className={`language-pill ${language === option.value ? 'language-pill-active' : ''}`}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="button-primary analyze-button" onClick={onAnalyze} disabled={!file || busy}>
          {busy ? 'Analyzing report...' : 'Analyze my report'}
        </button>
      </div>

      <div className="upload-card-footer">
        <p className="upload-privacy-note">
          <ShieldCheck size={17} aria-hidden="true" />
          <span>Personal details automatically redacted before AI analysis</span>
        </p>
        <button type="button" className="button-sample" onClick={onTrySample} disabled={busy}>
          <FlaskConical size={17} aria-hidden="true" /> Try with a Sample Report
        </button>
      </div>
    </section>
  )
}
