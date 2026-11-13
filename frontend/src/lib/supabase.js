import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

function isHttpUrl(value) {
  if (typeof value !== 'string' || !value.trim().startsWith('http')) return false

  try {
    const parsedUrl = new URL(value.trim())
    return (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') && Boolean(parsedUrl.hostname)
  } catch {
    return false
  }
}

function createSupabaseClient() {
  if (!isHttpUrl(supabaseUrl) || typeof supabasePublishableKey !== 'string' || !supabasePublishableKey.trim()) {
    return null
  }

  try {
    return createClient(supabaseUrl.trim(), supabasePublishableKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  } catch {
    return null
  }
}

export const supabase = createSupabaseClient()
