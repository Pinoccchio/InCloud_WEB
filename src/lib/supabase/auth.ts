import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export interface AuthResult {
  success: boolean
  data?: any
  error?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  fullName: string
  email: string
  password: string
  role: 'admin' | 'super_admin'
  branches?: string[]
}

export interface InitialSuperAdminData {
  fullName: string
  email: string
  password: string
}

export interface AdminProfile {
  id: string
  user_id: string
  full_name: string
  role: 'admin' | 'super_admin'
  branches: string[]
  is_active: boolean
}

export async function loginAdmin(credentials: LoginCredentials): Promise<AuthResult> {
  try {
    // Use Supabase's built-in authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    })

    if (authError) {
      return {
        success: false,
        error: authError.message || 'Authentication failed'
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'Authentication failed'
      }
    }

    // Get admin profile data
    const { data: adminProfile, error: profileError } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('is_active', true)
      .single()

    if (profileError || !adminProfile) {
      // Clean up auth session if admin profile doesn't exist
      await supabase.auth.signOut()
      return {
        success: false,
        error: 'Admin profile not found or inactive'
      }
    }

    return {
      success: true,
      data: {
        user: authData.user,
        session: authData.session,
        admin: {
          id: adminProfile.id,
          user_id: adminProfile.user_id,
          email: authData.user.email,
          fullName: adminProfile.full_name,
          role: adminProfile.role,
          branches: adminProfile.branches
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    }
  }
}

export async function signupAdmin(signupData: SignupData): Promise<AuthResult> {
  try {
    // First, create the auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: signupData.email,
      password: signupData.password
    })

    if (authError) {
      return {
        success: false,
        error: authError.message || 'Account creation failed'
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'User creation failed'
      }
    }

    // Create admin profile using the database function
    const { data: adminId, error: profileError } = await supabase.rpc('create_admin_profile', {
      p_user_id: authData.user.id,
      p_full_name: signupData.fullName,
      p_role: signupData.role as Database['public']['Enums']['admin_role'],
      p_branches: signupData.branches ? signupData.branches : []
    })

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
        error: profileError.message || 'Admin profile creation failed'
      }
    }

    return {
      success: true,
      data: {
        userId: authData.user.id,
        adminId: adminId,
        emailConfirmationSent: !authData.session // true if email confirmation is required
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Signup failed'
    }
  }
}

export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return { success: false, error: 'No active session' }
    }

    // Get admin profile data
    const { data: adminProfile, error: profileError } = await supabase
      .from('admins')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()

    if (profileError || !adminProfile) {
      return { success: false, error: 'Admin profile not found' }
    }

    return {
      success: true,
      data: {
        user: session.user,
        session,
        admin: {
          id: adminProfile.id,
          user_id: adminProfile.user_id,
          email: session.user.email,
          fullName: adminProfile.full_name,
          role: adminProfile.role,
          branches: adminProfile.branches
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Session validation failed'
    }
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sign out failed'
    }
  }
}

export async function getBranches() {
  try {
    const { data, error } = await supabase
      .from('branches')
      .select('id, name')
      .eq('is_active', true)

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data || []
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch branches'
    }
  }
}

export async function checkSuperAdminExists(): Promise<AuthResult> {
  try {
    const { data, error } = await supabase
      .from('admins')
      .select('id')
      .eq('role', 'super_admin')
      .eq('is_active', true)
      .limit(1)

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: { exists: data && data.length > 0 }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check super admin'
    }
  }
}

export async function createInitialSuperAdmin(adminData: InitialSuperAdminData): Promise<AuthResult> {
  try {
    // Check if super admin already exists
    const existsResult = await checkSuperAdminExists()
    if (existsResult.success && existsResult.data?.exists) {
      return {
        success: false,
        error: 'Super admin already exists'
      }
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminData.email,
      password: adminData.password
    })

    if (authError) {
      return {
        success: false,
        error: authError.message || 'Authentication setup failed'
      }
    }

    if (!authData.user) {
      return {
        success: false,
        error: 'User creation failed'
      }
    }

    // Create super admin profile (this will work even without authentication since no super admin exists)
    const { data: adminId, error: profileError } = await supabase.rpc('create_admin_profile', {
      p_user_id: authData.user.id,
      p_full_name: adminData.fullName,
      p_role: 'super_admin',
      p_branches: []
    })

    if (profileError) {
      // Clean up auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
        error: profileError.message || 'Super admin profile creation failed'
      }
    }

    return {
      success: true,
      data: {
        userId: authData.user.id,
        adminId: adminId,
        emailConfirmationSent: !authData.session
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Bootstrap creation failed'
    }
  }
}