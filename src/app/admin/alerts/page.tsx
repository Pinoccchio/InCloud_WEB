'use client'

import { useState, useEffect } from 'react'
import {
  BellIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase/auth'
import { getMainBranchId } from '@/lib/constants/branch'
import AlertsModal from './components/AlertsModal'

interface AlertSummary {
  total_alerts: number
  critical_alerts: number
  low_stock_alerts: number
  expiry_alerts: number
  expired_alerts: number
}

interface RecentAlert {
  id: string
  product_name: string
  sku: string
  alert_type: 'low_stock' | 'critical_stock' | 'expiring' | 'expired'
  message: string
  created_at: string
}

export default function AlertsPage() {
  const [alertSummary, setAlertSummary] = useState<AlertSummary>({
    total_alerts: 0,
    critical_alerts: 0,
    low_stock_alerts: 0,
    expiry_alerts: 0,
    expired_alerts: 0
  })
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { addToast } = useToast()

  useEffect(() => {
    loadAlertData()
  }, [])

  const loadAlertData = async () => {
    try {
      setIsLoading(true)
      const branchId = await getMainBranchId()

      // Load alert summary
      const { data: inventoryData } = await supabase
        .from('inventory')
        .select(`
          id,
          quantity,
          available_quantity,
          low_stock_threshold,
          products!inner (
            id,
            name,
            sku
          ),
          product_batches (
            expiry_date
          )
        `)
        .eq('branch_id', branchId)

      if (inventoryData) {
        const currentDate = new Date()
        const alerts: RecentAlert[] = []
        let totalAlerts = 0
        let criticalAlerts = 0
        let lowStockAlerts = 0
        let expiryAlerts = 0
        let expiredAlerts = 0

        inventoryData.forEach((item) => {
          const product = item.products
          const threshold = item.low_stock_threshold || 10

          // Check for stock alerts
          if (item.available_quantity <= 3) {
            criticalAlerts++
            totalAlerts++
            alerts.push({
              id: `stock-${item.id}`,
              product_name: product.name,
              sku: product.sku,
              alert_type: 'critical_stock',
              message: `Critical stock: ${item.available_quantity} units remaining`,
              created_at: new Date().toISOString()
            })
          } else if (item.available_quantity <= threshold) {
            lowStockAlerts++
            totalAlerts++
            alerts.push({
              id: `stock-${item.id}`,
              product_name: product.name,
              sku: product.sku,
              alert_type: 'low_stock',
              message: `Low stock: ${item.available_quantity} units remaining`,
              created_at: new Date().toISOString()
            })
          }

          // Check for expiry alerts
          item.product_batches?.forEach((batch) => {
            if (batch.expiry_date) {
              const expiryDate = new Date(batch.expiry_date)
              const daysUntilExpiry = Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

              if (daysUntilExpiry < 0) {
                expiredAlerts++
                totalAlerts++
                alerts.push({
                  id: `expiry-${item.id}-${batch.expiry_date}`,
                  product_name: product.name,
                  sku: product.sku,
                  alert_type: 'expired',
                  message: `Expired ${Math.abs(daysUntilExpiry)} days ago`,
                  created_at: new Date().toISOString()
                })
              } else if (daysUntilExpiry <= 7) {
                expiryAlerts++
                totalAlerts++
                alerts.push({
                  id: `expiry-${item.id}-${batch.expiry_date}`,
                  product_name: product.name,
                  sku: product.sku,
                  alert_type: 'expiring',
                  message: `Expires in ${daysUntilExpiry} days`,
                  created_at: new Date().toISOString()
                })
              }
            }
          })
        })

        setAlertSummary({
          total_alerts: totalAlerts,
          critical_alerts: criticalAlerts,
          low_stock_alerts: lowStockAlerts,
          expiry_alerts: expiryAlerts,
          expired_alerts: expiredAlerts
        })

        // Sort alerts by priority and take top 10
        alerts.sort((a, b) => {
          const priorityOrder = { 'expired': 0, 'critical_stock': 1, 'expiring': 2, 'low_stock': 3 }
          return priorityOrder[a.alert_type] - priorityOrder[b.alert_type]
        })
        setRecentAlerts(alerts.slice(0, 10))
      }
    } catch (error) {
      console.error('Error loading alert data:', error)
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load alert data.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getAlertIcon = (alertType: RecentAlert['alert_type']) => {
    switch (alertType) {
      case 'expired':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
      case 'critical_stock':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
      case 'expiring':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
      case 'low_stock':
        return <InformationCircleIcon className="w-5 h-5 text-yellow-600" />
      default:
        return <BellIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const getAlertBadgeColor = (alertType: RecentAlert['alert_type']) => {
    switch (alertType) {
      case 'expired':
      case 'critical_stock':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'expiring':
        return 'bg-orange-50 border-orange-200 text-orange-800'
      case 'low_stock':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
          <p className="text-gray-600 mt-1">
            Monitor system alerts for low stock, expiring products, and configure alert settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => loadAlertData()}
            variant="outline"
            disabled={isLoading}
            className="flex items-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            ) : (
              <BellIcon className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center"
          >
            <Cog6ToothIcon className="w-4 h-4 mr-2" />
            Alert Settings
          </Button>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <BellIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Alerts</p>
              <p className="text-lg font-semibold text-gray-900">{alertSummary.total_alerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Critical</p>
              <p className="text-lg font-semibold text-gray-900">{alertSummary.critical_alerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <InformationCircleIcon className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Low Stock</p>
              <p className="text-lg font-semibold text-gray-900">{alertSummary.low_stock_alerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Expiring</p>
              <p className="text-lg font-semibold text-gray-900">{alertSummary.expiry_alerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-gray-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Expired</p>
              <p className="text-lg font-semibold text-gray-900">{alertSummary.expired_alerts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Alerts</h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : recentAlerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircleIcon className="w-12 h-12 mx-auto text-green-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">All Clear!</p>
              <p className="text-gray-500">No active alerts at this time. Your inventory is in good shape.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getAlertBadgeColor(alert.alert_type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getAlertIcon(alert.alert_type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900">
                            {alert.product_name}
                          </h4>
                          <span className="text-xs text-gray-500">
                            SKU: {alert.sku}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{alert.message}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Alert Settings Modal */}
      <AlertsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}