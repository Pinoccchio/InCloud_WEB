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

interface CancelOrderRequest {
  notes?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: CancelOrderRequest = await request.json()

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

    // Get current order to validate
    const { data: currentOrder, error: fetchError } = await supabase
      .from('supplier_orders')
      .select('status, order_number')
      .eq('id', id)
      .single()

    if (fetchError || !currentOrder) {
      return NextResponse.json(
        { error: 'Supplier order not found' },
        { status: 404 }
      )
    }

    // Prevent cancelling delivered orders
    if (currentOrder.status === 'delivered') {
      return NextResponse.json(
        { error: 'Cannot cancel a delivered order' },
        { status: 400 }
      )
    }

    // Prevent cancelling already cancelled orders
    if (currentOrder.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Order is already cancelled' },
        { status: 400 }
      )
    }

    const oldStatus = currentOrder.status

    // Update order status to cancelled
    const { error: updateError } = await supabase
      .from('supplier_orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error cancelling supplier order:', updateError)
      return NextResponse.json(
        { error: 'Failed to cancel order' },
        { status: 500 }
      )
    }

    // Create status history entry
    await supabase
      .from('supplier_order_status_history')
      .insert({
        supplier_order_id: id,
        old_status: oldStatus,
        new_status: 'cancelled',
        changed_by: admin.id,
        notes: body.notes || 'Order cancelled by admin'
      })

    return NextResponse.json({
      success: true,
      message: `Supplier order ${currentOrder.order_number} has been cancelled`,
      data: {
        order_id: id,
        order_number: currentOrder.order_number,
        old_status: oldStatus,
        new_status: 'cancelled'
      }
    })

  } catch (error) {
    console.error('Supplier order cancellation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
