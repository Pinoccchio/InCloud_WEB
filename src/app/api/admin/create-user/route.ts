import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateSuperAdminWithContext } from '@/lib/auth-middleware'
import { logger } from '@/lib/logger'

// Create Supabase admin client with service role key
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

export async function POST(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'POST /api/admin/create-user',
    operation: 'createAdminUser'
  })
  routeLogger.time('createAdminUser')

  try {
    routeLogger.info('Starting admin user creation request')

    // Get admin context and validate permissions
    const { client, currentAdminId, currentAdminRole, requestBody } = await validateSuperAdminWithContext(request)
    const { email, password, fullName, role } = requestBody

    routeLogger.debug('Request validated', {
      currentAdminId,
      currentAdminRole,
      requestedRole: role,
      email
    })

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      routeLogger.warn('Missing required fields in request')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'super_admin'].includes(role)) {
      routeLogger.warn('Invalid role specified', { role })
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Step 1: Create auth user using admin client
    routeLogger.info('Creating auth user', { email, role })
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for admin users
      user_metadata: {
        full_name: fullName,
        role: role
      }
    })

    if (authError) {
      routeLogger.error('Auth user creation failed', authError, { email })
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authUser.user) {
      routeLogger.error('Auth user creation returned no user')
      return NextResponse.json(
        { error: 'Failed to create auth user' },
        { status: 500 }
      )
    }

    routeLogger.success('Auth user created', { userId: authUser.user.id })

    // Step 2: Get main branch ID for regular admins
    let branchesToAssign: string[] = []

    if (role === 'admin') {
      // Regular admins get assigned to the main branch
      routeLogger.info('Assigning admin to main branch')
      routeLogger.db('SELECT', 'branches')
      const { data: branches, error: branchError } = await client
        .from('branches')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single()

      if (!branchError && branches) {
        branchesToAssign = [branches.id]
        routeLogger.debug('Main branch assigned', { branchId: branches.id })
      }
    } else {
      routeLogger.debug('Super admin - no branch assignment (access to all)')
    }
    // Super admins get empty array (access to all branches)

    // Step 3: Create admin profile using the service role function
    routeLogger.info('Creating admin profile via RPC')
    routeLogger.db('RPC', 'create_admin_profile_service_role')
    const { data: result, error: adminError } = await client
      .rpc('create_admin_profile_service_role', {
        p_user_id: authUser.user.id,
        p_full_name: fullName,
        p_email: email,
        p_current_admin_id: currentAdminId,
        p_current_admin_role: currentAdminRole,
        p_role: role,
        p_branches: branchesToAssign
      })

    if (adminError) {
      routeLogger.error('Admin profile creation error', adminError)

      // Cleanup: Delete the auth user if admin profile creation failed
      routeLogger.warn('Cleaning up auth user due to profile creation failure', { userId: authUser.user.id })
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        routeLogger.debug('Auth user cleanup successful')
      } catch (cleanupError) {
        routeLogger.error('Failed to cleanup auth user', cleanupError as Error)
      }

      return NextResponse.json(
        { error: adminError.message },
        { status: 400 }
      )
    }

    // Check if the function call was successful
    if (!result?.success) {
      routeLogger.warn('Admin profile creation failed', { error: result?.error })
      // Cleanup: Delete the auth user if admin profile creation failed
      routeLogger.info('Cleaning up auth user', { userId: authUser.user.id })
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        routeLogger.debug('Auth user cleanup successful')
      } catch (cleanupError) {
        routeLogger.error('Failed to cleanup auth user', cleanupError as Error)
      }

      return NextResponse.json(
        { error: result?.error || 'Failed to create admin profile' },
        { status: 400 }
      )
    }

    const duration = routeLogger.timeEnd('createAdminUser')
    routeLogger.success('Admin user created successfully', {
      duration,
      adminId: result.admin_id,
      email,
      role,
      branchesCount: branchesToAssign.length,
      performedBy: currentAdminId
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        auth_user_id: authUser.user.id,
        admin_id: result.admin_id,
        email: email,
        full_name: fullName,
        role: role
      }
    })

  } catch (error) {
    routeLogger.error('Unexpected error in create-user API', error as Error)

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