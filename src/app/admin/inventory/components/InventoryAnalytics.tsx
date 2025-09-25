'use client'

import { useState, useEffect, Fragment, useCallback } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui'
import { supabase } from '@/lib/supabase/auth'
import { getMainBranchId } from '@/lib/constants/branch'

interface InventoryAnalyticsProps {
  isOpen: boolean
  onClose: () => void
}

interface AnalyticsData {
  totalInventoryValue: number
  totalRestockingCosts: number
  totalRevenue: number
  profitMargin: number
  topPerformingProducts: ProductPerformance[]
  lowStockAlerts: number
  expiringProducts: number
  recentRestocks: RestockSummary[]
  costVsRevenueComparison: CostRevenueComparison[]
}

interface ProductPerformance {
  product_name: string
  sku: string
  total_revenue: number
  total_cost: number
  profit: number
  profit_margin: number
  units_sold: number
  current_stock: number
}

interface RestockSummary {
  restock_date: string
  total_cost: number
  total_items: number
  supplier_count: number
}

interface CostRevenueComparison {
  period: string
  total_costs: number
  total_revenue: number
  profit: number
  profit_margin: number
}

interface OrderItem {
  product_id: string
  total_price: string
  quantity: number
  products: {
    name: string
    sku: string
  }
}

export default function InventoryAnalytics({
  isOpen,
  onClose
}: InventoryAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('30') // Last 30 days by default

  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const mainBranchId = await getMainBranchId()
      const daysAgo = parseInt(dateRange)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysAgo)

      // Get inventory value
      const { data: inventoryData, error: inventoryError } = await supabase
        .from('inventory')
        .select(`
          quantity,
          cost_per_unit,
          products(name, sku)
        `)
        .eq('branch_id', mainBranchId)

      if (inventoryError) throw inventoryError

      // Calculate total inventory value
      const totalInventoryValue = inventoryData?.reduce((sum, item) => {
        return sum + (item.quantity * Number(item.cost_per_unit))
      }, 0) || 0

      // Get restocking costs for the period
      const { data: restockData, error: restockError } = await supabase
        .from('restock_history')
        .select(`
          quantity,
          cost_per_unit,
          total_cost,
          received_date,
          supplier_info,
          inventory!inner(
            product_id,
            products!inner(name, sku)
          )
        `)
        .gte('received_date', startDate.toISOString())
        .order('received_date', { ascending: false })

      if (restockError) throw restockError

      const totalRestockingCosts = restockData?.reduce((sum, item) => {
        return sum + Number(item.total_cost)
      }, 0) || 0

      // Get revenue data from orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          total_amount,
          order_date,
          order_items!inner(
            quantity,
            unit_price,
            total_price,
            product_id,
            products!inner(name, sku)
          )
        `)
        .eq('branch_id', mainBranchId)
        .gte('order_date', startDate.toISOString())
        .in('status', ['delivered'])

      if (orderError) throw orderError

      const totalRevenue = orderData?.reduce((sum, order) => {
        return sum + Number(order.total_amount)
      }, 0) || 0

      // Calculate product performance
      const productPerformance = new Map<string, ProductPerformance>()

      orderData?.forEach(order => {
        order.order_items.forEach((item: OrderItem) => {
          const productKey = item.product_id
          const existing = productPerformance.get(productKey)
          const revenue = Number(item.total_price)

          if (existing) {
            existing.total_revenue += revenue
            existing.units_sold += item.quantity
          } else {
            productPerformance.set(productKey, {
              product_name: item.products.name,
              sku: item.products.sku,
              total_revenue: revenue,
              total_cost: 0, // Will be calculated below
              profit: 0,
              profit_margin: 0,
              units_sold: item.quantity,
              current_stock: 0
            })
          }
        })
      })

      // Add cost information and current stock
      inventoryData?.forEach(invItem => {
        const productKey = invItem.products ? 'product_id_placeholder' : '' // This would need proper product_id
        const performance = Array.from(productPerformance.values()).find(p =>
          p.product_name === invItem.products?.name
        )

        if (performance) {
          performance.current_stock = invItem.quantity
          // Estimate cost based on units sold
          performance.total_cost = performance.units_sold * Number(invItem.cost_per_unit)
          performance.profit = performance.total_revenue - performance.total_cost
          performance.profit_margin = performance.total_revenue > 0
            ? (performance.profit / performance.total_revenue) * 100
            : 0
        }
      })

      const topPerformingProducts = Array.from(productPerformance.values())
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5)

      // Get low stock and expiring alerts
      const { data: lowStockData } = await supabase
        .from('inventory')
        .select('id')
        .eq('branch_id', mainBranchId)
        .filter('available_quantity', 'lte', 'low_stock_threshold')

      const lowStockAlerts = lowStockData?.length || 0

      const { data: expiringData } = await supabase
        .from('product_batches')
        .select('id')
        .gte('expiration_date', new Date().toISOString())
        .lte('expiration_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .eq('is_active', true)

      const expiringProducts = expiringData?.length || 0

      // Process recent restocks
      const restocksByDate = new Map<string, { total_cost: number, total_items: number, suppliers: Set<string> }>()

      restockData?.forEach(restock => {
        const date = new Date(restock.received_date).toISOString().split('T')[0]
        const existing = restocksByDate.get(date)
        const supplierName = restock.supplier_info?.name || 'Unknown'

        if (existing) {
          existing.total_cost += Number(restock.total_cost)
          existing.total_items += restock.quantity
          existing.suppliers.add(supplierName)
        } else {
          restocksByDate.set(date, {
            total_cost: Number(restock.total_cost),
            total_items: restock.quantity,
            suppliers: new Set([supplierName])
          })
        }
      })

      const recentRestocks = Array.from(restocksByDate.entries())
        .map(([date, data]) => ({
          restock_date: date,
          total_cost: data.total_cost,
          total_items: data.total_items,
          supplier_count: data.suppliers.size
        }))
        .sort((a, b) => new Date(b.restock_date).getTime() - new Date(a.restock_date).getTime())
        .slice(0, 5)

      // Cost vs Revenue comparison by week
      const weeklyComparison: CostRevenueComparison[] = []
      const weeksToAnalyze = Math.min(Math.ceil(daysAgo / 7), 8)

      for (let i = 0; i < weeksToAnalyze; i++) {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
        const weekEnd = new Date()
        weekEnd.setDate(weekEnd.getDate() - i * 7)

        const weekCosts = restockData?.filter(r => {
          const date = new Date(r.received_date)
          return date >= weekStart && date < weekEnd
        }).reduce((sum, r) => sum + Number(r.total_cost), 0) || 0

        const weekRevenue = orderData?.filter(o => {
          const date = new Date(o.order_date)
          return date >= weekStart && date < weekEnd
        }).reduce((sum, o) => sum + Number(o.total_amount), 0) || 0

        const profit = weekRevenue - weekCosts
        const profitMargin = weekRevenue > 0 ? (profit / weekRevenue) * 100 : 0

        weeklyComparison.unshift({
          period: `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
          total_costs: weekCosts,
          total_revenue: weekRevenue,
          profit: profit,
          profit_margin: profitMargin
        })
      }

      const overallProfitMargin = totalRevenue > 0
        ? ((totalRevenue - totalRestockingCosts) / totalRevenue) * 100
        : 0

      setAnalyticsData({
        totalInventoryValue,
        totalRestockingCosts,
        totalRevenue,
        profitMargin: overallProfitMargin,
        topPerformingProducts,
        lowStockAlerts,
        expiringProducts,
        recentRestocks,
        costVsRevenueComparison: weeklyComparison
      })

    } catch (err) {
      console.error('Error loading analytics data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics data')
    } finally {
      setLoading(false)
    }
  }, [dateRange])

  useEffect(() => {
    if (isOpen) {
      loadAnalyticsData()
    }
  }, [isOpen, loadAnalyticsData])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price)
  }

  const formatPercentage = (percentage: number) => {
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(1)}%`
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-6xl transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-2xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-white">
                  <div>
                    <Dialog.Title as="h3" className="text-xl font-semibold text-gray-900">
                      Inventory Analytics
                    </Dialog.Title>
                    <p className="mt-1 text-sm text-gray-500">
                      Revenue analysis and inventory performance insights
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4 text-gray-400" />
                      <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="text-sm border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                      </select>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-[80vh] overflow-y-auto">
                  {loading ? (
                    <div className="flex justify-center py-12">
                      <LoadingSpinner size="lg" />
                    </div>
                  ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <div className="flex">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error Loading Analytics</h3>
                          <p className="mt-1 text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    </div>
                  ) : analyticsData ? (
                    <div className="space-y-6">
                      {/* Key Metrics */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                          <div className="flex items-center">
                            <ChartBarIcon className="w-8 h-8 text-blue-600" />
                            <div className="ml-4">
                              <p className="text-sm font-medium text-blue-900">Inventory Value</p>
                              <p className="text-2xl font-bold text-blue-900">
                                {formatPrice(analyticsData.totalInventoryValue)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-6">
                          <div className="flex items-center">
                            <ArrowTrendingDownIcon className="w-8 h-8 text-red-600" />
                            <div className="ml-4">
                              <p className="text-sm font-medium text-red-900">Restocking Costs</p>
                              <p className="text-2xl font-bold text-red-900">
                                {formatPrice(analyticsData.totalRestockingCosts)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                          <div className="flex items-center">
                            <ArrowTrendingUpIcon className="w-8 h-8 text-green-600" />
                            <div className="ml-4">
                              <p className="text-sm font-medium text-green-900">Total Revenue</p>
                              <p className="text-2xl font-bold text-green-900">
                                {formatPrice(analyticsData.totalRevenue)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className={`bg-gradient-to-br border rounded-lg p-6 ${
                          analyticsData.profitMargin >= 0
                            ? 'from-purple-50 to-purple-100 border-purple-200'
                            : 'from-orange-50 to-orange-100 border-orange-200'
                        }`}>
                          <div className="flex items-center">
                            <CurrencyDollarIcon className={`w-8 h-8 ${
                              analyticsData.profitMargin >= 0 ? 'text-purple-600' : 'text-orange-600'
                            }`} />
                            <div className="ml-4">
                              <p className={`text-sm font-medium ${
                                analyticsData.profitMargin >= 0 ? 'text-purple-900' : 'text-orange-900'
                              }`}>
                                Profit Margin
                              </p>
                              <p className={`text-2xl font-bold ${
                                analyticsData.profitMargin >= 0 ? 'text-purple-900' : 'text-orange-900'
                              }`}>
                                {formatPercentage(analyticsData.profitMargin)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Alerts Summary */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-yellow-900">Low Stock Alerts</p>
                              <p className="text-lg font-bold text-yellow-900">{analyticsData.lowStockAlerts} products</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-center">
                            <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
                            <div className="ml-3">
                              <p className="text-sm font-medium text-orange-900">Expiring Soon</p>
                              <p className="text-lg font-bold text-orange-900">{analyticsData.expiringProducts} batches</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Cost vs Revenue Comparison */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Cost vs Revenue Analysis</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Costs</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Revenue</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Margin</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {analyticsData.costVsRevenueComparison.map((period, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-900">{period.period}</td>
                                  <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                                    {formatPrice(period.total_costs)}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                                    {formatPrice(period.total_revenue)}
                                  </td>
                                  <td className={`px-4 py-3 text-sm text-right font-medium ${
                                    period.profit >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {formatPrice(period.profit)}
                                  </td>
                                  <td className={`px-4 py-3 text-sm text-right font-medium ${
                                    period.profit_margin >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {formatPercentage(period.profit_margin)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Top Performing Products */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h4>
                        <div className="space-y-3">
                          {analyticsData.topPerformingProducts.map((product, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                              <div>
                                <h5 className="font-medium text-gray-900">{product.product_name}</h5>
                                <p className="text-sm text-gray-500">SKU: {product.sku} • {product.units_sold} units sold</p>
                                <p className="text-sm text-gray-500">Current Stock: {product.current_stock} units</p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-green-600">{formatPrice(product.profit)}</p>
                                <p className="text-sm text-gray-500">{formatPercentage(product.profit_margin)} margin</p>
                                <p className="text-xs text-gray-400">Revenue: {formatPrice(product.total_revenue)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Restocks */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Restocking Activity</h4>
                        <div className="space-y-3">
                          {analyticsData.recentRestocks.map((restock, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {new Date(restock.restock_date).toLocaleDateString()}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  {restock.total_items} items from {restock.supplier_count} supplier{restock.supplier_count !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-blue-600">{formatPrice(restock.total_cost)}</p>
                                <p className="text-sm text-gray-500">Total Cost</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}