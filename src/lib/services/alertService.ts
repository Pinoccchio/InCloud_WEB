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
  id: string
  type: string
  severity: string
  title: string
  message: string
  product_id?: string
  inventory_id?: string
  batch_id?: string
  metadata: Record<string, any>
}

export class AlertService {
  /**
   * Generate low stock alerts based on inventory levels
   */
  static async generateLowStockAlerts(): Promise<GeneratedAlert[]> {
    const serviceLogger = logger.child({
      service: 'AlertService',
      operation: 'generateLowStockAlerts'
    })
    serviceLogger.time('generateLowStockAlerts')

    try {
      serviceLogger.info('Starting low stock alert generation')
      const branchId = await getMainBranchId()
      serviceLogger.debug('Retrieved branch ID', { branchId })

      // Get inventory items that are low on stock
      serviceLogger.db('SELECT', 'inventory')
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
            sku
          )
        `)
        .eq('branch_id', branchId)
        .or('available_quantity.lte.low_stock_threshold,available_quantity.eq.0')

      if (error) throw error

      serviceLogger.debug('Low stock items fetched', { count: lowStockItems?.length || 0 })

      const alerts: GeneratedAlert[] = []

      for (const item of lowStockItems || []) {
        const isOutOfStock = item.available_quantity === 0
        const isLowStock = item.available_quantity <= (item.low_stock_threshold || 10)

        if (isOutOfStock || isLowStock) {
          // Check if alert already exists for this item
          const { data: existingAlert } = await supabase
            .from('alerts')
            .select('id')
            .eq('type', isOutOfStock ? 'out_of_stock' : 'low_stock')
            .eq('inventory_id', item.id)
            .eq('status', 'active')
            .single()

          if (!existingAlert) {
            // Create new alert
            const alert: GeneratedAlert = {
              id: crypto.randomUUID(),
              type: isOutOfStock ? 'out_of_stock' : 'low_stock',
              severity: isOutOfStock ? 'critical' : 'high',
              title: isOutOfStock ? 'Out of Stock' : 'Low Stock Alert',
              message: `${item.products?.name} ${
                isOutOfStock
                  ? 'is out of stock'
                  : `has only ${item.available_quantity} units remaining (threshold: ${item.low_stock_threshold || 10})`
              }`,
              product_id: item.product_id,
              inventory_id: item.id,
              metadata: {
                current_quantity: item.available_quantity,
                threshold: item.low_stock_threshold || 10,
                product_name: item.products?.name,
                sku: item.products?.sku
              }
            }

            alerts.push(alert)
            serviceLogger.debug('Created low stock alert', {
              type: alert.type,
              productName: item.products?.name,
              quantity: item.available_quantity
            })
          }
        }
      }

      const duration = serviceLogger.timeEnd('generateLowStockAlerts')
      serviceLogger.success('Low stock alerts generated', {
        duration,
        alertsGenerated: alerts.length
      })

      return alerts
    } catch (error) {
      serviceLogger.error('Error generating low stock alerts', error as Error)
      throw error
    }
  }

  /**
   * Generate expiration alerts based on product batches
   */
  static async generateExpirationAlerts(): Promise<GeneratedAlert[]> {
    const serviceLogger = logger.child({
      service: 'AlertService',
      operation: 'generateExpirationAlerts'
    })
    serviceLogger.time('generateExpirationAlerts')

    try {
      serviceLogger.info('Starting expiration alert generation')
      const branchId = await getMainBranchId()
      serviceLogger.debug('Retrieved branch ID', { branchId })

      // Get batches that are expiring soon or expired
      const today = new Date()
      const warningDate = new Date()
      warningDate.setDate(today.getDate() + 7) // 7 days warning

      serviceLogger.db('SELECT', 'product_batches')
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
              sku
            )
          )
        `)
        .eq('is_active', true)
        .lte('expiration_date', warningDate.toISOString())

      if (error) throw error

      serviceLogger.debug('Expiring batches fetched', { count: expiringBatches?.length || 0 })

      const alerts: GeneratedAlert[] = []

      for (const batch of expiringBatches || []) {
        const expirationDate = new Date(batch.expiration_date)
        const isExpired = expirationDate < today
        const daysUntilExpiry = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

        // Check if alert already exists for this batch
        const { data: existingAlert } = await supabase
          .from('alerts')
          .select('id')
          .eq('type', isExpired ? 'expired' : 'expiring_soon')
          .eq('batch_id', batch.id)
          .eq('status', 'active')
          .single()

        if (!existingAlert) {
          const alert: GeneratedAlert = {
            id: crypto.randomUUID(),
            type: isExpired ? 'expired' : 'expiring_soon',
            severity: isExpired ? 'critical' : daysUntilExpiry <= 3 ? 'high' : 'medium',
            title: isExpired ? 'Product Expired' : 'Product Expiring Soon',
            message: `Batch ${batch.batch_number} of ${batch.inventory?.products?.name} ${
              isExpired
                ? `expired ${Math.abs(daysUntilExpiry)} day(s) ago`
                : `expires in ${daysUntilExpiry} day(s)`
            } (${batch.quantity} units)`,
            product_id: batch.inventory?.product_id,
            batch_id: batch.id,
            metadata: {
              batch_number: batch.batch_number,
              expiration_date: batch.expiration_date,
              days_until_expiry: daysUntilExpiry,
              quantity: batch.quantity,
              product_name: batch.inventory?.products?.name,
              sku: batch.inventory?.products?.sku
            }
          }

          alerts.push(alert)
          serviceLogger.debug('Created expiration alert', {
            type: alert.type,
            batchNumber: batch.batch_number,
            productName: batch.inventory?.products?.name,
            daysUntilExpiry
          })
        }
      }

      const duration = serviceLogger.timeEnd('generateExpirationAlerts')
      serviceLogger.success('Expiration alerts generated', {
        duration,
        alertsGenerated: alerts.length
      })

      return alerts
    } catch (error) {
      serviceLogger.error('Error generating expiration alerts', error as Error)
      throw error
    }
  }

  /**
   * Insert generated alerts into the database
   */
  static async insertAlerts(alerts: GeneratedAlert[]): Promise<void> {
    const serviceLogger = logger.child({
      service: 'AlertService',
      operation: 'insertAlerts'
    })

    if (alerts.length === 0) {
      serviceLogger.debug('No alerts to insert, skipping')
      return
    }

    serviceLogger.time('insertAlerts')

    try {
      serviceLogger.info('Inserting alerts into database', { count: alerts.length })
      const branchId = await getMainBranchId()

      // Convert alerts to database format
      const alertsToInsert = alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        message: alert.message,
        branch_id: branchId,
        product_id: alert.product_id || null,
        inventory_id: alert.inventory_id || null,
        batch_id: alert.batch_id || null,
        metadata: alert.metadata,
        status: 'active',
        is_read: false,
        is_acknowledged: false,
        auto_generated: true
      }))

      serviceLogger.db('INSERT', 'alerts')
      const { error } = await supabase
        .from('alerts')
        .insert(alertsToInsert)

      if (error) throw error

      const duration = serviceLogger.timeEnd('insertAlerts')
      serviceLogger.success('Successfully inserted alerts', {
        duration,
        count: alerts.length
      })
    } catch (error) {
      serviceLogger.error('Error inserting alerts', error as Error)
      throw error
    }
  }

  /**
   * Run complete alert generation process
   */
  static async generateAllAlerts(): Promise<{
    lowStockAlerts: GeneratedAlert[]
    expirationAlerts: GeneratedAlert[]
    totalGenerated: number
  }> {
    const serviceLogger = logger.child({
      service: 'AlertService',
      operation: 'generateAllAlerts'
    })
    serviceLogger.time('generateAllAlerts')

    try {
      serviceLogger.info('Starting complete alert generation process')

      // Generate different types of alerts
      const [lowStockAlerts, expirationAlerts] = await Promise.all([
        this.generateLowStockAlerts(),
        this.generateExpirationAlerts()
      ])

      // Insert all alerts
      const allAlerts = [...lowStockAlerts, ...expirationAlerts]
      if (allAlerts.length > 0) {
        await this.insertAlerts(allAlerts)
      }

      const duration = serviceLogger.timeEnd('generateAllAlerts')
      serviceLogger.success('Alert generation complete', {
        duration,
        lowStockCount: lowStockAlerts.length,
        expirationCount: expirationAlerts.length,
        totalGenerated: allAlerts.length
      })

      return {
        lowStockAlerts,
        expirationAlerts,
        totalGenerated: allAlerts.length
      }
    } catch (error) {
      serviceLogger.error('Error in alert generation process', error as Error)
      throw error
    }
  }

  /**
   * Get active alert rules
   */
  static async getActiveAlertRules(): Promise<AlertRule[]> {
    const serviceLogger = logger.child({
      service: 'AlertService',
      operation: 'getActiveAlertRules'
    })
    serviceLogger.time('getActiveAlertRules')

    try {
      serviceLogger.info('Fetching active alert rules')
      serviceLogger.db('SELECT', 'alert_rules')
      const { data: rules, error } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('is_active', true)

      if (error) throw error

      const duration = serviceLogger.timeEnd('getActiveAlertRules')
      serviceLogger.success('Alert rules fetched', {
        duration,
        count: rules?.length || 0
      })

      return rules || []
    } catch (error) {
      serviceLogger.error('Error fetching alert rules', error as Error)
      throw error
    }
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(alertId: string): Promise<void> {
    const serviceLogger = logger.child({
      service: 'AlertService',
      operation: 'acknowledgeAlert'
    })
    serviceLogger.time('acknowledgeAlert')

    try {
      serviceLogger.info('Acknowledging alert', { alertId })
      serviceLogger.db('UPDATE', 'alerts')
      const { error } = await supabase
        .from('alerts')
        .update({
          is_acknowledged: true,
          is_read: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) throw error

      const duration = serviceLogger.timeEnd('acknowledgeAlert')
      serviceLogger.success('Alert acknowledged', { duration, alertId })
    } catch (error) {
      serviceLogger.error('Error acknowledging alert', error as Error, { alertId })
      throw error
    }
  }

  /**
   * Dismiss/resolve an alert
   */
  static async resolveAlert(alertId: string): Promise<void> {
    const serviceLogger = logger.child({
      service: 'AlertService',
      operation: 'resolveAlert'
    })
    serviceLogger.time('resolveAlert')

    try {
      serviceLogger.info('Resolving alert', { alertId })
      serviceLogger.db('UPDATE', 'alerts')
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'resolved',
          is_read: true
        })
        .eq('id', alertId)

      if (error) throw error

      const duration = serviceLogger.timeEnd('resolveAlert')
      serviceLogger.success('Alert resolved', { duration, alertId })
    } catch (error) {
      serviceLogger.error('Error resolving alert', error as Error, { alertId })
      throw error
    }
  }

  /**
   * Clean up old resolved alerts
   */
  static async cleanupOldAlerts(daysOld: number = 30): Promise<void> {
    const serviceLogger = logger.child({
      service: 'AlertService',
      operation: 'cleanupOldAlerts'
    })
    serviceLogger.time('cleanupOldAlerts')

    try {
      serviceLogger.info('Cleaning up old alerts', { daysOld })
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      serviceLogger.db('DELETE', 'alerts')
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('status', 'resolved')
        .lt('created_at', cutoffDate.toISOString())

      if (error) throw error

      const duration = serviceLogger.timeEnd('cleanupOldAlerts')
      serviceLogger.success('Cleaned up old alerts', {
        duration,
        daysOld,
        cutoffDate: cutoffDate.toISOString()
      })
    } catch (error) {
      serviceLogger.error('Error cleaning up old alerts', error as Error, { daysOld })
      throw error
    }
  }

  /**
   * Schedule alert generation (to be called by cron job or manually)
   */
  static async scheduleAlertGeneration(): Promise<{
    lowStockAlerts: GeneratedAlert[]
    expirationAlerts: GeneratedAlert[]
    totalGenerated: number
    cleanupCompleted: boolean
  }> {
    const serviceLogger = logger.child({
      service: 'AlertService',
      operation: 'scheduleAlertGeneration'
    })
    serviceLogger.time('scheduleAlertGeneration')

    try {
      serviceLogger.info('Running scheduled alert generation')

      // Run alert generation
      const result = await this.generateAllAlerts()

      // Clean up old alerts
      await this.cleanupOldAlerts()

      const duration = serviceLogger.timeEnd('scheduleAlertGeneration')
      serviceLogger.success('Scheduled alert generation complete', {
        duration,
        totalGenerated: result.totalGenerated,
        cleanupCompleted: true
      })

      return {
        ...result,
        cleanupCompleted: true
      }
    } catch (error) {
      serviceLogger.error('Error in scheduled alert generation', error as Error)
      throw error
    }
  }
}