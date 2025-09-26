import { NextRequest, NextResponse } from 'next/server'
import { validateAdminWithContext, getRequestMetadata } from '@/lib/auth-middleware'

export async function DELETE(request: NextRequest) {
  try {
    // Get admin context and validate permissions
    const { client, currentAdminId, requestBody } = await validateAdminWithContext(request)
    const { productId, reason } = requestBody

    // Get audit metadata
    const auditMetadata = getRequestMetadata(request)

    // Validate required fields
    if (!productId) {
      return NextResponse.json(
        { error: 'Missing required field: productId' },
        { status: 400 }
      )
    }

    // Get product details before deletion (with related data summary)
    const { data: productToDelete, error: fetchError } = await client
      .from('products')
      .select(`
        id,
        name,
        sku,
        description,
        status,
        brands!inner (name),
        categories!inner (name)
      `)
      .eq('id', productId)
      .single()

    if (fetchError || !productToDelete) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check for business-critical dependencies that should prevent deletion
    const { data: orderItems, error: orderItemsError } = await client
      .from('order_items')
      .select('id')
      .eq('product_id', productId)
      .limit(1)

    if (orderItemsError) {
      console.error('Error checking order items:', orderItemsError)
      return NextResponse.json(
        { error: 'Failed to check product dependencies' },
        { status: 500 }
      )
    }

    // Check for stock transfers
    const { data: stockTransfers, error: stockTransfersError } = await client
      .from('stock_transfers')
      .select('id')
      .eq('product_id', productId)
      .limit(1)

    if (stockTransfersError) {
      console.error('Error checking stock transfers:', stockTransfersError)
      return NextResponse.json(
        { error: 'Failed to check product dependencies' },
        { status: 500 }
      )
    }

    // Warn if product has business history but allow deletion
    const hasBusinessHistory = (orderItems?.length || 0) > 0 || (stockTransfers?.length || 0) > 0

    // Get cascade deletion summary before proceeding
    const [inventoryCount, priceTiersCount, alertsCount, configurationsCount] = await Promise.all([
      client.from('inventory').select('id', { count: 'exact' }).eq('product_id', productId),
      client.from('price_tiers').select('id', { count: 'exact' }).eq('product_id', productId),
      client.from('alerts').select('id', { count: 'exact' }).eq('product_id', productId),
      client.from('alert_configurations').select('id', { count: 'exact' }).eq('product_id', productId)
    ])

    const cascadeData = {
      inventory_records: inventoryCount.count || 0,
      price_tiers: priceTiersCount.count || 0,
      alerts: alertsCount.count || 0,
      alert_configurations: configurationsCount.count || 0,
      has_order_history: (orderItems?.length || 0) > 0,
      has_transfer_history: (stockTransfers?.length || 0) > 0
    }

    // Delete the product (cascades will handle related records)
    const { error: deleteError } = await client
      .from('products')
      .delete()
      .eq('id', productId)

    if (deleteError) {
      console.error('Error deleting product:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete product' },
        { status: 400 }
      )
    }

    // Create audit log entry
    try {
      await client
        .from('audit_logs')
        .insert({
          admin_id: currentAdminId,
          action: 'delete',
          table_name: 'products',
          record_id: productToDelete.id,
          old_data: productToDelete,
          metadata: {
            deleted_product_name: productToDelete.name,
            deleted_product_sku: productToDelete.sku,
            brand_name: productToDelete.brands?.name,
            category_name: productToDelete.categories?.name,
            cascade_summary: cascadeData,
            had_business_history: hasBusinessHistory,
            reason: reason || null,
            action_context: 'product_deletion_with_cascade',
            timestamp: auditMetadata.timestamp
          }
        })
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError)
      // Don't fail the request if audit logging fails
    }

    return NextResponse.json({
      success: true,
      message: `Product "${productToDelete.name}" has been deleted successfully`,
      deletedProduct: {
        id: productToDelete.id,
        name: productToDelete.name,
        sku: productToDelete.sku
      },
      cascadeInfo: cascadeData,
      warningMessage: hasBusinessHistory
        ? 'This product had order or transfer history. Historical records have been preserved.'
        : null
    })

  } catch (error) {
    console.error('Unexpected error in delete product API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}