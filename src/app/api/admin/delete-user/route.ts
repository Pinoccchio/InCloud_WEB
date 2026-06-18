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

    // Use the authenticated super admin performing the deletion as the
    // reassignment target. This avoids brittle hardcoded-name lookups.
    const reassignmentAdminId = currentAdminId
    routeLogger.debug('Using acting super admin for record reassignment', { reassignmentAdminId })

    // Step 2: Handle dependent records before deletion
    routeLogger.info('Starting record reassignment and cleanup', { fromAdmin: adminId, reassignmentAdminId })

    // Delete user-specific records (these should be removed, not reassigned)
    routeLogger.info('Deleting user-specific records')
    routeLogger.db('DELETE', 'user_preferences, notification_settings')
    const userSpecificTables = ['user_preferences', 'notification_settings']
    for (const table of userSpecificTables) {
      try {
        const { error } = await client
          .from(table)
          .delete()
          .eq('admin_id', adminId)

        if (error) {
          routeLogger.warn(`Failed to delete from ${table}`, { error: error.message })
        }
      } catch (error) {
        routeLogger.warn(`Error deleting from ${table}`, { error })
      }
    }

    // Reassign constrained references so the admin row can be deleted safely.
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
      { table: 'orders', field: 'cancelled_by' },
      { table: 'orders', field: 'created_by' },
      { table: 'orders', field: 'proof_reviewed_by' },
      { table: 'notification_settings', field: 'created_by' },
      { table: 'notification_settings', field: 'updated_by' },
      { table: 'price_tiers', field: 'created_by' },
      { table: 'price_tiers', field: 'updated_by' },
      { table: 'product_batches', field: 'created_by' },
      { table: 'product_batches', field: 'updated_by' },
      { table: 'products', field: 'created_by' },
      { table: 'products', field: 'updated_by' },
      { table: 'restock_history', field: 'performed_by' },
      { table: 'stock_transfers', field: 'approved_by' },
      { table: 'stock_transfers', field: 'requested_by' },
      { table: 'supplier_orders', field: 'assigned_to' },
      { table: 'supplier_orders', field: 'created_by' },
      { table: 'supplier_order_status_history', field: 'changed_by' },
      { table: 'system_settings', field: 'updated_by' }
    ]

    routeLogger.info('Reassigning constrained records', { updateCount: auditTrailUpdates.length })
    routeLogger.db('UPDATE', 'multiple tables (audit trail)')
    for (const { table, field } of auditTrailUpdates) {
      try {
        const { error } = await client
          .from(table)
          .update({ [field]: reassignmentAdminId })
          .eq(field, adminId)

        if (error) {
          routeLogger.warn(`Failed to reassign ${table}.${field}`, { error: error.message })
        }
      } catch (error) {
        routeLogger.warn(`Error reassigning ${table}.${field}`, { error })
      }
    }
    routeLogger.debug('Audit trail reassignment completed')

    // Clear nullable foreign keys that should not be reassigned.
    const nullifyUpdates = [
      { table: 'audit_logs', field: 'admin_id' },
      { table: 'notifications', field: 'acknowledged_by' },
      { table: 'notifications', field: 'resolved_by' }
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

    routeLogger.debug('Nullable foreign key cleanup completed')

    // Step 3: Now delete from admins table
    routeLogger.info('Deleting admin record from admins table', { adminId })
    routeLogger.db('DELETE', 'admins')
    const { error: deleteAdminError } = await client
      .from('admins')
      .delete()
      .eq('id', adminId)

    if (deleteAdminError) {
      routeLogger.error('Error deleting admin record', deleteAdminError)
      return NextResponse.json(
        { error: 'Failed to delete admin record after cleanup' },
        { status: 400 }
      )
    }

    routeLogger.debug('Admin record deleted successfully')

    // Step 4: Delete from auth.users if user_id exists (for real accounts)
    if (adminToDelete.user_id) {
      routeLogger.info('Deleting auth user', { userId: adminToDelete.user_id })
      const { error: deleteAuthError } = await client.auth.admin.deleteUser(adminToDelete.user_id)

      if (deleteAuthError) {
        routeLogger.error('Error deleting auth user', deleteAuthError)
        // Note: Admin record is already deleted, so we log this but don't fail the request
        routeLogger.warn('Admin record deleted but auth user deletion failed', { userId: adminToDelete.user_id })
      } else {
        routeLogger.debug('Auth user deleted successfully')
      }
    }

    // Step 5: Add audit log entry
    routeLogger.info('Creating audit log entry')
    routeLogger.db('INSERT', 'audit_logs')
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
            reassigned_to_admin: reassignmentAdminId,
            records_reassigned: true,
            user_specific_records_deleted: true,
            reason: reason || null,
            action_context: 'admin_deletion_with_cascade_cleanup',
            timestamp: auditMetadata.timestamp
          }
        })
      routeLogger.debug('Audit log entry created successfully')
    } catch (auditError) {
      routeLogger.warn('Failed to create audit log', { error: auditError })
      // Don't fail the request if audit logging fails
    }

    const duration = routeLogger.timeEnd('deleteAdminUser')
    routeLogger.success('Admin user deleted successfully', {
      duration,
      adminId,
      adminName: adminToDelete.full_name,
      role: adminToDelete.role,
      hadAuthUser: !!adminToDelete.user_id,
      performedBy: currentAdminId
    })

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
    routeLogger.error('Unexpected error in delete-user API', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
