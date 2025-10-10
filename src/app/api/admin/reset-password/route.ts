import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateSuperAdminWithContext } from '@/lib/auth-middleware'
import { logger } from '@/lib/logger'

// Create Supabase admin client with service role key for password operations
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

// Note: Using admin client from auth middleware for privileged operations

export async function POST(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'POST /api/admin/reset-password',
    operation: 'resetAdminPassword'
  })
  routeLogger.time('resetAdminPassword')

  try {
    routeLogger.info('Starting admin password reset request')

    // Get admin context and validate permissions
    const { client, currentAdminId, currentAdminRole, requestBody } = await validateSuperAdminWithContext(request)
    const { adminId } = requestBody

    routeLogger.debug('Request validated', {
      currentAdminId,
      currentAdminRole,
      targetAdminId: adminId
    })

    // Validate required fields
    if (!adminId) {
      routeLogger.warn('Admin ID is required but not provided')
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      )
    }

    // Call the service role function to validate and get admin details
    routeLogger.info('Calling reset_admin_password_service_role', { adminId })
    routeLogger.db('RPC', 'reset_admin_password_service_role')
    const { data: resetResult, error: resetError } = await client
      .rpc('reset_admin_password_service_role', {
        p_admin_id: adminId,
        p_current_admin_id: currentAdminId,
        p_current_admin_role: currentAdminRole
      })

    if (resetError) {
      routeLogger.error('Reset password validation error', resetError)
      return NextResponse.json(
        { error: resetError.message },
        { status: 400 }
      )
    }

    // Check if the function call was successful
    if (!resetResult?.success) {
      routeLogger.warn('Reset password initiation failed', {
        adminId,
        error: resetResult?.error
      })
      return NextResponse.json(
        { error: resetResult?.error || 'Failed to initiate password reset' },
        { status: 400 }
      )
    }

    // Get the admin's email and user_id from the function result
    const adminEmail = resetResult.email
    routeLogger.debug('Admin email retrieved', { adminEmail })

    // Get the auth user_id for this admin
    routeLogger.db('SELECT', 'admins')
    const { data: adminData, error: adminFetchError } = await client
      .from('admins')
      .select('user_id')
      .eq('id', adminId)
      .single()

    if (adminFetchError || !adminData?.user_id) {
      routeLogger.error('Error fetching admin user_id', adminFetchError)
      return NextResponse.json(
        { error: 'Failed to get admin auth user ID' },
        { status: 400 }
      )
    }

    // Send password reset email using Supabase Auth admin API
    routeLogger.info('Generating password reset link', { adminEmail })
    const { error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: adminEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?redirect_to=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')}/reset-password`
      }
    })

    if (authError) {
      routeLogger.error('Auth password reset error', authError)
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 400 }
      )
    }

    const duration = routeLogger.timeEnd('resetAdminPassword')
    routeLogger.success('Password reset email sent successfully', {
      duration,
      adminId,
      adminEmail,
      performedBy: currentAdminId
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
      email: adminEmail
    })

  } catch (error) {
    routeLogger.error('Unexpected error in reset-password API', error as Error)

    // Handle authentication errors specifically
    if (error instanceof Error) {
      if (error.message.includes('Authentication required') ||
          error.message.includes('Super admin access required')) {
        return NextResponse.json(
          { error: error.message },
          { status: 401 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}