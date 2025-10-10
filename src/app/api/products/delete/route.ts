import { NextRequest, NextResponse } from 'next/server'
import { validateAdminWithContext, getRequestMetadata } from '@/lib/auth-middleware'
import { logger } from '@/lib/logger'

export async function DELETE(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'DELETE /api/products/delete',
    operation: 'deleteProduct'
  })
  routeLogger.time('deleteProduct')

  try {
    routeLogger.info('Starting product deletion request')

    // Get admin context and validate permissions
    const { client, currentAdminId, requestBody } = await validateAdminWithContext(request)
    const { productId, reason } = requestBody

    routeLogger.debug('Request validated', { currentAdminId, productId, hasReason: !!reason })

    // Get audit metadata
    const auditMetadata = getRequestMetadata(request)

    // Validate required fields
    if (!productId) {
      routeLogger.warn('Missing required field: productId')
      return NextResponse.json(
        { error: 'Missing required field: productId' },
        { status: 400 }
      )
    }

    // Get product details before deletion (with related data summary)
    routeLogger.info('Fetching product details before deletion', { productId })
    routeLogger.db('SELECT', 'products')
    const { data: productToDelete, error: fetchError } = await client
      .from('products')
      .select(`
        id,
        name,
        product_id,
        description,
        status,
        brands (name),
        categories (name)
      `)
      .eq('id', productId)
      .single()

    if (fetchError || !productToDelete) {
      routeLogger.error('Product fetch failed', {
        productId,
        error: fetchError?.message,
        errorCode: fetchError?.code,
        errorDetails: fetchError?.details
      })
      return NextResponse.json(
        { error: 'Product not found', details: fetchError?.message },
        { status: 404 }
      )
    }

    routeLogger.debug('Product found', {
      productName: productToDelete.name,
      product_id: productToDelete.product_id,
      status: productToDelete.status
    })

    // Check for business-critical dependencies that should prevent deletion
    routeLogger.info('Checking product dependencies')
    routeLogger.db('SELECT', 'order_items')
    const { data: orderItems, error: orderItemsError } = await client
      .from('order_items')
      .select('id')
      .eq('product_id', productId)
      .limit(1)

    if (orderItemsError) {
      routeLogger.error('Error checking order items', orderItemsError)
      return NextResponse.json(
        { error: 'Failed to check product dependencies' },
        { status: 500 }
      )
    }

    // Check for stock transfers
    routeLogger.db('SELECT', 'stock_transfers')
    const { data: stockTransfers, error: stockTransfersError } = await client
      .from('stock_transfers')
      .select('id')
      .eq('product_id', productId)
      .limit(1)

    if (stockTransfersError) {
      routeLogger.error('Error checking stock transfers', stockTransfersError)
      return NextResponse.json(
        { error: 'Failed to check product dependencies' },
        { status: 500 }
      )
    }

    // Warn if product has business history but allow deletion
    const hasBusinessHistory = (orderItems?.length || 0) > 0 || (stockTransfers?.length || 0) > 0

    if (hasBusinessHistory) {
      routeLogger.warn('Product has business history', {
        hasOrders: (orderItems?.length || 0) > 0,
        hasTransfers: (stockTransfers?.length || 0) > 0
      })
    }

    // Get cascade deletion summary before proceeding
    routeLogger.info('Gathering cascade deletion summary')
    routeLogger.db('SELECT', 'inventory, price_tiers, alerts, alert_configurations')
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

    routeLogger.debug('Cascade summary prepared', cascadeData)

    // Delete the product (cascades will handle related records)
    routeLogger.info('Deleting product', { productId, productName: productToDelete.name })
    routeLogger.db('DELETE', 'products')
    const { error: deleteError } = await client
      .from('products')
      .delete()
      .eq('id', productId)

    if (deleteError) {
      routeLogger.error('Error deleting product', deleteError)

      // Check if error is due to RLS/permission denial
      const isPolicyError = deleteError.message?.includes('policy') ||
                           deleteError.message?.includes('permission') ||
                           deleteError.code === 'PGRST301' ||
                           deleteError.code === '42501'

      if (isPolicyError) {
        return NextResponse.json(
          { error: 'Insufficient permissions to delete this product' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to delete product', details: deleteError.message },
        { status: 400 }
      )
    }

    // Create audit log entry
    routeLogger.info('Creating audit log entry')
    routeLogger.db('INSERT', 'audit_logs')
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
            deleted_product_id: productToDelete.product_id,
            brand_name: productToDelete.brands?.name,
            category_name: productToDelete.categories?.name,
            cascade_summary: cascadeData,
            had_business_history: hasBusinessHistory,
            reason: reason || null,
            action_context: 'product_deletion_with_cascade',
            timestamp: auditMetadata.timestamp
          }
        })
      routeLogger.debug('Audit log entry created successfully')
    } catch (auditError) {
      routeLogger.warn('Failed to create audit log', { error: auditError })
      // Don't fail the request if audit logging fails
    }

    const duration = routeLogger.timeEnd('deleteProduct')
    routeLogger.success('Product deleted successfully', {
      duration,
      productId,
      productName: productToDelete.name,
      product_id: productToDelete.product_id,
      cascadedRecords: cascadeData.inventory_records + cascadeData.price_tiers + cascadeData.alerts + cascadeData.alert_configurations
    })

    return NextResponse.json({
      success: true,
      message: `Product "${productToDelete.name}" has been deleted successfully`,
      deletedProduct: {
        id: productToDelete.id,
        name: productToDelete.name,
        product_id: productToDelete.product_id
      },
      cascadeInfo: cascadeData,
      warningMessage: hasBusinessHistory
        ? 'This product had order or transfer history. All related records have been permanently deleted.'
        : null
    })

  } catch (error) {
    routeLogger.error('Unexpected error in delete product API', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}