import { supabase } from '@/lib/supabase/auth'
import { getMainBranchId } from '@/lib/constants/branch'

export interface DashboardMetrics {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  activeOrders: number
  pendingOrders: number
  deliveredOrders: number
  totalCustomers: number
  totalAlerts: number
  criticalAlerts: number
  lowStockItems: number
  totalRevenue: number
  todaysRevenue: number
  monthlyRevenue: number
  // Change indicators
  productChange: number
  orderChange: number
  revenueChange: number
  alertChange: number
}

export interface RecentActivity {
  id: string
  type: 'order' | 'product' | 'alert' | 'inventory'
  title: string
  description: string
  timestamp: string
  severity?: 'low' | 'medium' | 'high' | 'critical'
}

export class DashboardService {
  /**
   * Get comprehensive dashboard metrics
   */
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const branchId = await getMainBranchId()

      // Get current metrics
      const currentMetrics = await this.getCurrentMetrics(branchId)

      // Get comparison metrics (previous period)
      const previousMetrics = await this.getPreviousMetrics(branchId)

      // Calculate changes
      const changes = this.calculateChanges(currentMetrics, previousMetrics)

      return {
        ...currentMetrics,
        ...changes
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error)
      throw error
    }
  }

  /**
   * Get current period metrics
   */
  private static async getCurrentMetrics(branchId: string) {
    const today = new Date()
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    // Products metrics
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('id, status')

    if (productError) throw productError

    // Orders metrics
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, status, total_amount, order_date, branch_id')
      .eq('branch_id', branchId)

    if (orderError) throw orderError

    // Customer metrics
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id')

    if (customerError) throw customerError

    // Alerts metrics (using notifications table)
    const { data: alertData, error: alertError } = await supabase
      .from('notifications')
      .select('id, severity, type, branch_id')
      .eq('branch_id', branchId)
      .in('type', ['alert', 'inventory'])

    if (alertError) throw alertError

    // Inventory metrics for low stock
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory')
      .select('id, available_quantity, low_stock_threshold, branch_id')
      .eq('branch_id', branchId)

    if (inventoryError) throw inventoryError

    // Calculate metrics
    const totalProducts = productData?.length || 0
    const activeProducts = productData?.filter(p => p.status === 'active').length || 0

    const totalOrders = orderData?.length || 0
    const activeOrders = orderData?.filter(o =>
      ['pending', 'confirmed', 'in_transit'].includes(o.status)
    ).length || 0
    const pendingOrders = orderData?.filter(o => o.status === 'pending').length || 0
    const deliveredOrders = orderData?.filter(o => o.status === 'delivered').length || 0

    const totalCustomers = customerData?.length || 0

    const totalAlerts = alertData?.length || 0
    const criticalAlerts = alertData?.filter(a => a.severity === 'critical').length || 0

    const lowStockItems = inventoryData?.filter(i =>
      i.available_quantity <= (i.low_stock_threshold || 10)
    ).length || 0

    // Revenue calculations
    const totalRevenue = orderData?.filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

    const todaysRevenue = orderData?.filter(o => {
      const orderDate = new Date(o.order_date)
      return orderDate.toDateString() === today.toDateString() && o.status === 'delivered'
    }).reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

    const monthlyRevenue = orderData?.filter(o => {
      const orderDate = new Date(o.order_date)
      return orderDate >= startOfMonth && o.status === 'delivered'
    }).reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

    return {
      totalProducts,
      activeProducts,
      totalOrders,
      activeOrders,
      pendingOrders,
      deliveredOrders,
      totalCustomers,
      totalAlerts,
      criticalAlerts,
      lowStockItems,
      totalRevenue,
      todaysRevenue,
      monthlyRevenue,
      productChange: 0, // Will be calculated
      orderChange: 0,   // Will be calculated
      revenueChange: 0, // Will be calculated
      alertChange: 0    // Will be calculated
    }
  }

  /**
   * Get previous period metrics for comparison
   */
  private static async getPreviousMetrics(branchId: string) {
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    // Get previous month's orders for comparison
    const { data: prevOrderData, error: prevOrderError } = await supabase
      .from('orders')
      .select('id, status, total_amount, order_date, branch_id')
      .eq('branch_id', branchId)
      .gte('order_date', lastMonth.toISOString())
      .lte('order_date', lastMonthEnd.toISOString())

    if (prevOrderError) {
      console.warn('Error fetching previous metrics:', prevOrderError)
      return {
        prevTotalOrders: 0,
        prevRevenue: 0,
        prevAlerts: 0
      }
    }

    const prevTotalOrders = prevOrderData?.length || 0
    const prevRevenue = prevOrderData?.filter(o => o.status === 'delivered')
      .reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

    return {
      prevTotalOrders,
      prevRevenue,
      prevAlerts: 0 // Could be calculated if needed
    }
  }

  /**
   * Calculate percentage changes
   */
  private static calculateChanges(current: any, previous: any) {
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    return {
      productChange: 0, // Products don't change much month to month
      orderChange: calculateChange(current.totalOrders, previous.prevTotalOrders),
      revenueChange: calculateChange(current.monthlyRevenue, previous.prevRevenue),
      alertChange: 0 // Alerts are more current-focused
    }
  }

  /**
   * Get recent activity for dashboard
   */
  static async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const branchId = await getMainBranchId()
      const activities: RecentActivity[] = []

      // Recent orders
      const { data: recentOrders } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          created_at,
          customers (
            full_name
          )
        `)
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentOrders) {
        activities.push(...recentOrders.map(order => ({
          id: `order-${order.id}`,
          type: 'order' as const,
          title: `New Order ${order.order_number}`,
          description: `${order.customers?.full_name || 'Customer'} - ₱${order.total_amount?.toFixed(2)}`,
          timestamp: order.created_at,
        })))
      }

      // Recent alerts (using notifications table)
      const { data: recentAlerts } = await supabase
        .from('notifications')
        .select('id, type, severity, title, message, created_at')
        .eq('branch_id', branchId)
        .in('type', ['alert', 'inventory'])
        .order('created_at', { ascending: false })
        .limit(5)

      if (recentAlerts) {
        activities.push(...recentAlerts.map(alert => ({
          id: `alert-${alert.id}`,
          type: 'alert' as const,
          title: alert.title,
          description: alert.message,
          timestamp: alert.created_at,
          severity: alert.severity
        })))
      }

      // Sort by timestamp and return limited results
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)

    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }
  }

  /**
   * Get system health status
   */
  static async getSystemHealth() {
    try {
      // Test database connection
      const { data, error } = await supabase
        .from('branches')
        .select('id')
        .limit(1)

      const dbHealthy = !error

      return {
        database: dbHealthy ? 'operational' : 'error',
        realtime: 'operational', // Would need actual realtime check
        analytics: 'operational'  // Would need actual analytics check
      }
    } catch (error) {
      return {
        database: 'error',
        realtime: 'unknown',
        analytics: 'unknown'
      }
    }
  }

  /**
   * Force refresh dashboard data (clears any caching if implemented)
   */
  static async refreshDashboard(): Promise<void> {
    // Implementation for cache clearing if needed
    console.log('Dashboard data refreshed')
  }
}