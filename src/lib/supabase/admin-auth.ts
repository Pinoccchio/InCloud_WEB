import { createClient } from '@supabase/supabase-js'

/**
 * Admin Supabase client with service role key
 * Used to bypass RLS policies for admin verification
 */
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface AdminData {
  id: string
  role: string
  branches: string[]
  is_active: boolean
}

interface VerifyAdminAccessResult {
  authorized: boolean
  admin: AdminData | null
}

/**
 * Verifies if a user has admin access
 * Uses service role client to bypass RLS policies
 *
 * @param userId - The user's ID from auth.users
 * @returns Object with authorized flag and admin data
 */
export async function verifyAdminAccess(userId: string): Promise<VerifyAdminAccessResult> {
  try {
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, role, branches, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (error || !admin) {
      console.error('Admin verification failed:', error?.message || 'Admin not found')
      return { authorized: false, admin: null }
    }

    return {
      authorized: true,
      admin: {
        id: admin.id,
        role: admin.role,
        branches: admin.branches || [],
        is_active: admin.is_active
      }
    }
  } catch (error) {
    console.error('Error verifying admin access:', error)
    return { authorized: false, admin: null }
  }
}
