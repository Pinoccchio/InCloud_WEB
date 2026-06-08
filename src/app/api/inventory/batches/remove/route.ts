import { NextRequest, NextResponse } from 'next/server'
import { validateAdminWithContext } from '@/lib/auth-middleware'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'POST /api/inventory/batches/remove',
    operation: 'removeExpiredBatch'
  })

  try {
    const { client, currentAdminId, requestBody } = await validateAdminWithContext(request)
    const { batchId, reason } = requestBody as {
      batchId?: string
      reason?: string
    }

    if (!batchId) {
      return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 })
    }

    const { data: batch, error: batchError } = await client
      .from('product_batches')
      .select(`
        id,
        batch_number,
        quantity,
        expiration_date,
        inventory_id,
        is_active,
        inventory!inner (
          id,
          quantity,
          branch_id,
          product_id,
          products!inner (
            id,
            name
          )
        )
      `)
      .eq('id', batchId)
      .eq('is_active', true)
      .single()

    if (batchError || !batch) {
      return NextResponse.json({ error: 'Batch not found or already removed' }, { status: 404 })
    }

    const expirationDate = new Date(batch.expiration_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (expirationDate >= today) {
      return NextResponse.json({ error: 'Only expired batches can be removed' }, { status: 400 })
    }

    const inventoryRecord = Array.isArray(batch.inventory) ? batch.inventory[0] : batch.inventory
    const productRecord = Array.isArray(inventoryRecord?.products) ? inventoryRecord.products[0] : inventoryRecord?.products

    if (!inventoryRecord) {
      return NextResponse.json({ error: 'Inventory record not found for batch' }, { status: 500 })
    }

    const currentQuantity = Number(inventoryRecord.quantity) || 0
    const quantityToRemove = Number(batch.quantity) || 0
    const newQuantity = Math.max(0, currentQuantity - quantityToRemove)

    const { error: batchUpdateError } = await client
      .from('product_batches')
      .update({
        is_active: false,
        status: 'removed',
        updated_at: new Date().toISOString(),
        updated_by: currentAdminId
      })
      .eq('id', batch.id)

    if (batchUpdateError) {
      throw batchUpdateError
    }

    const { error: inventoryUpdateError } = await client
      .from('inventory')
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
        updated_by: currentAdminId
      })
      .eq('id', inventoryRecord.id)

    if (inventoryUpdateError) {
      throw inventoryUpdateError
    }

    const { error: movementError } = await client
      .from('inventory_movements')
      .insert({
        inventory_id: inventoryRecord.id,
        movement_type: 'disposal',
        quantity_change: -quantityToRemove,
        quantity_before: currentQuantity,
        quantity_after: newQuantity,
        reference_id: batch.id,
        reference_type: 'batch',
        notes: reason?.trim() || `Expired product disposal (Batch: ${batch.batch_number})`,
        performed_by: currentAdminId
      })

    if (movementError) {
      throw movementError
    }

    await client
      .from('notifications')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: currentAdminId,
        updated_at: new Date().toISOString()
      })
      .eq('related_entity_type', 'batch')
      .eq('related_entity_id', batch.id)
      .eq('type', 'expiration')
      .eq('is_resolved', false)

    return NextResponse.json({
      success: true,
      message: `Successfully removed ${quantityToRemove} units of ${productRecord?.name || 'product'}`,
      data: {
        batchId: batch.id,
        batchNumber: batch.batch_number,
        quantityRemoved: quantityToRemove,
        inventoryId: inventoryRecord.id,
        newQuantity
      }
    })
  } catch (error) {
    routeLogger.error('Failed to remove expired batch', error as Error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove batch' },
      { status: 500 }
    )
  }
}
