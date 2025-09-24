import { NextRequest, NextResponse } from 'next/server'
import { validateSuperAdminWithContext, getRequestMetadata } from '@/lib/auth-middleware'

export async function PUT(request: NextRequest) {
  try {
    // Get admin context and validate permissions
    const { client, currentAdminId, currentAdminRole, requestBody } = await validateSuperAdminWithContext(request)
    const { adminId, isActive, reason } = requestBody

    // Get audit metadata
    const auditMetadata = getRequestMetadata(request)

    // Validate required fields
    if (!adminId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: adminId and isActive (boolean)' },
        { status: 400 }
      )
    }

    // Call the service role function with permission validation
    const { data: result, error } = await client
      .rpc('toggle_admin_status_service_role', {
        p_admin_id: adminId,
        p_new_status: isActive,
        p_current_admin_id: currentAdminId,
        p_current_admin_role: currentAdminRole,
        p_audit_metadata: {
          ...auditMetadata,
          reason: reason || null,
          action_context: 'admin_status_toggle'
        }
      })

    if (error) {
      console.error('Toggle admin status error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Check if the function call was successful
    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'Failed to toggle admin status' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      isActive: result.new_status
    })

  } catch (error) {
    console.error('Unexpected error in toggle-status API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}