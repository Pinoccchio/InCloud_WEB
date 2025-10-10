'use client'

import { useState, useEffect } from 'react'
import {
  ChartBarIcon,
  CubeIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SparklesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import MetricsCard from '@/components/analytics/MetricsCard'
import InventoryDistributionChart from '@/components/analytics/InventoryDistributionChart'
import CategoryBarChart from '@/components/analytics/CategoryBarChart'
import AIInsightsPanel from '@/components/analytics/AIInsightsPanel'

interface AIInsight {
  category: string
  insight: string
  priority: string
  actionable: boolean
}

interface AIInsights {
  summary: string
  keyRecommendations: string[]
  insights: AIInsight[]
  generatedAt: string
}

interface InventoryMetrics {
  totalProducts: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
  averageStockLevel: number
}

interface CategoryPerformance {
  category: string
  productCount: number
  totalValue: number
  averageStock: number
  lowStockItems: number
}

interface ExpirationMetrics {
  expiringSoon: number
  expired: number
  healthy: number
  total: number
}

interface SalesMetrics {
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
}

interface PricingTierAnalysis {
  tierType: string
  productsCount: number
  avgPrice: number
}

interface ProductStockStatus {
  status: string
  count: number
  percentage: number
}

interface OrderByStatus {
  status: string
  count: number
}

interface SalesMetricsExtended extends SalesMetrics {
  ordersByStatus: OrderByStatus[]
}

interface CriticalBatch {
  productName: string
  batchNumber: string
  quantity: number
  daysUntilExpiry: number
}

interface ExpirationMetricsExtended extends ExpirationMetrics {
  criticalBatches: CriticalBatch[]
}

interface AnalyticsData {
  inventoryMetrics: InventoryMetrics
  categoryPerformance: CategoryPerformance[]
  expirationMetrics: ExpirationMetricsExtended
  salesMetrics: SalesMetricsExtended
  pricingTierAnalysis: PricingTierAnalysis[]
  productStockStatus: ProductStockStatus[]
  aiInsights?: AIInsights
  timestamp: string
  cached?: boolean
  cacheAge?: number
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'descriptive' | 'prescriptive'>('descriptive')
  const { addToast } = useToast()

  const loadAnalytics = async (forceRefresh = false) => {
    console.log('\n🔷 [Analytics Page] Loading analytics...', { forceRefresh })
    try {
      setIsRefreshing(forceRefresh)
      const url = `/api/analytics?refresh=${forceRefresh}&includeAI=true`
      console.log('📡 [Analytics Page] Fetching:', url)

      const startTime = Date.now()
      const response = await fetch(url)
      const duration = Date.now() - startTime
      console.log(`⏱️ [Analytics Page] API response in ${duration}ms, status: ${response.status}`)

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }

      const data = await response.json()
      console.log('📊 [Analytics Page] Data received:', {
        cached: data.cached,
        hasAI: !!data.aiInsights,
        totalProducts: data.inventoryMetrics?.totalProducts,
        aiInsightCount: data.aiInsights?.insights?.length || 0,
      })
      setAnalyticsData(data)

      if (forceRefresh) {
        addToast({
          type: 'success',
          title: 'Analytics Refreshed',
          message: 'Analytics data has been updated successfully.',
        })
      }

      console.log('✅ [Analytics Page] State updated successfully')
    } catch (error) {
      console.error('❌ [Analytics Page] Error loading analytics:', error)
      console.error('📋 [Analytics Page] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      addToast({
        type: 'error',
        title: 'Analytics Error',
        message: 'Failed to load analytics data. Please try again.',
      })
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
      console.log('🔷 [Analytics Page] Load analytics complete')
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center">
            <ArrowPathIcon className="w-12 h-12 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-600">Loading analytics data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Analytics Data Available
            </h3>
            <p className="text-gray-500 mb-4">
              Unable to load analytics data. Please try refreshing.
            </p>
            <Button onClick={() => loadAnalytics(true)}>
              <ArrowPathIcon className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const {
    inventoryMetrics,
    categoryPerformance,
    expirationMetrics,
    salesMetrics,
    pricingTierAnalysis,
    aiInsights,
  } = analyticsData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Analytics & Reports
            </h1>
            <p className="text-gray-600 mt-1">
              Descriptive and prescriptive analytics for data-driven decision making
            </p>
            {analyticsData.cached && (
              <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                Cached data (updated {analyticsData.cacheAge}s ago)
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => loadAnalytics(true)}
              variant="outline"
              disabled={isRefreshing}
            >
              <ArrowPathIcon
                className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('descriptive')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'descriptive'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChartBarIcon className="w-5 h-5 inline-block mr-2" />
              Descriptive Analytics
            </button>
            <button
              onClick={() => setActiveTab('prescriptive')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'prescriptive'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <SparklesIcon className="w-5 h-5 inline-block mr-2" />
              Prescriptive Analytics (AI)
            </button>
          </nav>
        </div>
      </div>

      {/* Descriptive Analytics Tab */}
      {activeTab === 'descriptive' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricsCard
              title="Total Products"
              value={inventoryMetrics.totalProducts}
              subtitle="Active in inventory"
              icon={<CubeIcon className="w-5 h-5" />}
              color="primary"
            />
            <MetricsCard
              title="Inventory Value"
              value={`₱${inventoryMetrics.totalInventoryValueRetail.toLocaleString()}`}
              subtitle="At retail pricing"
              icon={<CurrencyDollarIcon className="w-5 h-5" />}
              color="success"
            />
            <MetricsCard
              title="Low Stock Items"
              value={inventoryMetrics.lowStockItems}
              subtitle="Require restocking"
              icon={<ExclamationTriangleIcon className="w-5 h-5" />}
              color="warning"
            />
            <MetricsCard
              title="Expiring Soon"
              value={expirationMetrics.expiringSoon7Days}
              subtitle="Within 7 days"
              icon={<ClockIcon className="w-5 h-5" />}
              color="danger"
            />
          </div>

          {/* Inventory Distribution and Category Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Inventory Status Distribution
              </h2>
              <InventoryDistributionChart
                lowStock={inventoryMetrics.lowStockItems}
                outOfStock={inventoryMetrics.outOfStockItems}
                adequate={inventoryMetrics.adequateStockItems}
              />
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Category Performance
              </h2>
              <CategoryBarChart data={categoryPerformance} />
            </div>
          </div>

          {/* Sales Metrics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Sales Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {salesMetrics.totalOrders}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₱{salesMetrics.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Order Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ₱{salesMetrics.averageOrderValue.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Order Status Breakdown */}
            {salesMetrics.ordersByStatus.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Orders by Status
                </p>
                <div className="flex flex-wrap gap-3">
                  {salesMetrics.ordersByStatus.map((status: OrderByStatus) => (
                    <div
                      key={status.status}
                      className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <span className="text-xs text-gray-600 capitalize">
                        {status.status}
                      </span>
                      <p className="text-lg font-semibold text-gray-900">
                        {status.count}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Monthly Sales Breakdown */}
          {salesMetrics.monthlySales && salesMetrics.monthlySales.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Monthly Sales Breakdown
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Month
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Orders
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Revenue
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Order Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {salesMetrics.monthlySales.map((monthData, index) => (
                      <tr key={`${monthData.year}-${monthData.month}`} className={index === 0 ? 'bg-primary-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {monthData.month} {monthData.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          {monthData.totalOrders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ₱{monthData.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ₱{monthData.averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expiration Alerts */}
          {expirationMetrics.criticalBatches.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Critical Expiration Alerts
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Batch Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Days Until Expiry
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expirationMetrics.criticalBatches.map((batch: CriticalBatch, index: number) => (
                      <tr key={index} className={batch.daysUntilExpiry <= 3 ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {batch.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {batch.batchNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {batch.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              batch.daysUntilExpiry <= 3
                                ? 'bg-red-100 text-red-800'
                                : batch.daysUntilExpiry <= 7
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {batch.daysUntilExpiry} days
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pricing Type Analysis */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pricing Type Analysis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingTierAnalysis.map((tier: PricingTierAnalysis) => (
                <div
                  key={tier.tierType}
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <p className="text-sm font-medium text-gray-600 capitalize mb-2">
                    {tier.tierType}
                  </p>
                  <p className="text-xl font-bold text-gray-900">
                    ₱{tier.avgPrice.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Avg price • {tier.productsCount} products
                  </p>
                  <p className="text-xs text-gray-500">
                    ₱{tier.minPrice.toFixed(2)} - ₱{tier.maxPrice.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Prescriptive Analytics Tab */}
      {activeTab === 'prescriptive' && (
        <div className="space-y-6">
          {aiInsights ? (
            <AIInsightsPanel
              summary={aiInsights.summary}
              keyRecommendations={aiInsights.keyRecommendations}
              insights={aiInsights.insights}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
              <div className="text-center">
                <SparklesIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  AI Insights Not Available
                </h3>
                <p className="text-gray-500">
                  AI insights are generated automatically when analytics data is loaded. Click the Refresh button above to reload analytics with new AI insights.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}