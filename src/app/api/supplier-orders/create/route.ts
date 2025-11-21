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

interface SupplierOrderItem {
  product_id: string
  quantity: number
  unit_cost: number
  expected_expiration_date?: string
}

interface CreateSupplierOrderRequest {
  supplier_name: string
  supplier_contact?: string
  supplier_email?: string
  branch_id: string
  expected_delivery_date?: string
  payment_terms?: string
  notes?: string
  items: SupplierOrderItem[]
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateSupplierOrderRequest = await request.json()

    // Validate required fields
    if (!body.supplier_name || !body.branch_id || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: supplier_name, branch_id, and items are required' },
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

    // Calculate totals
    const subtotal = body.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unit_cost)
    }, 0)

    const shipping_cost = 0 // Default, can be added later
    const total_amount = subtotal + shipping_cost

    // Generate order number
    const order_number = `SUP-${Date.now()}`

    // Create supplier order
    const { data: order, error: orderError } = await supabase
      .from('supplier_orders')
      .insert({
        order_number,
        supplier_name: body.supplier_name,
        supplier_contact: body.supplier_contact,
        supplier_email: body.supplier_email,
        branch_id: body.branch_id,
        expected_delivery_date: body.expected_delivery_date,
        subtotal,
        shipping_cost,
        total_amount,
        payment_terms: body.payment_terms,
        notes: body.notes,
        created_by: admin.id,
        status: 'pending'
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating supplier order:', orderError)
      return NextResponse.json(
        { error: 'Failed to create supplier order: ' + orderError.message },
        { status: 500 }
      )
    }

    // Create order items
    const orderItems = body.items.map(item => ({
      supplier_order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      total_cost: item.quantity * item.unit_cost,
      expected_expiration_date: item.expected_expiration_date
    }))

    const { error: itemsError } = await supabase
      .from('supplier_order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Rollback: delete the order
      await supabase.from('supplier_orders').delete().eq('id', order.id)
      return NextResponse.json(
        { error: 'Failed to create order items: ' + itemsError.message },
        { status: 500 }
      )
    }

    // Create initial status history
    await supabase
      .from('supplier_order_status_history')
      .insert({
        supplier_order_id: order.id,
        old_status: null,
        new_status: 'pending',
        changed_by: admin.id,
        notes: 'Supplier order created'
      })

    return NextResponse.json({
      success: true,
      data: {
        order_id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        items_count: body.items.length
      }
    })

  } catch (error) {
    console.error('Supplier order creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
