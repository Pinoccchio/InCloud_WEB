import { NextRequest, NextResponse } from 'next/server'
import { validateAdminWithContext, getRequestMetadata } from '@/lib/auth-middleware'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  const routeLogger = logger.child({
    route: 'POST /api/inventory/restock',
    operation: 'restockInventory'
  })
  routeLogger.time('restockInventory')

  try {
    routeLogger.info('Starting inventory restock operation')

    // Get admin context and validate permissions
    const { client, currentAdminId, requestBody } = await validateAdminWithContext(request)
    const {
      productId,
      branchId,
      quantity,
      costPerUnit,
      expirationDate,
      supplierName,
      supplierContact,
      supplierEmail,
      batchNumber,
      purchaseOrderRef,
      receivedDate,
      notes,
      inventoryId
    } = requestBody

    routeLogger.debug('Request validated', {
      currentAdminId,
      productId,
      branchId,
      quantity,
      hasInventoryId: !!inventoryId
    })

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

    if (!branchId) {
      routeLogger.warn('Missing required field: branchId')
      return NextResponse.json(
        { error: 'Missing required field: branchId' },
        { status: 400 }
      )
    }

    if (!quantity || quantity <= 0) {
      routeLogger.warn('Invalid quantity', { quantity })
      return NextResponse.json(
        { error: 'Quantity must be greater than 0' },
        { status: 400 }
      )
    }

    if (!costPerUnit || costPerUnit < 0) {
      routeLogger.warn('Invalid cost per unit', { costPerUnit })
      return NextResponse.json(
        { error: 'Cost per unit must be greater than or equal to 0' },
        { status: 400 }
      )
    }

    if (!supplierName?.trim()) {
      routeLogger.warn('Missing required field: supplierName')
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    if (!batchNumber?.trim()) {
      routeLogger.warn('Missing required field: batchNumber')
      return NextResponse.json(
        { error: 'Batch number is required' },
        { status: 400 }
      )
    }

    // Validate product exists and is available
    routeLogger.info('Validating product', { productId })
    routeLogger.db('SELECT', 'products')
    const { data: product, error: productError } = await client
      .from('products')
      .select('id, name, product_id, status')
      .eq('id', productId)
      .eq('status', 'available')
      .single()

    if (productError || !product) {
      routeLogger.error('Product validation failed', {
        productId,
        error: productError?.message
      })
      return NextResponse.json(
        { error: 'Product not found or unavailable' },
        { status: 404 }
      )
    }

    routeLogger.debug('Product validated', {
      productName: product.name,
      productCode: product.product_id
    })

    // Check if batch number already exists
    routeLogger.info('Checking batch number uniqueness', { batchNumber })
    routeLogger.db('SELECT', 'product_batches')
    const { data: existingBatch } = await client
      .from('product_batches')
      .select('id, batch_number')
      .eq('batch_number', batchNumber.trim())
      .limit(1)

    if (existingBatch && existingBatch.length > 0) {
      routeLogger.warn('Batch number already exists', { batchNumber })
      return NextResponse.json(
        { error: `Batch number "${batchNumber}" already exists. Please use a unique batch number.` },
        { status: 409 }
      )
    }

    // Get or create inventory record
    let targetInventoryId: string
    let currentQuantity = 0
    let currentCostPerUnit = 0

    if (inventoryId) {
      // Use existing inventory record
      routeLogger.info('Using existing inventory record', { inventoryId })
      routeLogger.db('SELECT', 'inventory')
      const { data: inventoryData, error: inventoryError } = await client
        .from('inventory')
        .select('id, quantity, cost_per_unit')
        .eq('id', inventoryId)
        .single()

      if (inventoryError || !inventoryData) {
        routeLogger.error('Inventory record not found', {
          inventoryId,
          error: inventoryError?.message
        })
        return NextResponse.json(
          { error: 'Inventory record not found' },
          { status: 404 }
        )
      }

      targetInventoryId = inventoryData.id
      currentQuantity = inventoryData.quantity
      currentCostPerUnit = Number(inventoryData.cost_per_unit) || 0
    } else {
      // Create new inventory record
      routeLogger.info('Creating new inventory record', { productId, branchId })
      routeLogger.db('INSERT', 'inventory')
      const { data: newInventory, error: createError } = await client
        .from('inventory')
        .insert({
          product_id: productId,
          branch_id: branchId,
          quantity: 0,
          reserved_quantity: 0,
          min_stock_level: 10,
          low_stock_threshold: 10,
          cost_per_unit: 0,
          location: 'Main Storage',
          created_by: currentAdminId
        })
        .select()
        .single()

      if (createError || !newInventory) {
        routeLogger.error('Failed to create inventory record', createError)
        return NextResponse.json(
          { error: `Failed to create inventory record: ${createError?.message}` },
          { status: 500 }
        )
      }

      routeLogger.success('Created new inventory record', {
        inventoryId: newInventory.id
      })
      targetInventoryId = newInventory.id
      currentQuantity = 0
    }

    // Create product batch
    routeLogger.info('Creating product batch', { batchNumber, targetInventoryId })
    routeLogger.db('INSERT', 'product_batches')
    const { data: batch, error: batchError } = await client
      .from('product_batches')
      .insert({
        inventory_id: targetInventoryId,
        batch_number: batchNumber,
        quantity: quantity,
        received_date: receivedDate,
        expiration_date: expirationDate,
        cost_per_unit: costPerUnit,
        supplier_name: supplierName,
        supplier_info: {
          contact: supplierContact,
          email: supplierEmail,
          purchase_order_ref: purchaseOrderRef
        },
        status: 'active',
        is_active: true,
        created_by: currentAdminId
      })
      .select()
      .single()

    if (batchError || !batch) {
      routeLogger.error('Failed to create product batch', batchError)
      return NextResponse.json(
        { error: `Failed to create product batch: ${batchError?.message}` },
        { status: 500 }
      )
    }

    routeLogger.success('Product batch created', { batchId: batch.id })

    // Calculate weighted average cost
    routeLogger.info('Calculating weighted average cost')

    // Get all existing active batches to calculate weighted average
    const { data: existingBatches, error: batchQueryError } = await client
      .from('product_batches')
      .select('quantity, cost_per_unit')
      .eq('inventory_id', targetInventoryId)
      .eq('is_active', true)

    let weightedAvgCost: number

    if (batchQueryError) {
      routeLogger.warn('Could not load existing batches for cost calculation, using new batch cost', batchQueryError)
      weightedAvgCost = costPerUnit
    } else {
      // Calculate total value of existing inventory
      const existingTotalValue = (existingBatches || []).reduce(
        (sum, batch) => sum + (batch.quantity * Number(batch.cost_per_unit)),
        0
      )
      const existingTotalQuantity = (existingBatches || []).reduce(
        (sum, batch) => sum + batch.quantity,
        0
      )

      // Calculate weighted average: (old_value + new_value) / total_quantity
      const newBatchValue = quantity * costPerUnit
      const totalValue = existingTotalValue + newBatchValue
      const totalQuantity = existingTotalQuantity + quantity

      weightedAvgCost = totalQuantity > 0 ? totalValue / totalQuantity : costPerUnit

      routeLogger.info('Weighted average cost calculated', {
        existingBatches: existingBatches?.length || 0,
        existingTotalValue,
        existingTotalQuantity,
        newBatchValue,
        newBatchQuantity: quantity,
        totalValue,
        totalQuantity,
        weightedAvgCost
      })
    }

    // Update inventory quantities with weighted average cost
    const newQuantity = currentQuantity + quantity
    routeLogger.info('Updating inventory quantities', {
      currentQuantity,
      addedQuantity: quantity,
      newQuantity,
      newCostPerUnit: weightedAvgCost,
      previousCostPerUnit: currentCostPerUnit
    })
    routeLogger.db('UPDATE', 'inventory')
    const { error: updateError } = await client
      .from('inventory')
      .update({
        quantity: newQuantity,
        cost_per_unit: weightedAvgCost,
        last_restock_date: receivedDate,
        updated_at: new Date().toISOString(),
        updated_by: currentAdminId
      })
      .eq('id', targetInventoryId)

    if (updateError) {
      routeLogger.error('Failed to update inventory', updateError)
      return NextResponse.json(
        { error: `Failed to update inventory: ${updateError.message}` },
        { status: 500 }
      )
    }

    routeLogger.success('Inventory quantities updated')

    // Create inventory movement record
    routeLogger.info('Creating inventory movement record')
    routeLogger.db('INSERT', 'inventory_movements')
    const { error: movementError } = await client
      .from('inventory_movements')
      .insert({
        inventory_id: targetInventoryId,
        movement_type: 'restock',
        quantity_change: quantity,
        quantity_before: currentQuantity,
        quantity_after: newQuantity,
        reference_id: batch.id,
        reference_type: 'batch',
        notes: notes || `Restock from ${supplierName}`,
        performed_by: currentAdminId
      })

    if (movementError) {
      routeLogger.warn('Failed to create inventory movement record', {
        error: movementError.message
      })
      // Don't fail the request if movement record fails
    } else {
      routeLogger.success('Inventory movement record created')
    }

    // Create restock history record
    routeLogger.info('Creating restock history record')
    routeLogger.db('INSERT', 'restock_history')
    const { error: historyError } = await client
      .from('restock_history')
      .insert({
        inventory_id: targetInventoryId,
        batch_id: batch.id,
        quantity: quantity,
        cost_per_unit: costPerUnit,
        supplier_info: {
          name: supplierName,
          contact: supplierContact,
          email: supplierEmail
        },
        purchase_order_ref: purchaseOrderRef,
        received_date: receivedDate,
        performed_by: currentAdminId,
        notes: notes
      })

    if (historyError) {
      routeLogger.warn('Failed to create restock history', {
        error: historyError.message
      })
      // Don't fail the request if history fails
    } else {
      routeLogger.success('Restock history record created')
    }

    const duration = routeLogger.timeEnd('restockInventory')
    routeLogger.success('Restock operation completed successfully', {
      duration,
      productId,
      productName: product.name,
      batchId: batch.id,
      quantityAdded: quantity,
      newTotalQuantity: newQuantity,
      totalCost: quantity * costPerUnit
    })

    return NextResponse.json({
      success: true,
      message: `Successfully added ${quantity} units of ${product.name}`,
      data: {
        batchId: batch.id,
        inventoryId: targetInventoryId,
        previousQuantity: currentQuantity,
        newQuantity: newQuantity,
        quantityAdded: quantity,
        totalCost: quantity * costPerUnit
      }
    })

  } catch (error) {
    routeLogger.error('Unexpected error in restock inventory API', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
