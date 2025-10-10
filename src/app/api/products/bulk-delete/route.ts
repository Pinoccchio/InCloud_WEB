import { NextRequest, NextResponse } from 'next/server'
import { validateAdminWithContext, getRequestMetadata } from '@/lib/auth-middleware'
import { logger } from '@/lib/logger'

export async function DELETE(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'DELETE /api/products/bulk-delete',
    operation: 'bulkDeleteProducts'
  })
  routeLogger.time('bulkDeleteProducts')

  try {
    routeLogger.info('Starting bulk product deletion request')

    // Get admin context and validate permissions
    const { client, currentAdminId, requestBody } = await validateAdminWithContext(request)
    const { productIds } = requestBody

    routeLogger.debug('Request validated', { currentAdminId, productCount: productIds?.length })

    // Get audit metadata
    const auditMetadata = getRequestMetadata(request)

    // Validate required fields
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      routeLogger.warn('Missing or invalid productIds')
      return NextResponse.json(
        { error: 'Missing or invalid productIds. Must be a non-empty array.' },
        { status: 400 }
      )
    }

    // Get product details before deletion
    routeLogger.info('Fetching products before deletion', { productCount: productIds.length })
    routeLogger.db('SELECT', 'products')
    const { data: productsToDelete, error: fetchError } = await client
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
      .in('id', productIds)

    if (fetchError) {
      routeLogger.error('Products fetch failed', {
        error: fetchError.message,
        errorCode: fetchError.code
      })
      return NextResponse.json(
        { error: 'Failed to fetch products', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!productsToDelete || productsToDelete.length === 0) {
      routeLogger.warn('No products found with provided IDs')
      return NextResponse.json(
        { error: 'No products found with the provided IDs' },
        { status: 404 }
      )
    }

    routeLogger.debug('Products found', { count: productsToDelete.length })

    // Check for business-critical dependencies
    routeLogger.info('Checking products dependencies')
    const hasBusinessHistory: Record<string, boolean> = {}

    for (const product of productsToDelete) {
      routeLogger.db('SELECT', 'order_items, stock_transfers')
      const [orderItemsResult, stockTransfersResult] = await Promise.all([
        client.from('order_items').select('id').eq('product_id', product.id).limit(1),
        client.from('stock_transfers').select('id').eq('product_id', product.id).limit(1)
      ])

      hasBusinessHistory[product.id] =
        (orderItemsResult.data?.length || 0) > 0 ||
        (stockTransfersResult.data?.length || 0) > 0
    }

    // Get cascade deletion summary for all products
    routeLogger.info('Gathering cascade deletion summary for all products')
    const cascadeSummary = {
      inventory_records: 0,
      price_tiers: 0,
      alerts: 0,
      alert_configurations: 0,
      products_with_history: 0
    }

    routeLogger.db('SELECT', 'inventory, price_tiers, alerts, alert_configurations')
    const [inventoryCount, priceTiersCount, alertsCount, configurationsCount] = await Promise.all([
      client.from('inventory').select('id', { count: 'exact' }).in('product_id', productIds),
      client.from('price_tiers').select('id', { count: 'exact' }).in('product_id', productIds),
      client.from('alerts').select('id', { count: 'exact' }).in('product_id', productIds),
      client.from('alert_configurations').select('id', { count: 'exact' }).in('product_id', productIds)
    ])

    cascadeSummary.inventory_records = inventoryCount.count || 0
    cascadeSummary.price_tiers = priceTiersCount.count || 0
    cascadeSummary.alerts = alertsCount.count || 0
    cascadeSummary.alert_configurations = configurationsCount.count || 0
    cascadeSummary.products_with_history = Object.values(hasBusinessHistory).filter(v => v).length

    routeLogger.debug('Cascade summary prepared', cascadeSummary)

    // Delete all products (cascades will handle related records)
    routeLogger.info('Deleting products', { count: productIds.length })
    routeLogger.db('DELETE', 'products')
    const { error: deleteError } = await client
      .from('products')
      .delete()
      .in('id', productIds)

    if (deleteError) {
      routeLogger.error('Error bulk deleting products', deleteError)

      // Check if error is due to RLS/permission denial
      const isPolicyError = deleteError.message?.includes('policy') ||
                           deleteError.message?.includes('permission') ||
                           deleteError.code === 'PGRST301' ||
                           deleteError.code === '42501'

      if (isPolicyError) {
        return NextResponse.json(
          { error: 'Insufficient permissions to delete these products' },
          { status: 403 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to delete products', details: deleteError.message },
        { status: 400 }
      )
    }

    // Create audit log entries for each deleted product
    routeLogger.info('Creating audit log entries')
    routeLogger.db('INSERT', 'audit_logs')
    try {
      const auditEntries = productsToDelete.map(product => ({
        admin_id: currentAdminId,
        action: 'delete',
        table_name: 'products',
        record_id: product.id,
        old_data: product,
        metadata: {
          deleted_product_name: product.name,
          deleted_product_id: product.product_id,
          brand_name: product.brands?.name,
          category_name: product.categories?.name,
          had_business_history: hasBusinessHistory[product.id] || false,
          action_context: 'bulk_product_deletion',
          bulk_operation_id: `bulk_delete_${Date.now()}`,
          timestamp: auditMetadata.timestamp
        }
      }))

      await client.from('audit_logs').insert(auditEntries)
      routeLogger.debug('Audit log entries created successfully', { count: auditEntries.length })
    } catch (auditError) {
      routeLogger.warn('Failed to create audit logs', { error: auditError })
      // Don't fail the request if audit logging fails
    }

    const duration = routeLogger.timeEnd('bulkDeleteProducts')
    routeLogger.success('Products deleted successfully', {
      duration,
      productCount: productsToDelete.length,
      cascadedRecords: cascadeSummary.inventory_records + cascadeSummary.price_tiers +
                       cascadeSummary.alerts + cascadeSummary.alert_configurations
    })

    return NextResponse.json({
      success: true,
      message: `${productsToDelete.length} product(s) have been deleted successfully`,
      deletedCount: productsToDelete.length,
      deletedProducts: productsToDelete.map(p => ({
        id: p.id,
        name: p.name,
        product_id: p.product_id
      })),
      cascadeInfo: cascadeSummary,
      warningMessage: cascadeSummary.products_with_history > 0
        ? `${cascadeSummary.products_with_history} product(s) had order or transfer history. All related records have been permanently deleted.`
        : null
    })

  } catch (error) {
    routeLogger.error('Unexpected error in bulk delete products API', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
