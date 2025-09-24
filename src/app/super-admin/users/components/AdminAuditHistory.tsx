'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { Button, LoadingSpinner } from '@/components/ui'
import { useToastActions } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/auth'

interface AuditLog {
  id: string
  admin_id: string
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
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

interface AdminAuditHistoryProps {
  admin: AdminUser
  isOpen: boolean
  onClose: () => void
}

export default function AdminAuditHistory({ admin, isOpen, onClose }: AdminAuditHistoryProps) {
  // DEPRECATED: This component is being replaced with separate ViewHistoryModal and ViewDetailsModal
  // This implementation has dialog flickering issues due to multiple state updates
  // TODO: Remove this component after migration is complete
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [dateFilter, setDateFilter] = useState('30') // Last 30 days
  const { success, error } = useToastActions()
  const { admin: currentAdmin } = useAuth()

  const loadAuditHistory = useCallback(async () => {
    if (!admin?.id) return

    try {
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

      // Load audit logs using direct Supabase client
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

      setAuditLogs(data || [])

    } catch (err) {
      console.error('Error loading audit history:', err)
      error(
        'Load Failed',
        err instanceof Error ? err.message : 'Failed to load audit history'
      )
    } finally {
      setIsLoading(false)
    }
  }, [admin?.id, dateFilter, currentAdmin, error])

  const handleExportHistory = async () => {
    try {
      // Check permissions
      if (!currentAdmin || currentAdmin.role !== 'super_admin') {
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
        'Table',
        'Record ID',
        'Reason',
        'IP Address',
        'User Agent'
      ]

      const csvRows = [
        headers.join(','),
        ...data.map(log => [
          `"${new Date(log.created_at).toISOString()}"`,,
          `"${log.action}"`,
          `"${log.table_name || ''}"`,,
          `"${log.record_id || ''}"`,,
          `"${log.metadata?.reason || ''}"`
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
  }

  const toggleLogExpansion = (logId: string) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'update':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'delete':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'login':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'logout':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  useEffect(() => {
    if (isOpen && admin?.id) {
      loadAuditHistory()
    }
  }, [isOpen, admin?.id, dateFilter, loadAuditHistory])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
          {/* Header */}
          <div className="bg-white px-6 pt-5 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                  admin.role === 'super_admin'
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : 'bg-blue-500'
                }`}>
                  <span className="text-sm font-medium text-white">
                    {admin.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Audit History - {admin.full_name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {admin.email} • {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="text-sm border border-gray-300 rounded-md px-3 py-1"
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
                  disabled={auditLogs.length === 0}
                  className="flex items-center"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {auditLogs.length}
                </div>
                <div className="text-xs text-gray-500">Total Actions</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-green-900">
                  {auditLogs.filter(log => log.action === 'create').length}
                </div>
                <div className="text-xs text-green-600">Created</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-blue-900">
                  {auditLogs.filter(log => log.action === 'update').length}
                </div>
                <div className="text-xs text-blue-600">Updated</div>
              </div>
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-lg font-semibold text-red-900">
                  {auditLogs.filter(log => log.action === 'delete').length}
                </div>
                <div className="text-xs text-red-600">Deleted</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Loading audit history...</span>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-8">
                <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No audit logs found for the selected period</p>
              </div>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg">
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleLogExpansion(log.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            {expandedLogs.has(log.id) ? (
                              <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                            )}
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getActionBadgeColor(log.action)}`}>
                              {log.action.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {log.table_name}
                              {log.record_id && (
                                <span className="text-gray-500 font-mono ml-2">
                                  {log.record_id.substring(0, 8)}...
                                </span>
                              )}
                            </p>
                            {log.metadata?.reason && (
                              <p className="text-xs text-gray-500 mt-1">
                                Reason: {log.metadata.reason}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900">
                            {formatDateTime(log.created_at)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {log.metadata?.action_context || 'System action'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {expandedLogs.has(log.id) && (
                      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700 mb-1">Technical Details</p>
                            <div className="space-y-1 text-xs">
                              <p><span className="font-medium">Record ID:</span> {log.record_id || 'N/A'}</p>
                              {log.metadata?.action_context && (
                                <p><span className="font-medium">Context:</span> {log.metadata.action_context}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Data changes preview */}
                        {(log.old_data || log.new_data) && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="font-medium text-gray-700 mb-2 text-sm">Data Changes</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {log.old_data && (
                                <div>
                                  <p className="text-xs font-medium text-red-700 mb-1">Before</p>
                                  <div className="bg-red-50 border border-red-200 p-2 rounded">
                                    <pre className="text-xs text-red-800 overflow-auto max-h-20">
                                      {JSON.stringify(log.old_data, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                              {log.new_data && (
                                <div>
                                  <p className="text-xs font-medium text-green-700 mb-1">After</p>
                                  <div className="bg-green-50 border border-green-200 p-2 rounded">
                                    <pre className="text-xs text-green-800 overflow-auto max-h-20">
                                      {JSON.stringify(log.new_data, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}