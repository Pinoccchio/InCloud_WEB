import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { email, password, fullName, role, branches } = await request.json()

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

    // Step 2: Create admin profile using the database function
    const { data: adminId, error: adminError } = await supabaseAdmin
      .rpc('create_admin_profile', {
        p_user_id: authUser.user.id,
        p_full_name: fullName,
        p_email: email,
        p_role: role,
        p_branches: branches || []
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

    // Check if admin ID was returned
    if (!adminId) {
      // Cleanup: Delete the auth user if admin profile creation failed
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }

      return NextResponse.json(
        { error: 'Failed to create admin profile' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        auth_user_id: authUser.user.id,
        admin_id: adminId,
        email: email,
        full_name: fullName,
        role: role
      }
    })

  } catch (error) {
    console.error('Unexpected error in create-user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}