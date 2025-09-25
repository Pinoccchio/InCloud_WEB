'use client'

import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  BellIcon,
  Cog6ToothIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase/auth'
import { getMainBranchId } from '@/lib/constants/branch'

interface AlertsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface AlertSettings {
  low_stock_threshold: number
  critical_stock_threshold: number
  expiry_warning_days: number
  critical_expiry_days: number
  email_notifications: boolean
  in_app_notifications: boolean
}

interface ProductAlert {
  id: string
  product_name: string
  sku: string
  current_stock: number
  threshold: number
  alert_type: 'low_stock' | 'critical_stock' | 'expiring' | 'expired'
  expiry_date?: string
  days_until_expiry?: number
  created_at: string
}

export default function AlertsModal({ isOpen, onClose }: AlertsModalProps) {
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    low_stock_threshold: 10,
    critical_stock_threshold: 3,
    expiry_warning_days: 7,
    critical_expiry_days: 3,
    email_notifications: true,
    in_app_notifications: true
  })

  const [currentAlerts, setCurrentAlerts] = useState<ProductAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'settings' | 'alerts'>('alerts')

  const { addToast } = useToast()

  // Load alert settings and current alerts
  useEffect(() => {
    if (isOpen) {
      loadAlertData()
    }
  }, [isOpen])

  const loadAlertData = async () => {
    try {
      setIsLoading(true)
      const branchId = await getMainBranchId()

      // Load alert settings
      const { data: settingsData } = await supabase
        .from('alert_settings')
        .select('*')
        .eq('branch_id', branchId)
        .single()

      if (settingsData) {
        setAlertSettings({
          low_stock_threshold: settingsData.low_stock_threshold || 10,
          critical_stock_threshold: settingsData.critical_stock_threshold || 3,
          expiry_warning_days: settingsData.expiry_warning_days || 7,
          critical_expiry_days: settingsData.critical_expiry_days || 3,
          email_notifications: settingsData.email_notifications ?? true,
          in_app_notifications: settingsData.in_app_notifications ?? true
        })
      }

      // Load current alerts
      await loadCurrentAlerts()
    } catch (error) {
      console.error('Error loading alert data:', error)
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load alert settings and data.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadCurrentAlerts = async () => {
    try {
      const branchId = await getMainBranchId()

      // Query inventory with product details and batch information for alerts
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
        .order('quantity', { ascending: true })

      if (!inventoryData) return

      const alerts: ProductAlert[] = []
      const currentDate = new Date()

      inventoryData.forEach((item) => {
        const product = item.products
        const threshold = item.low_stock_threshold || alertSettings.low_stock_threshold

        // Check for stock alerts
        if (item.available_quantity <= alertSettings.critical_stock_threshold) {
          alerts.push({
            id: `stock-${item.id}`,
            product_name: product.name,
            sku: product.sku,
            current_stock: item.available_quantity,
            threshold: alertSettings.critical_stock_threshold,
            alert_type: 'critical_stock',
            created_at: new Date().toISOString()
          })
        } else if (item.available_quantity <= threshold) {
          alerts.push({
            id: `stock-${item.id}`,
            product_name: product.name,
            sku: product.sku,
            current_stock: item.available_quantity,
            threshold,
            alert_type: 'low_stock',
            created_at: new Date().toISOString()
          })
        }

        // Check for expiry alerts
        item.product_batches?.forEach((batch) => {
          if (batch.expiry_date) {
            const expiryDate = new Date(batch.expiry_date)
            const daysUntilExpiry = Math.ceil((expiryDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

            if (daysUntilExpiry < 0) {
              alerts.push({
                id: `expiry-${item.id}-${batch.expiry_date}`,
                product_name: product.name,
                sku: product.sku,
                current_stock: item.available_quantity,
                threshold: 0,
                alert_type: 'expired',
                expiry_date: batch.expiry_date,
                days_until_expiry: daysUntilExpiry,
                created_at: new Date().toISOString()
              })
            } else if (daysUntilExpiry <= alertSettings.critical_expiry_days) {
              alerts.push({
                id: `expiry-${item.id}-${batch.expiry_date}`,
                product_name: product.name,
                sku: product.sku,
                current_stock: item.available_quantity,
                threshold: alertSettings.critical_expiry_days,
                alert_type: 'expiring',
                expiry_date: batch.expiry_date,
                days_until_expiry: daysUntilExpiry,
                created_at: new Date().toISOString()
              })
            } else if (daysUntilExpiry <= alertSettings.expiry_warning_days) {
              alerts.push({
                id: `expiry-${item.id}-${batch.expiry_date}`,
                product_name: product.name,
                sku: product.sku,
                current_stock: item.available_quantity,
                threshold: alertSettings.expiry_warning_days,
                alert_type: 'expiring',
                expiry_date: batch.expiry_date,
                days_until_expiry: daysUntilExpiry,
                created_at: new Date().toISOString()
              })
            }
          }
        })
      })

      // Sort alerts by priority (critical first, then by date)
      alerts.sort((a, b) => {
        const priorityOrder = { 'expired': 0, 'critical_stock': 1, 'expiring': 2, 'low_stock': 3 }
        const aPriority = priorityOrder[a.alert_type]
        const bPriority = priorityOrder[b.alert_type]

        if (aPriority !== bPriority) return aPriority - bPriority
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      setCurrentAlerts(alerts)
    } catch (error) {
      console.error('Error loading current alerts:', error)
    }
  }

  const saveAlertSettings = async () => {
    try {
      setIsSaving(true)
      const branchId = await getMainBranchId()

      const { error } = await supabase
        .from('alert_settings')
        .upsert({
          branch_id: branchId,
          low_stock_threshold: alertSettings.low_stock_threshold,
          critical_stock_threshold: alertSettings.critical_stock_threshold,
          expiry_warning_days: alertSettings.expiry_warning_days,
          critical_expiry_days: alertSettings.critical_expiry_days,
          email_notifications: alertSettings.email_notifications,
          in_app_notifications: alertSettings.in_app_notifications,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Alert settings have been updated successfully.'
      })

      // Reload alerts with new settings
      await loadCurrentAlerts()
    } catch (error) {
      console.error('Error saving alert settings:', error)
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save alert settings.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const getAlertIcon = (alertType: ProductAlert['alert_type']) => {
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

  const getAlertMessage = (alert: ProductAlert) => {
    switch (alert.alert_type) {
      case 'expired':
        return `Expired ${Math.abs(alert.days_until_expiry || 0)} days ago`
      case 'critical_stock':
        return `Critical stock: ${alert.current_stock} units remaining`
      case 'expiring':
        return `Expires in ${alert.days_until_expiry} days`
      case 'low_stock':
        return `Low stock: ${alert.current_stock} units remaining`
      default:
        return 'Alert'
    }
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <BellIcon className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Smart Alert System
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">
                        Configure thresholds and view current alerts
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg p-1"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('alerts')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'alerts'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Current Alerts ({currentAlerts.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'settings'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Cog6ToothIcon className="w-4 h-4 inline mr-2" />
                      Settings
                    </button>
                  </nav>
                </div>

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <>
                    {/* Current Alerts Tab */}
                    {activeTab === 'alerts' && (
                      <div className="space-y-4">
                        {currentAlerts.length === 0 ? (
                          <div className="text-center py-12">
                            <CheckCircleIcon className="w-12 h-12 mx-auto text-green-400 mb-4" />
                            <p className="text-lg font-medium text-gray-900 mb-2">All Good!</p>
                            <p className="text-gray-500">No alerts at this time. Your inventory is in good shape.</p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {currentAlerts.map((alert) => (
                              <div
                                key={alert.id}
                                className={`p-4 rounded-lg border-l-4 ${
                                  alert.alert_type === 'expired' || alert.alert_type === 'critical_stock'
                                    ? 'border-red-400 bg-red-50'
                                    : alert.alert_type === 'expiring'
                                    ? 'border-orange-400 bg-orange-50'
                                    : 'border-yellow-400 bg-yellow-50'
                                }`}
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
                                      <p className="text-sm text-gray-700">
                                        {getAlertMessage(alert)}
                                      </p>
                                      {alert.expiry_date && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          Expiry: {new Date(alert.expiry_date).toLocaleDateString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Stock Thresholds */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Stock Alert Thresholds</h4>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Low Stock Threshold (units)
                              </label>
                              <Input
                                type="number"
                                value={alertSettings.low_stock_threshold}
                                onChange={(e) => setAlertSettings({
                                  ...alertSettings,
                                  low_stock_threshold: parseInt(e.target.value) || 0
                                })}
                                className="w-full"
                                min="1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Alert when stock falls below this number
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Critical Stock Threshold (units)
                              </label>
                              <Input
                                type="number"
                                value={alertSettings.critical_stock_threshold}
                                onChange={(e) => setAlertSettings({
                                  ...alertSettings,
                                  critical_stock_threshold: parseInt(e.target.value) || 0
                                })}
                                className="w-full"
                                min="1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Urgent alert when stock falls below this number
                              </p>
                            </div>
                          </div>

                          {/* Expiry Thresholds */}
                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Expiry Alert Thresholds</h4>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expiry Warning (days)
                              </label>
                              <Input
                                type="number"
                                value={alertSettings.expiry_warning_days}
                                onChange={(e) => setAlertSettings({
                                  ...alertSettings,
                                  expiry_warning_days: parseInt(e.target.value) || 0
                                })}
                                className="w-full"
                                min="1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Alert when products expire within this many days
                              </p>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Critical Expiry (days)
                              </label>
                              <Input
                                type="number"
                                value={alertSettings.critical_expiry_days}
                                onChange={(e) => setAlertSettings({
                                  ...alertSettings,
                                  critical_expiry_days: parseInt(e.target.value) || 0
                                })}
                                className="w-full"
                                min="1"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Urgent alert when products expire within this many days
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Notification Preferences */}
                        <div className="border-t border-gray-200 pt-6">
                          <h4 className="font-medium text-gray-900 mb-4">Notification Preferences</h4>
                          <div className="space-y-3">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={alertSettings.in_app_notifications}
                                onChange={(e) => setAlertSettings({
                                  ...alertSettings,
                                  in_app_notifications: e.target.checked
                                })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                In-app notifications
                              </span>
                            </label>

                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={alertSettings.email_notifications}
                                onChange={(e) => setAlertSettings({
                                  ...alertSettings,
                                  email_notifications: e.target.checked
                                })}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">
                                Email notifications
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={isSaving}
                  >
                    Close
                  </Button>
                  {activeTab === 'settings' && (
                    <Button
                      onClick={saveAlertSettings}
                      disabled={isSaving}
                      className="flex items-center"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Settings'
                      )}
                    </Button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}