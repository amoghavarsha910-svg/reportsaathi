import { KeyRound, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'

export default function AuthModal({ open, supabase, onClose, onAuthenticated }) {
  const [mode, setMode] = useState('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!open) return null

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')
    if (!supabase) {
      setError('Sign-in is not configured yet. Guest mode remains available.')
      return
    }

    setBusy(true)
    try {
      const response = mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })
      if (response.error) throw response.error
      if (response.data.session) {
        onAuthenticated?.(response.data.session)
        onClose()
      } else if (mode === 'sign-up') {
        setSuccess('Account created. Check your email to confirm your address, then sign in.')
      } else {
        setSuccess('Check your email for the next sign-in step.')
      }
    } catch (authError) {
      setError(authError.message || 'Could not complete sign-in. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="auth-modal panel-card w-full max-w-md p-6 shadow-2xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <div className="flex items-start justify-between gap-4">
          <span className="auth-modal-icon"><KeyRound size={21} aria-hidden="true" /></span>
          <button type="button" className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" aria-label="Close sign-in dialog" onClick={onClose}>
            <X size={19} aria-hidden="true" />
          </button>
        </div>
        <p className="section-kicker mt-5">Optional account</p>
        <h2 id="auth-title" className="mt-1 text-2xl font-semibold text-slate-900">{mode === 'sign-in' ? 'Welcome back' : 'Create your account'}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">Sign in to save summaries across devices. Guest mode works without an account.</p>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="auth-input mt-1.5" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input type="password" required minLength={8} autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="auth-input mt-1.5" />
          </label>
          {error && <p className="text-sm text-rose-700" role="alert">{error}</p>}
          {success && <p className="text-sm text-emerald-800" role="status">{success}</p>}
          <button type="submit" className="button-primary w-full" disabled={busy}>
            {busy ? 'Please wait...' : mode === 'sign-in' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button type="button" className="mt-4 w-full text-center text-sm font-semibold text-teal-800 hover:underline" onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(''); setSuccess('') }}>
          {mode === 'sign-in' ? 'New to ReportSaathi? Create an account' : 'Already have an account? Sign in'}
        </button>
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-teal-700" aria-hidden="true" />
          Only saved summaries are kept in your history. Uploaded report files are not saved there.
        </p>
      </section>
    </div>
  )
}
