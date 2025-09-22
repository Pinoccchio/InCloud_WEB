import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with anon key for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function PUT(request: NextRequest) {
  try {
    const { adminId, fullName, email, role, branches } = await request.json()

    // Validate required fields
    if (!adminId || !fullName || !email || !role) {
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

    // Call the database function to update admin details
    const { data: result, error } = await supabase
      .rpc('update_admin_details', {
        p_admin_id: adminId,
        p_full_name: fullName,
        p_email: email,
        p_role: role,
        p_branches: branches || []
      })

    if (error) {
      console.error('Update admin error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Check if the function call was successful
    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Failed to update admin' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin updated successfully'
    })

  } catch (error) {
    console.error('Unexpected error in update-user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}