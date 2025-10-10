import { supabase } from '@/lib/supabase/auth'
import { logger } from '@/lib/logger'

export interface SuperAdminMetrics {
  // Admin metrics
  totalAdmins: number
  superAdmins: number
  regularAdmins: number
  activeAdmins: number
  inactiveAdmins: number
  recentlyAddedAdmins: number

  // System-wide metrics
  totalProducts: number
  activeProducts: number
  totalOrders: number
  pendingOrders: number
  confirmedOrders: number
  deliveredOrders: number
  totalRevenue: number
  todaysOrders: number
  thisWeekOrders: number

  // Inventory & alerts
  totalInventoryItems: number
  lowStockItems: number
  totalNotifications: number
  unresolvedNotifications: number
  criticalNotifications: number
  highPriorityNotifications: number

  // Branches & customers
  totalBranches: number
  activeBranches: number
  totalCustomers: number

  // Product batches
  expiringThisWeek: number
  expiredBatches: number

  // Audit activity
  totalActivitiesToday: number
  activeAdminsToday: number
}

export interface AdminActivity {
  id: string
  action: string
  tableName: string
  adminName: string
  adminRole: string
  changeSummary: string
  timestamp: string
  severity: 'low' | 'medium' | 'high'
}

export interface SystemHealth {
  database: 'operational' | 'warning' | 'error'
  admins: 'operational' | 'warning' | 'error'
  inventory: 'operational' | 'warning' | 'error'
  notifications: 'operational' | 'warning' | 'error'
}

export class SuperAdminDashboardService {
  /**
   * Get comprehensive super admin dashboard metrics
   */
  static async getSuperAdminMetrics(): Promise<SuperAdminMetrics> {
    const serviceLogger = logger.child({
      service: 'SuperAdminDashboardService',
      operation: 'getSuperAdminMetrics'
    })
    serviceLogger.time('getSuperAdminMetrics')

    try {
      serviceLogger.info('Fetching comprehensive super admin dashboard metrics')

      // Fetch all data in parallel for performance
      const [
        adminsData,
        productsData,
        ordersData,
        inventoryData,
        notificationsData,
        branchesData,
        customersData,
        batchesData,
        auditData
      ] = await Promise.all([
        this.getAdminMetrics(),
        this.getProductMetrics(),
        this.getOrderMetrics(),
        this.getInventoryMetrics(),
        this.getNotificationMetrics(),
        this.getBranchMetrics(),
        this.getCustomerMetrics(),
        this.getBatchMetrics(),
        this.getAuditMetrics()
      ])

      const duration = serviceLogger.timeEnd('getSuperAdminMetrics')
      serviceLogger.success('Super admin metrics fetched successfully', {
        duration,
        totalAdmins: adminsData.totalAdmins,
        totalProducts: productsData.totalProducts,
        totalOrders: ordersData.totalOrders
      })

      return {
        ...adminsData,
        ...productsData,
        ...ordersData,
        ...inventoryData,
        ...notificationsData,
        ...branchesData,
        ...customersData,
        ...batchesData,
        ...auditData
      }
    } catch (error) {
      serviceLogger.error('Error fetching super admin metrics', error as Error)
      throw error
    }
  }

  /**
   * Get admin-related metrics
   */
  private static async getAdminMetrics() {
    const serviceLogger = logger.child({
      service: 'SuperAdminDashboardService',
      operation: 'getAdminMetrics'
    })

    serviceLogger.db('SELECT', 'admins')
    const { data: admins, error } = await supabase
      .from('admins')
      .select('id, role, is_active, created_at')

    if (error) {
      serviceLogger.error('Error fetching admin metrics', error)
      return {
        totalAdmins: 0,
        superAdmins: 0,
        regularAdmins: 0,
        activeAdmins: 0,
        inactiveAdmins: 0,
        recentlyAddedAdmins: 0
      }
    }

    const now = new Date()
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const result = {
      totalAdmins: admins?.length || 0,
      superAdmins: admins?.filter(a => a.role === 'super_admin').length || 0,
      regularAdmins: admins?.filter(a => a.role === 'admin').length || 0,
      activeAdmins: admins?.filter(a => a.is_active).length || 0,
      inactiveAdmins: admins?.filter(a => !a.is_active).length || 0,
      recentlyAddedAdmins: admins?.filter(a =>
        a.created_at && new Date(a.created_at) > lastWeek
      ).length || 0
    }

    serviceLogger.debug('Admin metrics calculated', result)
    return result
  }

  /**
   * Get product-related metrics
   */
  private static async getProductMetrics() {
    const serviceLogger = logger.child({
      service: 'SuperAdminDashboardService',
      operation: 'getProductMetrics'
    })

    serviceLogger.db('SELECT', 'products')
    const { data: products, error } = await supabase
      .from('products')
      .select('id, status')

    if (error) {
      serviceLogger.error('Error fetching product metrics', error)
      return {
        totalProducts: 0,
        activeProducts: 0
      }
    }

    const result = {
      totalProducts: products?.length || 0,
      activeProducts: products?.filter(p => p.status === 'active').length || 0
    }

    serviceLogger.debug('Product metrics calculated', result)
    return result
  }

  /**
   * Get order-related metrics
   */
  private static async getOrderMetrics() {
    const serviceLogger = logger.child({
      service: 'SuperAdminDashboardService',
      operation: 'getOrderMetrics'
    })

    serviceLogger.db('SELECT', 'orders')
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, status, total_amount, order_date')

    if (error) {
      serviceLogger.error('Error fetching order metrics', error)
      return {
        totalOrders: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        deliveredOrders: 0,
        totalRevenue: 0,
        todaysOrders: 0,
        thisWeekOrders: 0
      }
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const result = {
      totalOrders: orders?.length || 0,
      pendingOrders: orders?.filter(o => o.status === 'pending').length || 0,
      confirmedOrders: orders?.filter(o => o.status === 'confirmed').length || 0,
      deliveredOrders: orders?.filter(o => o.status === 'delivered').length || 0,
      totalRevenue: orders?.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0) || 0,
      todaysOrders: orders?.filter(o => {
        const orderDate = new Date(o.order_date)
        return orderDate >= today
      }).length || 0,
      thisWeekOrders: orders?.filter(o => {
        const orderDate = new Date(o.order_date)
        return orderDate >= lastWeek
      }).length || 0
    }

    serviceLogger.debug('Order metrics calculated', result)
    return result
  }

  /**
   * Get inventory-related metrics
   */
  private static async getInventoryMetrics() {
    const serviceLogger = logger.child({
      service: 'SuperAdminDashboardService',
      operation: 'getInventoryMetrics'
    })

    serviceLogger.db('SELECT', 'inventory')
    const { data: inventory, error } = await supabase
      .from('inventory')
      .select('id, available_quantity, low_stock_threshold')

    if (error) {
      serviceLogger.error('Error fetching inventory metrics', error)
      return {
        totalInventoryItems: 0,
        lowStockItems: 0
      }
    }

    const result = {
      totalInventoryItems: inventory?.length || 0,
      lowStockItems: inventory?.filter(i =>
        (i.available_quantity || 0) <= (i.low_stock_threshold || 10)
      ).length || 0
    }

    serviceLogger.debug('Inventory metrics calculated', result)
    return result
  }

  /**
   * Get notification-related metrics
   */
  private static async getNotificationMetrics() {
    const serviceLogger = logger.child({
      service: 'SuperAdminDashboardService',
      operation: 'getNotificationMetrics'
    })

    serviceLogger.db('SELECT', 'notifications')
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('id, is_resolved, severity')

    if (error) {
      serviceLogger.error('Error fetching notification metrics', error)
      return {
        totalNotifications: 0,
        unresolvedNotifications: 0,
        criticalNotifications: 0,
        highPriorityNotifications: 0
      }
    }

    const result = {
      totalNotifications: notifications?.length || 0,
      unresolvedNotifications: notifications?.filter(n => !n.is_resolved).length || 0,
      criticalNotifications: notifications?.filter(n => n.severity === 'critical').length || 0,
      highPriorityNotifications: notifications?.filter(n => n.severity === 'high').length || 0
    }

    serviceLogger.debug('Notification metrics calculated', result)
    return result
  }

  /**
   * Get branch-related metrics
   */
  private static async getBranchMetrics() {
    const serviceLogger = logger.child({
      service: 'SuperAdminDashboardService',
      operation: 'getBranchMetrics'
    })

    serviceLogger.db('SELECT', 'branches')
    const { data: branches, error } = await supabase
      .from('branches')
      .select('id, is_active')

    if (error) {
      serviceLogger.error('Error fetching branch metrics', error)
      return {
        totalBranches: 0,
        activeBranches: 0
      }
    }

    const result = {
      totalBranches: branches?.length || 0,
      activeBranches: branches?.filter(b => b.is_active).length || 0
    }

    serviceLogger.debug('Branch metrics calculated', result)
    return result
  }

  /**
   * Get customer-related metrics
   */
  private static async getCustomerMetrics() {
    const serviceLogger = logger.child({
      service: 'SuperAdminDashboardService',
      operation: 'getCustomerMetrics'
    })

    serviceLogger.db('SELECT', 'customers')
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id')

    if (error) {
      serviceLogger.error('Error fetching customer metrics', error)
      return {
        totalCustomers: 0
      }
    }

    const result = {
      totalCustomers: customers?.length || 0
    }

    serviceLogger.debug('Customer metrics calculated', result)
    return result
  }

  /**
   * Get product batch-related metrics
   */
  private static async getBatchMetrics() {
    const serviceLogger = logger.child({
      service: 'SuperAdminDashboardService',
      operation: 'getBatchMetrics'
    })

    serviceLogger.db('SELECT', 'product_batches')
    const { data: batches, error } = await supabase
      .from('product_batches')
      .select('id, expiration_date, is_active')
      .eq('is_active', true)

    if (error) {
      serviceLogger.error('Error fetching batch metrics', error)
      return {
        expiringThisWeek: 0,
        expiredBatches: 0
      }
    }

    const now = new Date()
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const result = {
      expiringThisWeek: batches?.filter(b => {
        const expDate = new Date(b.expiration_date)
        return expDate <= nextWeek && expDate > now
      }).length || 0,
      expiredBatches: batches?.filter(b => {
        const expDate = new Date(b.expiration_date)
        return expDate <= now
      }).length || 0
    }

    serviceLogger.debug('Batch metrics calculated', result)
    return result
  }

  /**
   * Get audit activity metrics
   */
  private static async getAuditMetrics() {
    const serviceLogger = logger.child({
      service: 'SuperAdminDashboardService',
      operation: 'getAuditMetrics'
    })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    serviceLogger.db('SELECT', 'audit_logs')
    const { data: audits, error } = await supabase
      .from('audit_logs')
      .select('id, admin_id, created_at')
      .gte('created_at', today.toISOString())

    if (error) {
      serviceLogger.error('Error fetching audit metrics', error)
      return {
        totalActivitiesToday: 0,
        activeAdminsToday: 0
      }
    }

    const uniqueAdmins = new Set(audits?.map(a => a.admin_id).filter(Boolean))

    const result = {
      totalActivitiesToday: audits?.length || 0,
      activeAdminsToday: uniqueAdmins.size || 0
    }

    serviceLogger.debug('Audit metrics calculated', result)
    return result
  }

  /**
   * Get recent admin activity for dashboard feed
   */
  static async getRecentAdminActivity(limit: number = 10): Promise<AdminActivity[]> {
    const serviceLogger = logger.child({
      service: 'SuperAdminDashboardService',
      operation: 'getRecentAdminActivity'
    })
    serviceLogger.time('getRecentAdminActivity')

    try {
      serviceLogger.info('Fetching recent admin activity', { limit })
      serviceLogger.db('SELECT', 'audit_logs')
      const { data: activities, error } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          table_name,
          change_summary,
          created_at,
          admins (
            full_name,
            role
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        serviceLogger.error('Error fetching admin activity', error)
        return []
      }

      const result = (activities || []).map(activity => ({
        id: activity.id,
        action: activity.action || 'unknown',
        tableName: activity.table_name || 'unknown',
        adminName: (activity.admins as any)?.full_name || 'System',
        adminRole: (activity.admins as any)?.role || 'unknown',
        changeSummary: activity.change_summary || 'No details available',
        timestamp: activity.created_at,
        severity: this.getActivitySeverity(activity.action, activity.table_name)
      }))

      const duration = serviceLogger.timeEnd('getRecentAdminActivity')
      serviceLogger.success('Admin activity fetched', {
        duration,
        count: result.length
      })

      return result
    } catch (error) {
      serviceLogger.error('Error fetching recent admin activity', error as Error)
      return []
    }
  }

  /**
   * Determine activity severity based on action and table
   */
  private static getActivitySeverity(
    action: string | null,
    tableName: string | null
  ): 'low' | 'medium' | 'high' {
    if (!action) return 'low'

    // High severity actions
    if (action === 'delete' || tableName === 'admins') return 'high'

    // Medium severity actions
    if (action === 'update' || action === 'create') return 'medium'

    // Low severity by default
    return 'low'
  }

  /**
   * Get system health status
   */
  static async getSystemHealth(): Promise<SystemHealth> {
    const serviceLogger = logger.child({
      service: 'SuperAdminDashboardService',
      operation: 'getSystemHealth'
    })
    serviceLogger.time('getSystemHealth')

    try {
      serviceLogger.info('Checking system health')
      const metrics = await this.getSuperAdminMetrics()

      const health = {
        database: 'operational' as const,
        admins: metrics.activeAdmins === 0 ? ('error' as const) : ('operational' as const),
        inventory: metrics.lowStockItems > 10 ? ('warning' as const) : ('operational' as const),
        notifications: metrics.unresolvedNotifications > 20 ? ('warning' as const) : ('operational' as const)
      }

      const duration = serviceLogger.timeEnd('getSystemHealth')
      serviceLogger.success('System health checked', {
        duration,
        health
      })

      return health
    } catch (error) {
      serviceLogger.error('Error checking system health', error as Error)
      return {
        database: 'error',
        admins: 'error',
        inventory: 'error',
        notifications: 'error'
      }
    }
  }

  /**
   * Get critical alerts summary
   */
  static async getCriticalAlerts() {
    const serviceLogger = logger.child({
      service: 'SuperAdminDashboardService',
      operation: 'getCriticalAlerts'
    })
    serviceLogger.time('getCriticalAlerts')

    try {
      serviceLogger.info('Fetching critical alerts')
      serviceLogger.db('SELECT', 'notifications')
      const { data: alerts, error } = await supabase
        .from('notifications')
        .select('id, type, severity, title, message, created_at')
        .eq('is_resolved', false)
        .in('severity', ['critical', 'high'])
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) {
        serviceLogger.error('Error fetching critical alerts', error)
        return []
      }

      const duration = serviceLogger.timeEnd('getCriticalAlerts')
      serviceLogger.success('Critical alerts fetched', {
        duration,
        count: alerts?.length || 0
      })

      return alerts || []
    } catch (error) {
      serviceLogger.error('Error fetching critical alerts', error as Error)
      return []
    }
  }
}