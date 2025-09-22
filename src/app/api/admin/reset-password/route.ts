import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// Create regular client for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { adminId } = await request.json()

    // Validate required fields
    if (!adminId) {
      return NextResponse.json(
        { error: 'Admin ID is required' },
        { status: 400 }
      )
    }

    // First, call the database function to validate and get admin details
    const { data: resetResult, error: resetError } = await supabase
      .rpc('reset_admin_password', {
        p_admin_id: adminId
      })

    if (resetError) {
      console.error('Reset password validation error:', resetError)
      return NextResponse.json(
        { error: resetError.message },
        { status: 400 }
      )
    }

    // Check if the function call was successful
    if (!resetResult?.success) {
      return NextResponse.json(
        { error: resetResult?.error || 'Failed to initiate password reset' },
        { status: 400 }
      )
    }

    // Get the admin's email and user_id from the function result
    const adminEmail = resetResult.email

    // Get the auth user_id for this admin
    const { data: adminData, error: adminFetchError } = await supabase
      .from('admins')
      .select('user_id')
      .eq('id', adminId)
      .single()

    if (adminFetchError || !adminData?.user_id) {
      console.error('Error fetching admin user_id:', adminFetchError)
      return NextResponse.json(
        { error: 'Failed to get admin auth user ID' },
        { status: 400 }
      )
    }

    // Send password reset email using Supabase Auth admin API
    const { error: authError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: adminEmail,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?redirect_to=${encodeURIComponent(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')}/reset-password`
      }
    })

    if (authError) {
      console.error('Auth password reset error:', authError)
      return NextResponse.json(
        { error: 'Failed to send password reset email' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent successfully',
      email: adminEmail
    })

  } catch (error) {
    console.error('Unexpected error in reset-password API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}