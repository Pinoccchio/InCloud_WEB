import { supabase } from '@/lib/supabase/auth'
import { getMainBranchId } from '@/lib/constants/branch'

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
    try {
      const branchId = await getMainBranchId()

      // Get inventory items that are low on stock
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
          }
        }
      }

      return alerts
    } catch (error) {
      console.error('Error generating low stock alerts:', error)
      throw error
    }
  }

  /**
   * Generate expiration alerts based on product batches
   */
  static async generateExpirationAlerts(): Promise<GeneratedAlert[]> {
    try {
      const branchId = await getMainBranchId()

      // Get batches that are expiring soon or expired
      const today = new Date()
      const warningDate = new Date()
      warningDate.setDate(today.getDate() + 7) // 7 days warning

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
        }
      }

      return alerts
    } catch (error) {
      console.error('Error generating expiration alerts:', error)
      throw error
    }
  }

  /**
   * Insert generated alerts into the database
   */
  static async insertAlerts(alerts: GeneratedAlert[]): Promise<void> {
    if (alerts.length === 0) return

    try {
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

      const { error } = await supabase
        .from('alerts')
        .insert(alertsToInsert)

      if (error) throw error

      console.log(`✅ Successfully inserted ${alerts.length} alerts`)
    } catch (error) {
      console.error('Error inserting alerts:', error)
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
    try {
      console.log('🔄 Starting alert generation process...')

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

      console.log(`✅ Alert generation complete: ${allAlerts.length} alerts generated`)

      return {
        lowStockAlerts,
        expirationAlerts,
        totalGenerated: allAlerts.length
      }
    } catch (error) {
      console.error('❌ Error in alert generation process:', error)
      throw error
    }
  }

  /**
   * Get active alert rules
   */
  static async getActiveAlertRules(): Promise<AlertRule[]> {
    try {
      const { data: rules, error } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('is_active', true)

      if (error) throw error

      return rules || []
    } catch (error) {
      console.error('Error fetching alert rules:', error)
      throw error
    }
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(alertId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          is_acknowledged: true,
          is_read: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) throw error
    } catch (error) {
      console.error('Error acknowledging alert:', error)
      throw error
    }
  }

  /**
   * Dismiss/resolve an alert
   */
  static async resolveAlert(alertId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({
          status: 'resolved',
          is_read: true
        })
        .eq('id', alertId)

      if (error) throw error
    } catch (error) {
      console.error('Error resolving alert:', error)
      throw error
    }
  }

  /**
   * Clean up old resolved alerts
   */
  static async cleanupOldAlerts(daysOld: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('status', 'resolved')
        .lt('created_at', cutoffDate.toISOString())

      if (error) throw error

      console.log(`🧹 Cleaned up alerts older than ${daysOld} days`)
    } catch (error) {
      console.error('Error cleaning up old alerts:', error)
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
    try {
      console.log('⏰ Running scheduled alert generation...')

      // Run alert generation
      const result = await this.generateAllAlerts()

      // Clean up old alerts
      await this.cleanupOldAlerts()

      console.log(`📊 Scheduled alert generation complete:`, result)

      return {
        ...result,
        cleanupCompleted: true
      }
    } catch (error) {
      console.error('❌ Error in scheduled alert generation:', error)
      throw error
    }
  }
}