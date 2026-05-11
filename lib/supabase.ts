import { createClient } from '@supabase/supabase-js'
import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Generic client (for API routes)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Browser client (use in Client Components)
export const createBrowserClient = () =>
  createSSRBrowserClient(supabaseUrl, supabaseAnonKey)
