import { NextRequest, NextResponse } from 'next/server'
import { validateSuperAdminWithContext } from '@/lib/auth-middleware'

export async function PUT(request: NextRequest) {
  try {
    // Get admin context and validate permissions
    const { client, currentAdminId, currentAdminRole, requestBody } = await validateSuperAdminWithContext(request)
    const { adminId, fullName, role, branches, isActive } = requestBody

    // Get audit metadata (currently unused)
    // const auditMetadata = getRequestMetadata(request)

    // Validate required fields
    if (!adminId || !fullName || !role) {
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

    // Call the service role function with permission validation
    const { data: result, error } = await client
      .rpc('update_admin_details_service_role', {
        p_admin_id: adminId,
        p_full_name: fullName,
        p_role: role,
        p_branches: branches || [],
        p_is_active: isActive,
        p_current_admin_id: currentAdminId,
        p_current_admin_role: currentAdminRole
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