import { supabase } from './supabase.js'
import { authRequiredError } from './session.js'

const REDACTED = '[REDACTED]'
const sensitiveLabelLine = /^\s*(?:(?:patient\s+name|patient\s+id|referred\s+by|mrn|uhid|name|phone|mobile|email|address)\b|dr\.).*$/i
const sensitivePatterns = [
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /(?<!\d)\d{4}\s?\d{4}\s?\d{4}(?!\d)/g,
  /(?<!\d)(?:\d[ -]?){9}\d(?!\d)/g,
]

function scrubText(value) {
  const redactedLines = value.split(/(?<=\n)/).map((line) => {
    const ending = line.endsWith('\r\n') ? '\r\n' : line.endsWith('\n') ? '\n' : line.endsWith('\r') ? '\r' : ''
    const body = ending ? line.slice(0, -ending.length) : line
    return sensitiveLabelLine.test(body) ? `${REDACTED}${ending}` : line
  })

  return sensitivePatterns.reduce((text, pattern) => text.replace(pattern, REDACTED), redactedLines.join(''))
}

function scrubAnalysis(value) {
  if (typeof value === 'string') return scrubText(value)
  if (Array.isArray(value)) return value.map(scrubAnalysis)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, scrubAnalysis(item)]))
  }
  return value
}

async function getCurrentUser() {
  if (!supabase) throw authRequiredError('Sign in to use saved report history.')

  const { data: { user } = {}, error } = await supabase.auth.getUser()
  if (error) {
    if (error.status === 401 || error.name === 'AuthSessionMissingError') throw authRequiredError()
    throw error
  }
  if (!user) throw authRequiredError()
  return user
}

export async function listSavedReports() {
  await getCurrentUser()
  const { data, error } = await supabase
    .from('saved_reports')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function saveReportSummary({ title, language, summary }) {
  const user = await getCurrentUser()
  const { data, error } = await supabase
    .from('saved_reports')
    .insert({
      user_id: user.id,
      title: scrubText(title),
      language,
      summary: scrubAnalysis(summary),
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteSavedReport(reportId) {
  await getCurrentUser()
  const { error } = await supabase
    .from('saved_reports')
    .delete()
    .eq('id', reportId)

  if (error) throw error
}
