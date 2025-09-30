import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Create a Supabase client with service role for server-side operations
 * This bypasses RLS policies - use only in trusted server contexts
 */
export function createServerClient() {
  console.log('🔧 [Server Client] Creating service role client')
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

/**
 * Create a Supabase client for API routes that respects RLS
 * Uses the user's session from cookies
 */
export async function createAuthenticatedClient() {
  const cookieStore = await cookies()
  const supabase = createClient<Database>(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: async (key: string) => {
            const cookie = cookieStore.get(key)
            return cookie?.value
          },
          setItem: async (key: string, value: string) => {
            cookieStore.set(key, value)
          },
          removeItem: async (key: string) => {
            cookieStore.delete(key)
          },
        },
      },
    }
  )

  return supabase
}