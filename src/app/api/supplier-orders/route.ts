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

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('supplier_orders')
      .select(`
        id,
        order_number,
        supplier_name,
        supplier_contact,
        supplier_email,
        branch_id,
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
        branches!inner(name)
      `, { count: 'exact' })

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (startDate) {
      query = query.gte('order_date', startDate)
    }

    if (endDate) {
      query = query.lte('order_date', endDate)
    }

    // Execute query with pagination
    const { data: orders, error: ordersError, count } = await query
      .order('order_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (ordersError) {
      console.error('Error fetching supplier orders:', ordersError)
      return NextResponse.json(
        { error: 'Failed to fetch supplier orders' },
        { status: 500 }
      )
    }

    // Get item counts for each order
    const orderIds = orders?.map(o => o.id) || []
    const { data: itemCounts } = await supabase
      .from('supplier_order_items')
      .select('supplier_order_id')
      .in('supplier_order_id', orderIds)

    // Group by order_id
    const itemCountMap = (itemCounts || []).reduce((acc, item) => {
      acc[item.supplier_order_id] = (acc[item.supplier_order_id] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Enhance orders with item counts and branch names
    const enhancedOrders = orders?.map(order => ({
      ...order,
      branch_name: order.branches?.name || 'Unknown Branch',
      items_count: itemCountMap[order.id] || 0,
      total_amount: parseFloat(order.total_amount || '0'),
      subtotal: parseFloat(order.subtotal || '0'),
      shipping_cost: parseFloat(order.shipping_cost || '0')
    }))

    return NextResponse.json({
      success: true,
      data: enhancedOrders,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Supplier orders list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
