import { NextRequest, NextResponse } from 'next/server'
import { validateSuperAdminWithContext, getRequestMetadata } from '@/lib/auth-middleware'
import { logger } from '@/lib/logger'

export async function PUT(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'PUT /api/admin/toggle-status',
    operation: 'toggleAdminStatus'
  })
  routeLogger.time('toggleAdminStatus')

  try {
    routeLogger.info('Starting admin status toggle request')

    // Get admin context and validate permissions
    const { client, currentAdminId, currentAdminRole, requestBody } = await validateSuperAdminWithContext(request)
    const { adminId, isActive, reason } = requestBody

    routeLogger.debug('Request validated', {
      currentAdminId,
      currentAdminRole,
      targetAdminId: adminId,
      newStatus: isActive,
      hasReason: !!reason
    })

    // Get audit metadata
    const auditMetadata = getRequestMetadata(request)

    // Validate required fields
    if (!adminId || typeof isActive !== 'boolean') {
      routeLogger.warn('Missing required fields', { adminId, isActive })
      return NextResponse.json(
        { error: 'Missing required fields: adminId and isActive (boolean)' },
        { status: 400 }
      )
    }

    // Call the service role function with permission validation
    routeLogger.info('Calling toggle_admin_status_service_role', { adminId, isActive })
    routeLogger.db('RPC', 'toggle_admin_status_service_role')
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
      routeLogger.error('Toggle admin status RPC error', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Check if the function call was successful
    if (!result?.success) {
      routeLogger.warn('Toggle admin status failed', {
        adminId,
        error: result?.error
      })
      return NextResponse.json(
        { error: result?.error || 'Failed to toggle admin status' },
        { status: 400 }
      )
    }

    const duration = routeLogger.timeEnd('toggleAdminStatus')
    routeLogger.success('Admin status toggled successfully', {
      duration,
      adminId,
      newStatus: result.new_status,
      performedBy: currentAdminId
    })

    return NextResponse.json({
      success: true,
      message: result.message,
      isActive: result.new_status
    })

  } catch (error) {
    routeLogger.error('Unexpected error in toggle-status API', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}