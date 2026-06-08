import { supabase } from '@/lib/supabase/auth'
import { getMainBranchId } from '@/lib/constants/branch'
import { logger } from '@/lib/logger'

export interface AlertRule {
  id: string
  name: string
  alert_type: 'low_stock' | 'expiring_soon' | 'expired' | 'out_of_stock' | 'overstock'
  conditions: {
    threshold?: number
    days_before_expiry?: number
    product_ids?: string[]
    category_ids?: string[]
  }
  severity: 'low' | 'medium' | 'high' | 'critical'
  is_active: boolean
}

export interface GeneratedAlert {
  type: 'stock' | 'expiration'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  relatedEntityType: 'inventory' | 'batch'
  relatedEntityId: string
  actionUrl: string
  metadata: Record<string, unknown>
}

export class AlertService {
  static async generateLowStockAlerts(): Promise<GeneratedAlert[]> {
    const serviceLogger = logger.child({
      service: 'AlertService',
      operation: 'generateLowStockAlerts'
    })
    serviceLogger.time('generateLowStockAlerts')

    try {
      const branchId = await getMainBranchId()

      const { data: lowStockItems, error } = await supabase
        .from('inventory')
        .select(`
          id,
          product_id,
          available_quantity,
          low_stock_threshold,
          products (
            id,
            name,
            product_id
          )
        `)
        .eq('branch_id', branchId)
        .or('available_quantity.lte.low_stock_threshold,available_quantity.eq.0')

      if (error) throw error

      const inventoryIds = (lowStockItems || []).map((item) => item.id)
      const existingNotifications = inventoryIds.length > 0
        ? await supabase
            .from('notifications')
            .select('related_entity_id')
            .eq('type', 'stock')
            .eq('related_entity_type', 'inventory')
            .eq('is_resolved', false)
            .in('related_entity_id', inventoryIds)
        : { data: [], error: null }

      if (existingNotifications.error) throw existingNotifications.error

      const existingIds = new Set(
        (existingNotifications.data || [])
          .map((notification) => notification.related_entity_id)
          .filter((id): id is string => typeof id === 'string')
      )

      const alerts: GeneratedAlert[] = []

      for (const item of lowStockItems || []) {
        if (existingIds.has(item.id)) continue

        const isOutOfStock = item.available_quantity === 0
        const threshold = item.low_stock_threshold || 10
        const productName = item.products?.name || 'Unknown product'
        const productCode = item.products?.product_id || null

        alerts.push({
          type: 'stock',
          severity: isOutOfStock ? 'critical' : 'high',
          title: isOutOfStock ? 'Out of Stock' : 'Low Stock Alert',
          message: isOutOfStock
            ? `${productName} is out of stock`
            : `${productName} has only ${item.available_quantity} units remaining (threshold: ${threshold})`,
          relatedEntityType: 'inventory',
          relatedEntityId: item.id,
          actionUrl: '/admin/inventory?stockStatusFilter=low',
          metadata: {
            alert_type: isOutOfStock ? 'out_of_stock' : 'low_stock',
            current_quantity: item.available_quantity,
            threshold,
            product_name: productName,
            product_id: item.product_id,
            product_code: productCode,
            auto_generated: true,
            triggered_by: 'alert_service'
          }
        })
      }

      serviceLogger.success('Low stock alerts generated', {
        alertsGenerated: alerts.length
      })

      return alerts
    } catch (error) {
      serviceLogger.error('Error generating low stock alerts', error as Error)
      throw error
    }
  }

  static async generateExpirationAlerts(): Promise<GeneratedAlert[]> {
    const serviceLogger = logger.child({
      service: 'AlertService',
      operation: 'generateExpirationAlerts'
    })
    serviceLogger.time('generateExpirationAlerts')

    try {
      const warningDate = new Date()
      warningDate.setDate(warningDate.getDate() + 7)
      const now = new Date()

      const { data: expiringBatches, error } = await supabase
        .from('product_batches')
        .select(`
          id,
          batch_number,
          expiration_date,
          quantity,
          inventory (
            id,
            product_id,
            products (
              id,
              name,
              product_id
            )
          )
        `)
        .eq('is_active', true)
        .lte('expiration_date', warningDate.toISOString())

      if (error) throw error

      const batchIds = (expiringBatches || []).map((batch) => batch.id)
      const existingNotifications = batchIds.length > 0
        ? await supabase
            .from('notifications')
            .select('related_entity_id')
            .eq('type', 'expiration')
            .eq('related_entity_type', 'batch')
            .eq('is_resolved', false)
            .in('related_entity_id', batchIds)
        : { data: [], error: null }

      if (existingNotifications.error) throw existingNotifications.error

      const existingIds = new Set(
        (existingNotifications.data || [])
          .map((notification) => notification.related_entity_id)
          .filter((id): id is string => typeof id === 'string')
      )

      const alerts: GeneratedAlert[] = []

      for (const batch of expiringBatches || []) {
        if (existingIds.has(batch.id)) continue

        const expirationDate = new Date(batch.expiration_date)
        const daysUntilExpiry = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        const isExpired = expirationDate < now
        const productName = batch.inventory?.products?.name || 'Unknown product'
        const productCode = batch.inventory?.products?.product_id || null

        alerts.push({
          type: 'expiration',
          severity: isExpired ? 'critical' : daysUntilExpiry <= 3 ? 'high' : 'medium',
          title: isExpired ? 'Product Expired' : 'Product Expiring Soon',
          message: isExpired
            ? `Batch ${batch.batch_number} of ${productName} expired ${Math.abs(daysUntilExpiry)} day(s) ago (${batch.quantity} units)`
            : `Batch ${batch.batch_number} of ${productName} expires in ${daysUntilExpiry} day(s) (${batch.quantity} units)`,
          relatedEntityType: 'batch',
          relatedEntityId: batch.id,
          actionUrl: `/admin/inventory?expirationFilter=${isExpired ? 'expired' : 'expiring'}`,
          metadata: {
            alert_type: isExpired ? 'expired' : 'expiring_soon',
            batch_number: batch.batch_number,
            expiration_date: batch.expiration_date,
            days_until_expiry: daysUntilExpiry,
            quantity: batch.quantity,
            product_name: productName,
            product_id: batch.inventory?.product_id || null,
            product_code: productCode,
            auto_generated: true,
            triggered_by: 'alert_service'
          }
        })
      }

      serviceLogger.success('Expiration alerts generated', {
        alertsGenerated: alerts.length
      })

      return alerts
    } catch (error) {
      serviceLogger.error('Error generating expiration alerts', error as Error)
      throw error
    }
  }

  static async insertAlerts(alerts: GeneratedAlert[]): Promise<void> {
    const serviceLogger = logger.child({
      service: 'AlertService',
      operation: 'insertAlerts'
    })

    if (alerts.length === 0) return

    try {
      const branchId = await getMainBranchId()
      const notificationsToInsert = alerts.map((alert) => ({
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        branch_id: branchId,
        related_entity_type: alert.relatedEntityType,
        related_entity_id: alert.relatedEntityId,
        metadata: alert.metadata,
        action_url: alert.actionUrl,
        is_read: false,
        admin_is_read: false,
        is_acknowledged: false,
        is_resolved: false
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notificationsToInsert)

      if (error) throw error
    } catch (error) {
      serviceLogger.error('Error inserting alerts', error as Error)
      throw error
    }
  }

  static async generateAllAlerts(): Promise<{
    lowStockAlerts: GeneratedAlert[]
    expirationAlerts: GeneratedAlert[]
    totalGenerated: number
  }> {
    const [lowStockAlerts, expirationAlerts] = await Promise.all([
      this.generateLowStockAlerts(),
      this.generateExpirationAlerts()
    ])

    const allAlerts = [...lowStockAlerts, ...expirationAlerts]
    await this.insertAlerts(allAlerts)

    return {
      lowStockAlerts,
      expirationAlerts,
      totalGenerated: allAlerts.length
    }
  }

  static async getActiveAlertRules(): Promise<AlertRule[]> {
    const { data: rules, error } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('is_active', true)

    if (error) throw error
    return rules || []
  }

  static async acknowledgeAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_acknowledged: true,
        admin_is_read: true,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId)

    if (error) throw error
  }

  static async resolveAlert(alertId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_resolved: true,
        admin_is_read: true,
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId)

    if (error) throw error
  }

  static async cleanupOldAlerts(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('is_resolved', true)
      .lt('created_at', cutoffDate.toISOString())

    if (error) throw error
  }

  static async scheduleAlertGeneration(): Promise<{
    lowStockAlerts: GeneratedAlert[]
    expirationAlerts: GeneratedAlert[]
    totalGenerated: number
    cleanupCompleted: boolean
  }> {
    const result = await this.generateAllAlerts()
    await this.cleanupOldAlerts()

    return {
      ...result,
      cleanupCompleted: true
    }
  }
}
