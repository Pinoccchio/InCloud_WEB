import { NextRequest, NextResponse } from 'next/server'
import { validateSuperAdminWithContext } from '@/lib/auth-middleware'

export async function DELETE(request: NextRequest) {
  try {
    // Get admin context and validate permissions
    const { client, currentAdminId, currentAdminRole, requestBody } = await validateSuperAdminWithContext(request)
    const { adminId } = requestBody

    // Validate required fields
    if (!adminId) {
      return NextResponse.json(
        { error: 'Missing required field: adminId' },
        { status: 400 }
      )
    }

    // Get admin details before deletion
    const { data: adminToDelete, error: fetchError } = await client
      .from('admins')
      .select('id, full_name, role, user_id')
      .eq('id', adminId)
      .single()

    if (fetchError || !adminToDelete) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      )
    }

    // Security checks
    if (adminToDelete.id === currentAdminId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      )
    }

    if (adminToDelete.role === 'super_admin') {
      return NextResponse.json(
        { error: 'Cannot delete super admin accounts' },
        { status: 403 }
      )
    }

    // Step 1: Delete from admins table
    const { error: deleteAdminError } = await client
      .from('admins')
      .delete()
      .eq('id', adminId)

    if (deleteAdminError) {
      console.error('Error deleting admin record:', deleteAdminError)
      return NextResponse.json(
        { error: 'Failed to delete admin record' },
        { status: 400 }
      )
    }

    // Step 2: Delete from auth.users if user_id exists (for real accounts)
    if (adminToDelete.user_id) {
      const { error: deleteAuthError } = await client.auth.admin.deleteUser(adminToDelete.user_id)

      if (deleteAuthError) {
        console.error('Error deleting auth user:', deleteAuthError)
        // Note: Admin record is already deleted, so we log this but don't fail the request
        console.warn(`Admin record deleted but auth user deletion failed for user_id: ${adminToDelete.user_id}`)
      }
    }

    // Step 3: Add audit log entry
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
            had_auth_user: !!adminToDelete.user_id
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