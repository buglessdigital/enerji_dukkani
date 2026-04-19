import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// createBrowserClient stores the session in cookies (in addition to localStorage).
// This allows the proxy to read the session server-side for route protection.
// isSingleton: true (default) ensures the same instance is reused across imports.
export const supabaseBrowser = createBrowserClient(supabaseUrl, supabaseAnonKey)

// On load, clear any stale/invalid refresh tokens to prevent AuthApiError loops.
if (typeof window !== 'undefined') {
  supabaseBrowser.auth.getSession().then(({ error }) => {
    if (error?.message?.includes('Refresh Token')) {
      supabaseBrowser.auth.signOut()
    }
  })
}
