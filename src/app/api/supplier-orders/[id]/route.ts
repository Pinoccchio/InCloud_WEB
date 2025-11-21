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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    // Get supplier order details
    const { data: order, error: orderError } = await supabase
      .from('supplier_orders')
      .select(`
        id,
        order_number,
        supplier_name,
        supplier_contact,
        supplier_email,
        branch_id,
        created_by,
        status,
        order_date,
        expected_delivery_date,
        actual_delivery_date,
        subtotal,
        shipping_cost,
        total_amount,
        payment_terms,
        payment_status,
        notes,
        created_at,
        updated_at,
        branches!inner(id, name),
        admins!supplier_orders_created_by_fkey(id, full_name)
      `)
      .eq('id', id)
      .single()

    if (orderError) {
      console.error('Error fetching supplier order:', orderError)
      return NextResponse.json(
        { error: 'Supplier order not found' },
        { status: 404 }
      )
    }

    // Get order items with product details
    const { data: items, error: itemsError } = await supabase
      .from('supplier_order_items')
      .select(`
        id,
        supplier_order_id,
        product_id,
        quantity,
        unit_cost,
        total_cost,
        expected_expiration_date,
        batch_number,
        received_quantity,
        products!inner(
          id,
          name,
          product_id,
          unit_of_measure
        )
      `)
      .eq('supplier_order_id', id)

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      return NextResponse.json(
        { error: 'Failed to fetch order items' },
        { status: 500 }
      )
    }

    // Get status history
    const { data: statusHistory, error: historyError } = await supabase
      .from('supplier_order_status_history')
      .select(`
        id,
        old_status,
        new_status,
        notes,
        created_at,
        admins!supplier_order_status_history_changed_by_fkey(id, full_name)
      `)
      .eq('supplier_order_id', id)
      .order('created_at', { ascending: false })

    if (historyError) {
      console.error('Error fetching status history:', historyError)
    }

    // Format response
    const formattedOrder = {
      ...order,
      branch_name: order.branches?.name || 'Unknown Branch',
      created_by_name: order.admins?.full_name || 'Unknown Admin',
      total_amount: parseFloat(order.total_amount || '0'),
      subtotal: parseFloat(order.subtotal || '0'),
      shipping_cost: parseFloat(order.shipping_cost || '0'),
      items: items?.map(item => ({
        ...item,
        product_name: item.products?.name || 'Unknown Product',
        sku: item.products?.product_id,
        unit_of_measure: item.products?.unit_of_measure,
        unit_cost: parseFloat(item.unit_cost || '0'),
        total_cost: parseFloat(item.total_cost || '0')
      })) || [],
      status_history: statusHistory?.map(history => ({
        ...history,
        changed_by_name: history.admins?.full_name || 'Unknown Admin'
      })) || []
    }

    return NextResponse.json({
      success: true,
      data: formattedOrder
    })

  } catch (error) {
    console.error('Supplier order details error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
