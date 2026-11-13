export function authRequiredError(message = 'Your session has expired. Please sign in again.') {
  const error = new Error(message)
  error.name = 'AuthRequiredError'
  return error
}

export function isAuthRequiredError(error) {
  return error?.name === 'AuthRequiredError'
}

export async function getFreshAccessToken(supabase) {
  if (!supabase) throw authRequiredError('Sign in to use saved report history.')

  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
    throw authRequiredError()
  }
  if (!session?.access_token) throw authRequiredError()

  const expiresSoon = typeof session.expires_at === 'number'
    && session.expires_at * 1000 <= Date.now() + 30_000
  if (!expiresSoon) return session.access_token

  const { data, error: refreshError } = await supabase.auth.refreshSession()
  if (!refreshError && data.session?.access_token) return data.session.access_token

  await supabase.auth.signOut({ scope: 'local' }).catch(() => {})
  throw authRequiredError()
}
