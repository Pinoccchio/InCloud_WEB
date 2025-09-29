'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { Button, Input } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase/auth'
import { getMainBranchId } from '@/lib/constants/branch'

interface NotificationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface NotificationSettings {
  // Essential Business Settings Only
  low_stock_threshold: number
  critical_stock_threshold: number
  expiry_warning_days: number
  critical_expiry_days: number
}

export default function NotificationSettingsModal({ isOpen, onClose }: NotificationSettingsModalProps) {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    // Essential Business Settings Only
    low_stock_threshold: 10,
    critical_stock_threshold: 3,
    expiry_warning_days: 7,
    critical_expiry_days: 3
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const { addToast } = useToast()

  const loadNotificationSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      const branchId = await getMainBranchId()
      const adminId = (await supabase.auth.getUser()).data.user?.id

      // Load notification settings for current admin and branch
      const { data: settingsData } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('branch_id', branchId)
        .eq('admin_id', adminId)
        .single()

      if (settingsData) {
        setNotificationSettings({
          // Essential Business Settings Only
          low_stock_threshold: settingsData.low_stock_threshold || 10,
          critical_stock_threshold: settingsData.critical_stock_threshold || 3,
          expiry_warning_days: settingsData.expiry_warning_days || 7,
          critical_expiry_days: settingsData.critical_expiry_days || 3
        })
      }
    } catch (error) {
      console.error('Error loading notification settings:', error)
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load notification settings.'
      })
    } finally {
      setIsLoading(false)
    }
  }, [addToast])

  // Load notification settings
  useEffect(() => {
    if (isOpen) {
      loadNotificationSettings()
    }
  }, [isOpen, loadNotificationSettings])

  const saveNotificationSettings = async () => {
    try {
      setIsSaving(true)
      const branchId = await getMainBranchId()
      const adminId = (await supabase.auth.getUser()).data.user?.id

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          branch_id: branchId,
          admin_id: adminId,
          // Essential settings
          low_stock_threshold: notificationSettings.low_stock_threshold,
          critical_stock_threshold: notificationSettings.critical_stock_threshold,
          expiry_warning_days: notificationSettings.expiry_warning_days,
          critical_expiry_days: notificationSettings.critical_expiry_days,
          // Auto-set sensible defaults for other fields
          stock_alerts_enabled: true,
          expiry_alerts_enabled: true,
          order_created_notifications: true,
          order_status_change_notifications: true,
          order_payment_notifications: true,
          order_delivery_notifications: true,
          system_maintenance_notifications: true,
          security_notifications: true,
          backup_notifications: false,
          email_notifications: false,
          push_notifications: true,
          sms_notifications: false,
          notification_frequency: 'immediate',
          group_similar_notifications: true,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Notification settings have been updated successfully.'
      })
    } catch (error) {
      console.error('Error saving notification settings:', error)
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: 'Failed to save notification settings.'
      })
    } finally {
      setIsSaving(false)
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
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Cog6ToothIcon className="w-5 h-5 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                        Alert & Notifications Settings
                      </Dialog.Title>
                      <p className="text-sm text-gray-500">
                        Configure alert thresholds for stock and expiration warnings
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


                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
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
                            value={notificationSettings.low_stock_threshold}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
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
                            value={notificationSettings.critical_stock_threshold}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
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
                            value={notificationSettings.expiry_warning_days}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
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
                            value={notificationSettings.critical_expiry_days}
                            onChange={(e) => setNotificationSettings({
                              ...notificationSettings,
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

                  </div>
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
                  <Button
                    onClick={saveNotificationSettings}
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
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}