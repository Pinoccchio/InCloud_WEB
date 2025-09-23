import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validateSuperAdminWithContext } from '@/lib/auth-middleware'

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
  try {
    // Get admin context and validate permissions
    const { client, currentAdminId, currentAdminRole, requestBody } = await validateSuperAdminWithContext(request)
    const { email, password, fullName, role } = requestBody

    // Validate required fields
    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['admin', 'super_admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      )
    }

    // Step 1: Create auth user using admin client
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
      console.error('Auth user creation error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'Failed to create auth user' },
        { status: 500 }
      )
    }

    // Step 2: Get main branch ID for regular admins
    let branchesToAssign: string[] = []

    if (role === 'admin') {
      // Regular admins get assigned to the main branch
      const { data: branches, error: branchError } = await client
        .from('branches')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single()

      if (!branchError && branches) {
        branchesToAssign = [branches.id]
      }
    }
    // Super admins get empty array (access to all branches)

    // Step 3: Create admin profile using the service role function
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
      console.error('Admin profile creation error:', adminError)

      // Cleanup: Delete the auth user if admin profile creation failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }

      return NextResponse.json(
        { error: adminError.message },
        { status: 400 }
      )
    }

    // Check if the function call was successful
    if (!result?.success) {
      // Cleanup: Delete the auth user if admin profile creation failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }

      return NextResponse.json(
        { error: result?.error || 'Failed to create admin profile' },
        { status: 400 }
      )
    }

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
    console.error('Unexpected error in create-user API:', error)

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