import { NextRequest, NextResponse } from 'next/server'
import { validateSuperAdminWithContext, getRequestMetadata } from '@/lib/auth-middleware'
import { logger } from '@/lib/logger'

export async function DELETE(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'DELETE /api/admin/delete-user',
    operation: 'deleteAdminUser'
  })
  routeLogger.time('deleteAdminUser')

  try {
    routeLogger.info('Starting admin user deletion request')

    // Get admin context and validate permissions
    const { client, currentAdminId, requestBody } = await validateSuperAdminWithContext(request)
    const { adminId, reason } = requestBody

    routeLogger.debug('Request validated', {
      currentAdminId,
      targetAdminId: adminId,
      hasReason: !!reason
    })

    // Get audit metadata
    const auditMetadata = getRequestMetadata(request)

    // Validate required fields
    if (!adminId) {
      routeLogger.warn('Missing required field: adminId')
      return NextResponse.json(
        { error: 'Missing required field: adminId' },
        { status: 400 }
      )
    }

    // Get admin details before deletion
    routeLogger.info('Fetching admin details before deletion', { adminId })
    routeLogger.db('SELECT', 'admins')
    const { data: adminToDelete, error: fetchError } = await client
      .from('admins')
      .select('id, full_name, role, user_id')
      .eq('id', adminId)
      .single()

    if (fetchError || !adminToDelete) {
      routeLogger.warn('Admin not found', { adminId, error: fetchError?.message })
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    routeLogger.debug('Admin found', {
      fullName: adminToDelete.full_name,
      role: adminToDelete.role,
      hasUserId: !!adminToDelete.user_id
    })

    // Security checks
    if (adminToDelete.id === currentAdminId) {
      routeLogger.warn('Attempted to delete own account', { adminId })
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      )
    }

    if (adminToDelete.role === 'super_admin') {
      routeLogger.warn('Attempted to delete super admin', { adminId, fullName: adminToDelete.full_name })
      return NextResponse.json(
        { error: 'Cannot delete super admin accounts' },
        { status: 403 }
      )
    }

    routeLogger.info('Security checks passed')

    // Step 1: Get system admin ID for reassignment
    routeLogger.info('Looking up system admin for record reassignment')
    routeLogger.db('SELECT', 'admins')
    const { data: systemAdmin, error: systemAdminError } = await client
      .from('admins')
      .select('id')
      .eq('full_name', 'Pinocchio Incloud Super Admin')
      .eq('role', 'super_admin')
      .single()

    if (systemAdminError || !systemAdmin) {
      routeLogger.error('System admin not found', systemAdminError)
      return NextResponse.json(
        { error: 'System admin not found for record reassignment' },
        { status: 500 }
      )
    }

    const systemAdminId = systemAdmin.id
    routeLogger.debug('System admin found', { systemAdminId })

    // Step 2: Handle dependent records before deletion
    routeLogger.info('Starting record reassignment and cleanup', { fromAdmin: adminId, toSystemAdmin: systemAdminId })

    // Delete user-specific records (these should be removed, not reassigned)
    const userSpecificTables = ['user_preferences', 'notification_settings']
    for (const table of userSpecificTables) {
      try {
        const { error } = await client
          .from(table)
          .delete()
          .eq('admin_id', adminId)

        if (error) {
          console.warn(`Failed to delete from ${table}:`, error)
        }
      } catch (error) {
        console.warn(`Error deleting from ${table}:`, error)
      }
    }

    // Reassign audit trail records to system admin (preserve history)
    const auditTrailUpdates = [
      // Tables with created_by field
      { table: 'alert_rules', field: 'created_by' },
      { table: 'analytics_reports', field: 'generated_by' },
      { table: 'brands', field: 'created_by' },
      { table: 'brands', field: 'updated_by' },
      { table: 'categories', field: 'created_by' },
      { table: 'categories', field: 'updated_by' },
      { table: 'inventory', field: 'created_by' },
      { table: 'inventory', field: 'updated_by' },
      { table: 'inventory_movements', field: 'performed_by' },
      { table: 'order_fulfillment', field: 'packed_by' },
      { table: 'order_fulfillment', field: 'picked_by' },
      { table: 'order_fulfillment', field: 'delivered_by' },
      { table: 'order_status_history', field: 'changed_by' },
      { table: 'orders', field: 'assigned_to' },
      { table: 'orders', field: 'created_by' },
      { table: 'price_tiers', field: 'created_by' },
      { table: 'price_tiers', field: 'updated_by' },
      { table: 'product_batches', field: 'created_by' },
      { table: 'product_batches', field: 'updated_by' },
      { table: 'products', field: 'created_by' },
      { table: 'products', field: 'updated_by' },
      { table: 'restock_history', field: 'performed_by' },
      { table: 'stock_transfers', field: 'approved_by' },
      { table: 'stock_transfers', field: 'requested_by' },
      { table: 'system_settings', field: 'updated_by' }
    ]

    // Reassign records to system admin
    for (const { table, field } of auditTrailUpdates) {
      try {
        const { error } = await client
          .from(table)
          .update({ [field]: systemAdminId })
          .eq(field, adminId)

        if (error) {
          console.warn(`Failed to reassign ${table}.${field}:`, error)
        }
      } catch (error) {
        console.warn(`Error reassigning ${table}.${field}:`, error)
      }
    }

    // Handle nullable foreign keys - set to null instead of reassigning
    const nullifyUpdates = [
      { table: 'alerts', field: 'acknowledged_by' }
    ]

    for (const { table, field } of nullifyUpdates) {
      try {
        const { error } = await client
          .from(table)
          .update({ [field]: null })
          .eq(field, adminId)

        if (error) {
          console.warn(`Failed to nullify ${table}.${field}:`, error)
        }
      } catch (error) {
        console.warn(`Error nullifying ${table}.${field}:`, error)
      }
    }

    // Keep audit_logs for historical purposes (don't reassign admin_id)

    // Step 3: Now delete from admins table
    const { error: deleteAdminError } = await client
      .from('admins')
      .delete()
      .eq('id', adminId)

    if (deleteAdminError) {
      console.error('Error deleting admin record:', deleteAdminError)
      return NextResponse.json(
        { error: 'Failed to delete admin record after cleanup' },
        { status: 400 }
      )
    }

    // Step 4: Delete from auth.users if user_id exists (for real accounts)
    if (adminToDelete.user_id) {
      const { error: deleteAuthError } = await client.auth.admin.deleteUser(adminToDelete.user_id)

      if (deleteAuthError) {
        console.error('Error deleting auth user:', deleteAuthError)
        // Note: Admin record is already deleted, so we log this but don't fail the request
        console.warn(`Admin record deleted but auth user deletion failed for user_id: ${adminToDelete.user_id}`)
      }
    }

    // Step 5: Add audit log entry
    try {
      await client
        .from('audit_logs')
        .insert({
          admin_id: currentAdminId,
          action: 'delete',
          table_name: 'admins',
          record_id: adminToDelete.id,
          old_data: adminToDelete,
          metadata: {
            deleted_admin_name: adminToDelete.full_name,
            deleted_admin_role: adminToDelete.role,
            had_auth_user: !!adminToDelete.user_id,
            reassigned_to_system_admin: systemAdminId,
            records_reassigned: true,
            user_specific_records_deleted: true,
            reason: reason || null,
            action_context: 'admin_deletion_with_cascade_cleanup',
            timestamp: auditMetadata.timestamp
          }
        })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Admin account '${adminToDelete.full_name}' has been deleted successfully`,
      deletedAdmin: {
        id: adminToDelete.id,
        full_name: adminToDelete.full_name,
        role: adminToDelete.role
      }
    })

  } catch (error) {
    console.error('Unexpected error in delete-user API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}