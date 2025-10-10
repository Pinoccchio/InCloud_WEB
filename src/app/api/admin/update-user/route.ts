import { NextRequest, NextResponse } from 'next/server'
import { validateSuperAdminWithContext } from '@/lib/auth-middleware'
import { logger } from '@/lib/logger'

export async function PUT(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'PUT /api/admin/update-user',
    operation: 'updateAdminUser'
  })
  routeLogger.time('updateAdminUser')

  try {
    routeLogger.info('Starting admin user update request')

    // Get admin context and validate permissions
    const { client, currentAdminId, currentAdminRole, requestBody } = await validateSuperAdminWithContext(request)
    const { adminId, fullName, role, branches, isActive } = requestBody

    routeLogger.debug('Request validated', {
      currentAdminId,
      currentAdminRole,
      targetAdminId: adminId,
      newRole: role,
      hasBranches: branches !== undefined,
      isActive
    })

    // Get audit metadata (currently unused)
    // const auditMetadata = getRequestMetadata(request)

    // Validate required fields
    if (!adminId || !fullName || !role) {
      routeLogger.warn('Missing required fields', { adminId, hasFullName: !!fullName, role })
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

    routeLogger.debug('Validation passed')

    // Determine branches to assign
    let branchesToAssign: string[] = []

    if (branches !== undefined) {
      // If branches are explicitly provided, use them
      branchesToAssign = branches
      routeLogger.debug('Using provided branches', { count: branchesToAssign.length })
    } else {
      // If branches not provided, fetch current admin's branches to preserve them
      routeLogger.info('Fetching current admin branches to preserve them', { adminId })
      routeLogger.db('SELECT', 'admins')
      const { data: currentAdminData, error: fetchError } = await client
        .from('admins')
        .select('branches, role')
        .eq('id', adminId)
        .single()

      if (fetchError) {
        routeLogger.error('Error fetching current admin branches', fetchError)
        return NextResponse.json(
          { error: 'Failed to fetch admin data' },
          { status: 400 }
        )
      }

      branchesToAssign = (currentAdminData?.branches as string[]) || []
      routeLogger.debug('Current branches preserved', { count: branchesToAssign.length })
    }

    // Ensure regular admins have at least the main branch
    if (role === 'admin' && branchesToAssign.length === 0) {
      routeLogger.info('Admin has no branches, assigning main branch')
      routeLogger.db('SELECT', 'branches')
      const { data: mainBranch, error: branchError } = await client
        .from('branches')
        .select('id')
        .eq('is_active', true)
        .limit(1)
        .single()

      if (!branchError && mainBranch) {
        branchesToAssign = [mainBranch.id]
        routeLogger.debug('Assigned main branch to admin', { branchId: mainBranch.id })
      }
    }

    routeLogger.info('Calling update_admin_details_service_role', {
      adminId,
      role,
      branchesCount: branchesToAssign.length
    })

    // Call the service role function with permission validation
    routeLogger.db('RPC', 'update_admin_details_service_role')
    const { data: result, error } = await client
      .rpc('update_admin_details_service_role', {
        p_admin_id: adminId,
        p_full_name: fullName,
        p_role: role,
        p_branches: branchesToAssign,
        p_is_active: isActive,
        p_current_admin_id: currentAdminId,
        p_current_admin_role: currentAdminRole
      })

    if (error) {
      routeLogger.error('Update admin RPC error', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Check if the function call was successful
    if (!result?.success) {
      routeLogger.warn('Update admin failed', {
        adminId,
        error: result?.error
      })
      return NextResponse.json(
        { error: result?.error || 'Failed to update admin' },
        { status: 400 }
      )
    }

    const duration = routeLogger.timeEnd('updateAdminUser')
    routeLogger.success('Admin user updated successfully', {
      duration,
      adminId,
      fullName,
      role,
      branchesCount: branchesToAssign.length,
      performedBy: currentAdminId
    })

    return NextResponse.json({
      success: true,
      message: 'Admin updated successfully'
    })

  } catch (error) {
    routeLogger.error('Unexpected error in update-user API', error as Error)

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
