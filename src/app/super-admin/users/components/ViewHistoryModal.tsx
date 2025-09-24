'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  XMarkIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { Button, LoadingSpinner } from '@/components/ui'
import { useToastActions } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/auth'
import {
  formatActivityForTimeline,
  groupActivitiesByTime,
  getFriendlyTime,
  getDetailedAuditDescription,
  formatChangeContext
} from '@/lib/user-friendly-utils'

interface AuditLog {
  id: string
  admin_id: string
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  change_summary: string | null
  field_changes: Record<string, unknown> | null
  change_context: string | null
  created_at: string
}

interface AdminUser {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  last_login: string | null
}

interface ViewHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  admin: AdminUser | null
}

// Cache for audit logs to prevent repeated API calls
const auditCache = new Map<string, { data: AuditLog[], timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const ViewHistoryModal = React.memo<ViewHistoryModalProps>(({ isOpen, onClose, admin }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState('30')
  const { success, error } = useToastActions()
  const { admin: currentAdmin } = useAuth()

  // Memoized cache key
  const cacheKey = useMemo(() => {
    if (!admin?.id) return null
    return `${admin.id}-${dateFilter}`
  }, [admin?.id, dateFilter])

  // Check if data exists in cache
  const getCachedData = useCallback((key: string): AuditLog[] | null => {
    const cached = auditCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }, [])

  // Store data in cache
  const setCachedData = useCallback((key: string, data: AuditLog[]) => {
    auditCache.set(key, { data, timestamp: Date.now() })
  }, [])

  const loadAuditHistory = useCallback(async () => {
    if (!admin?.id || !cacheKey) return

    try {
      // Check cache first
      const cachedData = getCachedData(cacheKey)
      if (cachedData) {
        setAuditLogs(cachedData)
        return
      }

      setIsLoading(true)

      // Check permissions
      if (!currentAdmin || currentAdmin.role !== 'super_admin') {
        throw new Error('Unauthorized: Super admin access required')
      }

      // Calculate date range
      const dateTo = new Date().toISOString().split('T')[0]
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - parseInt(dateFilter))
      const dateFromStr = dateFrom.toISOString().split('T')[0]

      // Load audit logs using direct Supabase client with new detailed fields
      const { data, error: fetchError } = await supabase
        .from('audit_logs')
        .select(`
          id,
          admin_id,
          action,
          table_name,
          record_id,
          old_data,
          new_data,
          metadata,
          change_summary,
          field_changes,
          change_context,
          created_at
        `)
        .eq('admin_id', admin.id)
        .gte('created_at', dateFromStr + 'T00:00:00Z')
        .lte('created_at', dateTo + 'T23:59:59Z')
        .order('created_at', { ascending: false })
        .limit(100)

      if (fetchError) {
        throw fetchError
      }

      const logs = data || []
      setAuditLogs(logs)
      setCachedData(cacheKey, logs)

    } catch (err) {
      console.error('Error loading audit history:', err)
      error(
        'Load Failed',
        err instanceof Error ? err.message : 'Failed to load audit history'
      )
    } finally {
      setIsLoading(false)
    }
  }, [admin?.id, cacheKey, dateFilter, currentAdmin, error, getCachedData, setCachedData])

  const handleExportHistory = useCallback(async () => {
    if (!admin || !currentAdmin) return

    try {
      // Check permissions
      if (currentAdmin.role !== 'super_admin') {
        throw new Error('Unauthorized: Super admin access required')
      }

      const dateTo = new Date().toISOString().split('T')[0]
      const dateFrom = new Date()
      dateFrom.setDate(dateFrom.getDate() - parseInt(dateFilter))
      const dateFromStr = dateFrom.toISOString().split('T')[0]

      // Get audit logs data for export
      const { data, error: fetchError } = await supabase
        .from('audit_logs')
        .select(`
          id,
          admin_id,
          action,
          table_name,
          record_id,
          old_data,
          new_data,
          metadata,
          change_summary,
          field_changes,
          change_context,
          created_at,
          admins!inner (
            full_name,
            email,
            role
          )
        `)
        .eq('admin_id', admin.id)
        .gte('created_at', dateFromStr + 'T00:00:00Z')
        .lte('created_at', dateTo + 'T23:59:59Z')
        .order('created_at', { ascending: false })
        .limit(5000)

      if (fetchError) {
        throw fetchError
      }

      if (!data || data.length === 0) {
        error('No Data', 'No audit logs found for the selected period')
        return
      }

      // Convert to CSV
      const headers = [
        'Date/Time',
        'Action',
        'Description',
        'Table',
        'Record ID',
        'Context'
      ]

      const csvRows = [
        headers.join(','),
        ...data.map(log => [
          `"${new Date(log.created_at).toISOString()}"`,
          `"${log.action}"`,
          `"${log.change_summary || ''}"`,
          `"${log.table_name || ''}"`,
          `"${log.record_id || ''}"`,
          `"${log.change_context || ''}"`
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${admin.full_name.replace(/\s+/g, '-')}-audit-history-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      success(
        'Export Successful',
        `Audit history for ${admin.full_name} has been exported successfully`
      )

    } catch (err) {
      console.error('Error exporting audit history:', err)
      error(
        'Export Failed',
        err instanceof Error ? err.message : 'Failed to export audit history'
      )
    }
  }, [admin, currentAdmin, dateFilter, success, error])


  // Memoized computed values
  const { actionCounts, isEmptyState, timelineActivities, hasData } = useMemo(() => {
    const counts = {
      total: auditLogs.length,
      teamActions: auditLogs.filter(log => log.table_name === 'admins').length,
      productActions: auditLogs.filter(log => log.table_name === 'products').length,
      orderActions: auditLogs.filter(log => log.table_name === 'orders').length,
      loginSessions: auditLogs.filter(log => log.action === 'login').length,
      passwordChanges: auditLogs.filter(log => log.action === 'password_change').length,
    }

    // Convert audit logs to timeline activities for grouping
    const activities = auditLogs.map(log => ({
      ...log,
      created_at: log.created_at
    }))

    return {
      actionCounts: counts,
      isEmptyState: !isLoading && auditLogs.length === 0,
      timelineActivities: groupActivitiesByTime(activities),
      hasData: auditLogs.length > 0
    }
  }, [auditLogs, isLoading])



  // Load data when modal opens or dependencies change
  useEffect(() => {
    if (isOpen && admin?.id) {
      loadAuditHistory()
    }
  }, [isOpen, admin?.id, loadAuditHistory])


  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose()
    }
  }, [isLoading, onClose])

  if (!admin) return null

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all mx-4">
            {/* Header */}
            <div className="bg-white px-4 sm:px-6 pt-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <ClockIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-semibold text-gray-900">
                      Activity History - {admin.full_name}
                    </DialogTitle>
                    <p className="text-sm text-gray-900">
                      {admin.email} • {admin.role === 'super_admin' ? 'Super Administrator' : 'Branch Manager'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-3 py-1"
                    disabled={isLoading}
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportHistory}
                    disabled={auditLogs.length === 0 || isLoading}
                    className="flex items-center"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                    Export
                  </Button>
                  <button
                    onClick={handleClose}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Summary Stats - Only show when there's data */}
              {hasData && (
                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <div className="text-xl font-semibold text-gray-900">
                      {actionCounts.total}
                    </div>
                    <div className="text-sm text-gray-900 font-medium">Total Activities</div>
                  </div>

                  {/* Show additional stats only if they have meaningful data */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {actionCounts.teamActions > 0 && (
                      <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-semibold text-blue-900">
                          {actionCounts.teamActions}
                        </div>
                        <div className="text-xs text-blue-900 font-medium">Team Management</div>
                      </div>
                    )}
                    {actionCounts.passwordChanges > 0 && (
                      <div className="bg-purple-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-semibold text-purple-900">
                          {actionCounts.passwordChanges}
                        </div>
                        <div className="text-xs text-purple-900 font-medium">Security Actions</div>
                      </div>
                    )}
                    {(actionCounts.productActions > 0 || actionCounts.orderActions > 0) && (
                      <div className="bg-green-50 p-3 rounded-lg text-center">
                        <div className="text-lg font-semibold text-green-900">
                          {actionCounts.productActions + actionCounts.orderActions}
                        </div>
                        <div className="text-xs text-green-900 font-medium">Business Operations</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 pb-6 max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                  <span className="ml-3 text-gray-900 text-base font-medium">Loading activity history...</span>
                </div>
              ) : isEmptyState ? (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-900 font-medium text-base">No activities found for the selected period</p>
                  <p className="text-gray-700 text-sm mt-2">Try selecting a longer time period to see more activities.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {timelineActivities.map((group, groupIndex) => (
                    <div key={groupIndex} className="">
                      <h4 className="text-base font-semibold text-gray-900 mb-3 sticky top-0 bg-white py-2 border-b border-gray-200">
                        {group.label}
                      </h4>
                      <div className="space-y-3 pl-4">
                        {group.items.map((log) => {
                          // Use enhanced audit description utility
                          const description = getDetailedAuditDescription(
                            log.change_summary,
                            log.action,
                            log.table_name,
                            log.field_changes
                          )

                          // Get icon based on action type
                          const activity = formatActivityForTimeline(
                            log.action,
                            log.table_name,
                            log.created_at,
                            admin?.full_name
                          )
                          const IconComponent = activity.icon

                          // Format change context for better display
                          const formattedContext = formatChangeContext(log.change_context)

                          return (
                            <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <IconComponent className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {description}
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                  <p className="text-sm text-gray-700">
                                    {getFriendlyTime(log.created_at)}
                                  </p>
                                  {formattedContext && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      {formattedContext}
                                    </span>
                                  )}
                                  {activity.location && !formattedContext && (
                                    <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                                      {activity.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-3 flex justify-end">
              <Button onClick={handleClose} disabled={isLoading}>
                Close
              </Button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
})

ViewHistoryModal.displayName = 'ViewHistoryModal'