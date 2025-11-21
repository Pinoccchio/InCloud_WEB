import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAccess } from '@/lib/supabase/admin-auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

type SupplierOrderStatus = 'pending' | 'confirmed' | 'in_transit' | 'delivered' | 'cancelled'

interface UpdateStatusRequest {
  status: SupplierOrderStatus
  notes?: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateStatusRequest = await request.json()

    // Validate status value
    const validStatuses: SupplierOrderStatus[] = ['pending', 'confirmed', 'in_transit', 'delivered', 'cancelled']
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin access using service role
    const { authorized, admin } = await verifyAdminAccess(user.id)

    if (!authorized || !admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get current order to check old status
    const { data: currentOrder, error: fetchError } = await supabase
      .from('supplier_orders')
      .select('status')
      .eq('id', id)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json(
        { error: 'Supplier order not found' },
        { status: 404 }
      )
    }

    // Validate status transition
    const oldStatus = currentOrder.status as SupplierOrderStatus
    const newStatus = body.status

    // Prevent updating from terminal states
    if (oldStatus === 'delivered' || oldStatus === 'cancelled') {
      return NextResponse.json(
        { error: `Cannot update order from ${oldStatus} status` },
        { status: 400 }
      )
    }

    // Prevent moving back to pending from other states
    if (newStatus === 'pending' && oldStatus !== 'pending') {
      return NextResponse.json(
        { error: 'Cannot move order back to pending status' },
        { status: 400 }
      )
    }

    // If status is being set to delivered, call the RPC function to process inventory
    if (newStatus === 'delivered' && oldStatus !== 'delivered') {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('process_supplier_order_delivery', {
          p_supplier_order_id: id,
          p_admin_id: admin.id
        })

      if (rpcError) {
        console.error('Error processing supplier order delivery:', rpcError)
        return NextResponse.json(
          { error: 'Failed to process delivery: ' + rpcError.message },
          { status: 500 }
        )
      }

      // Check if the function returned a success response
      if (!rpcResult?.success) {
        console.error('Function returned failure:', rpcResult)
        return NextResponse.json(
          { error: rpcResult?.error || 'Failed to process delivery' },
          { status: 500 }
        )
      }

      // RPC function already updates status to delivered and creates history
      return NextResponse.json({
        success: true,
        message: 'Supplier order delivered and inventory updated',
        data: rpcResult
      })
    }

    // For non-delivery status updates, manually update
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // If status is confirmed, set actual_delivery_date if expected_delivery_date exists
    if (newStatus === 'confirmed') {
      const { data: orderData } = await supabase
        .from('supplier_orders')
        .select('expected_delivery_date')
        .eq('id', id)
        .single()

      if (!orderData?.expected_delivery_date) {
        updateData.expected_delivery_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Default 7 days
      }
    }

    // Update order status
    const { error: updateError } = await supabase
      .from('supplier_orders')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating supplier order status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      )
    }

    // Create status history entry
    await supabase
      .from('supplier_order_status_history')
      .insert({
        supplier_order_id: id,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by: admin.id,
        notes: body.notes || `Status changed from ${oldStatus} to ${newStatus}`
      })

    return NextResponse.json({
      success: true,
      message: `Supplier order status updated to ${newStatus}`,
      data: {
        order_id: id,
        old_status: oldStatus,
        new_status: newStatus
      }
    })

  } catch (error) {
    console.error('Supplier order status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
