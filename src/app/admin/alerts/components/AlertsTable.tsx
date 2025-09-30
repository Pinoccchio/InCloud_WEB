'use client'

import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BellIcon,
  CheckCircleIcon,
  EyeIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { Button, LoadingSpinner } from '@/components/ui'
import { supabase } from '@/lib/supabase/auth'
import { getMainBranchId } from '@/lib/constants/branch'
import { useToast } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'

interface Alert {
  id: string
  type: 'order' | 'alert' | 'system' | 'inventory'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  product_name?: string | null
  metadata: Record<string, unknown>
  is_read: boolean
  is_acknowledged: boolean
  is_resolved: boolean
  acknowledged_at: string | null
  resolved_at: string | null
  created_at: string
  related_entity_type?: string
  related_entity_id?: string
}

interface AlertsTableProps {
  searchQuery?: string
  typeFilter?: string
  severityFilter?: string
  statusFilter?: string
  dateFilter?: string
  onRefresh?: () => void
}

export default function AlertsTable({
  searchQuery = '',
  typeFilter = '',
  severityFilter = '',
  statusFilter = '',
  dateFilter = '',
  onRefresh
}: AlertsTableProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set())
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Alert
    direction: 'asc' | 'desc'
  }>({ key: 'created_at', direction: 'desc' })

  // Dropdown state management
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{
    x: number
    y: number
    position: 'top' | 'bottom'
    align: 'left' | 'right'
  } | null>(null)
  const [isOpeningModal, setIsOpeningModal] = useState(false)

  // Refs for dropdown positioning
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const dropdownContentRef = useRef<HTMLDivElement | null>(null)

  const { addToast } = useToast()
  const { admin } = useAuth()

  // Fetch alerts with filters applied
  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const branchId = await getMainBranchId()

      let query = supabase
        .from('notifications')
        .select(`
          id,
          type,
          severity,
          title,
          message,
          metadata,
          admin_is_read,
          is_acknowledged,
          is_resolved,
          acknowledged_at,
          resolved_at,
          created_at,
          related_entity_type,
          related_entity_id
        `)
        .eq('branch_id', branchId)

      // Apply filters
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,message.ilike.%${searchQuery}%`)
      }

      if (typeFilter) {
        query = query.eq('type', typeFilter)
      }

      if (severityFilter) {
        query = query.eq('severity', severityFilter)
      }

      if (statusFilter) {
        if (statusFilter === 'read') {
          query = query.eq('admin_is_read', true)
        } else if (statusFilter === 'unread') {
          query = query.eq('admin_is_read', false)
        } else if (statusFilter === 'acknowledged') {
          query = query.eq('is_acknowledged', true).eq('is_resolved', false)
        } else if (statusFilter === 'unacknowledged') {
          query = query.eq('is_acknowledged', false)
        } else if (statusFilter === 'resolved') {
          query = query.eq('is_resolved', true)
        }
      }

      // Apply date filter
      if (dateFilter) {
        const now = new Date()
        let startDate: Date

        switch (dateFilter) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          default:
            startDate = new Date(0)
        }

        query = query.gte('created_at', startDate.toISOString())
      }

      // Sort
      query = query.order(sortConfig.key as string, { ascending: sortConfig.direction === 'asc' })

      const { data: notificationsData, error: notificationsError } = await query

      if (notificationsError) throw notificationsError

      // Process notifications data
      const processedAlerts: Alert[] = (notificationsData || []).map((notification) => ({
        id: notification.id,
        type: notification.type,
        severity: notification.severity,
        title: notification.title,
        message: notification.message,
        product_name: notification.metadata?.product_name || null,
        metadata: notification.metadata || {},
        is_read: notification.admin_is_read,
        is_acknowledged: notification.is_acknowledged,
        is_resolved: notification.is_resolved,
        acknowledged_at: notification.acknowledged_at,
        resolved_at: notification.resolved_at,
        created_at: notification.created_at,
        related_entity_type: notification.related_entity_type,
        related_entity_id: notification.related_entity_id
      }))

      setAlerts(processedAlerts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts')
    } finally {
      setLoading(false)
    }
  }, [searchQuery, typeFilter, severityFilter, statusFilter, dateFilter, sortConfig])

  // Enhanced dropdown positioning
  const calculateDropdownPosition = (alertId: string) => {
    const buttonRef = dropdownRefs.current[alertId]
    if (!buttonRef) return

    const buttonRect = buttonRef.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    const dropdownWidth = 224
    const dropdownMinHeight = 120
    const dropdownMaxHeight = 256

    const spaceAbove = buttonRect.top
    const spaceBelow = viewportHeight - buttonRect.bottom

    let position: 'top' | 'bottom' = 'bottom'
    let y = buttonRect.bottom + 8

    if (spaceBelow < dropdownMinHeight && spaceAbove > spaceBelow) {
      position = 'top'
      y = buttonRect.top - 8
    }

    let align: 'left' | 'right' = 'right'
    let x = buttonRect.right - dropdownWidth

    if (x < 8) {
      align = 'left'
      x = buttonRect.left
    }

    if (x + dropdownWidth > viewportWidth - 8) {
      x = viewportWidth - dropdownWidth - 8
    }

    x = Math.max(8, Math.min(x, viewportWidth - dropdownWidth - 8))

    if (position === 'top') {
      y = Math.max(8, y - dropdownMaxHeight)
    } else {
      y = Math.min(y, viewportHeight - dropdownMinHeight - 8)
    }

    setDropdownPosition({
      x,
      y,
      position,
      align
    })
  }

  useLayoutEffect(() => {
    if (openDropdown) {
      setTimeout(() => calculateDropdownPosition(openDropdown), 0)
    }
  }, [openDropdown])

  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdown) {
        setOpenDropdown(null)
        setDropdownPosition(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openDropdown])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  const handleSort = (key: keyof Alert) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSelectAll = () => {
    if (selectedAlerts.size === alerts.length) {
      setSelectedAlerts(new Set())
    } else {
      setSelectedAlerts(new Set(alerts.map(a => a.id)))
    }
  }

  const handleSelectAlert = (alertId: string) => {
    const newSelection = new Set(selectedAlerts)
    if (newSelection.has(alertId)) {
      newSelection.delete(alertId)
    } else {
      newSelection.add(alertId)
    }
    setSelectedAlerts(newSelection)
  }

  const markAsRead = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ admin_is_read: true, updated_at: new Date().toISOString() })
        .eq('id', alertId)

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Alert Updated',
        message: 'Alert marked as read successfully.'
      })

      fetchAlerts()
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to mark alert as read.'
      })
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_acknowledged: true,
          admin_is_read: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: admin?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Alert Acknowledged',
        message: 'Alert acknowledged successfully.'
      })

      fetchAlerts()
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to acknowledge alert.'
      })
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('notifications')
        .update({
          is_resolved: true,
          resolved_at: now,
          resolved_by: admin?.id,
          updated_at: now
        })
        .eq('id', alertId)

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Alert Resolved',
        message: 'Alert resolved successfully.'
      })

      fetchAlerts()
      onRefresh?.()
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to resolve alert.'
      })
    }
  }

  // Bulk operations
  const handleBulkMarkAsRead = async () => {
    if (selectedAlerts.size === 0) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ admin_is_read: true, updated_at: new Date().toISOString() })
        .in('id', Array.from(selectedAlerts))

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Alerts Updated',
        message: `${selectedAlerts.size} alert(s) marked as read successfully.`
      })

      setSelectedAlerts(new Set())
      fetchAlerts()
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Bulk Update Failed',
        message: 'Failed to mark selected alerts as read.'
      })
    }
  }

  const handleBulkAcknowledge = async () => {
    if (selectedAlerts.size === 0) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_acknowledged: true,
          admin_is_read: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: admin?.id,
          updated_at: new Date().toISOString()
        })
        .in('id', Array.from(selectedAlerts))

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Alerts Acknowledged',
        message: `${selectedAlerts.size} alert(s) acknowledged successfully.`
      })

      setSelectedAlerts(new Set())
      fetchAlerts()
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Bulk Update Failed',
        message: 'Failed to acknowledge selected alerts.'
      })
    }
  }

  const handleBulkResolve = async () => {
    if (selectedAlerts.size === 0) return

    try {
      const now = new Date().toISOString()
      const { error } = await supabase
        .from('notifications')
        .update({
          is_resolved: true,
          resolved_at: now,
          resolved_by: admin?.id,
          updated_at: now
        })
        .in('id', Array.from(selectedAlerts))

      if (error) throw error

      addToast({
        type: 'success',
        title: 'Alerts Resolved',
        message: `${selectedAlerts.size} alert(s) resolved successfully.`
      })

      setSelectedAlerts(new Set())
      fetchAlerts()
      onRefresh?.()
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Bulk Update Failed',
        message: 'Failed to resolve selected alerts.'
      })
    }
  }

  const getAlertIcon = (severity: Alert['severity'], type: Alert['type']) => {
    switch (type) {
      case 'inventory':
        return <ExclamationTriangleIcon className={`w-5 h-5 ${
          severity === 'critical' ? 'text-red-600' :
          severity === 'high' ? 'text-orange-600' : 'text-yellow-600'
        }`} />
      case 'alert':
        return <ExclamationTriangleIcon className={`w-5 h-5 ${
          severity === 'critical' ? 'text-red-600' : 'text-orange-600'
        }`} />
      case 'order':
        return <InformationCircleIcon className={`w-5 h-5 ${
          severity === 'high' ? 'text-orange-600' : 'text-blue-600'
        }`} />
      case 'system':
        return <InformationCircleIcon className={`w-5 h-5 ${
          severity === 'critical' ? 'text-red-600' :
          severity === 'high' ? 'text-orange-600' : 'text-blue-600'
        }`} />
      default:
        return <BellIcon className="w-5 h-5 text-gray-600" />
    }
  }

  const getSeverityBadge = (severity: Alert['severity']) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"

    switch (severity) {
      case 'critical':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'high':
        return `${baseClasses} bg-orange-100 text-orange-800`
      case 'medium':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'low':
        return `${baseClasses} bg-blue-100 text-blue-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const getTypeBadge = (type: Alert['type']) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"

    switch (type) {
      case 'inventory':
        return `${baseClasses} bg-orange-100 text-orange-800`
      case 'alert':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'order':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'system':
        return `${baseClasses} bg-purple-100 text-purple-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const closeDropdownAndExecute = async (action: () => void) => {
    if (isOpeningModal) return

    setIsOpeningModal(true)
    setOpenDropdown(null)
    setDropdownPosition(null)

    await new Promise(resolve => setTimeout(resolve, 100))
    action()
    setIsOpeningModal(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading alerts</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchAlerts}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      {/* Table Header Actions */}
      {selectedAlerts.size > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedAlerts.size} alert(s) selected
            </span>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkAsRead}
              >
                Mark as Read
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkAcknowledge}
              >
                Acknowledge
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkResolve}
                className="text-green-600 hover:text-green-700 border-green-300 hover:border-green-400"
              >
                Resolve
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedAlerts.size === alerts.length && alerts.length > 0}
                  onChange={handleSelectAll}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Alert
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('type')}>
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('severity')}>
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}>
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {alerts.map((alert) => (
              <tr
                key={alert.id}
                className={`hover:bg-gray-50 transition-colors ${
                  !alert.is_read ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedAlerts.has(alert.id)}
                    onChange={() => handleSelectAlert(alert.id)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </td>

                {/* Alert Info */}
                <td className="px-6 py-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-3 mt-1">
                      {getAlertIcon(alert.severity, alert.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {alert.title}
                      </div>
                      <div className="text-sm text-gray-600 break-words">
                        {alert.message}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Type */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getTypeBadge(alert.type)}>
                    {alert.type.replace('_', ' ').toUpperCase()}
                  </span>
                </td>

                {/* Severity */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={getSeverityBadge(alert.severity)}>
                    {alert.severity.toUpperCase()}
                  </span>
                </td>

                {/* Product */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {alert.product_name || '-'}
                </td>

                {/* Status */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col space-y-1">
                    {alert.is_resolved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        Resolved
                      </span>
                    ) : alert.is_acknowledged ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        Acknowledged
                      </span>
                    ) : alert.is_read ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <EyeIcon className="w-3 h-3 mr-1" />
                        Read
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        New
                      </span>
                    )}
                  </div>
                </td>

                {/* Created */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(alert.created_at)}
                </td>

                {/* Actions */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <div className="relative">
                      <button
                        ref={(el) => { dropdownRefs.current[alert.id] = el }}
                        onClick={(e) => {
                          e.stopPropagation()
                          const newState = openDropdown === alert.id ? null : alert.id
                          setOpenDropdown(newState)
                          if (!newState) {
                            setDropdownPosition(null)
                          }
                        }}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                      >
                        <span className="text-lg font-bold">⋮</span>
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {alerts.length === 0 && (
          <div className="text-center py-12">
            <CheckCircleIcon className="w-12 h-12 mx-auto text-green-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts found</h3>
            <p className="text-gray-600">
              {searchQuery || typeFilter || severityFilter || statusFilter
                ? 'Try adjusting your filters to see more alerts.'
                : 'Great! No active alerts at this time.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Portal-based Dropdown */}
      {openDropdown && dropdownPosition && typeof window !== 'undefined' && createPortal(
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpenDropdown(null)
              setDropdownPosition(null)
            }}
          />

          <div
            ref={dropdownContentRef}
            className="fixed w-56 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-64 overflow-y-auto transition-all duration-200 ease-out"
            style={{
              left: `${dropdownPosition.x}px`,
              [dropdownPosition.position === 'top' ? 'bottom' : 'top']:
                dropdownPosition.position === 'top'
                  ? `${window.innerHeight - dropdownPosition.y}px`
                  : `${dropdownPosition.y}px`,
              filter: 'drop-shadow(0 20px 25px rgb(0 0 0 / 0.15))',
            }}
          >
            <div className="py-1">
              {(() => {
                const alert = alerts.find(a => a.id === openDropdown)
                if (!alert) return null

                return (
                  <>
                    {!alert.is_read && (
                      <button
                        onClick={() => closeDropdownAndExecute(() => markAsRead(alert.id))}
                        disabled={isOpeningModal}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center transition-colors ${
                          isOpeningModal
                            ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <EyeIcon className="w-4 h-4 mr-2 text-gray-500" />
                        Mark as Read
                      </button>
                    )}

                    {!alert.is_acknowledged && !alert.is_resolved && (
                      <button
                        onClick={() => closeDropdownAndExecute(() => acknowledgeAlert(alert.id))}
                        disabled={isOpeningModal}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center transition-colors ${
                          isOpeningModal
                            ? 'text-gray-400 cursor-not-allowed bg-gray-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <CheckIcon className="w-4 h-4 mr-2 text-gray-500" />
                        Acknowledge
                      </button>
                    )}

                    {(!alert.is_read || !alert.is_acknowledged || !alert.is_resolved) && (
                      <div className="border-t border-gray-100 my-1"></div>
                    )}

                    {!alert.is_resolved && (
                      <button
                        onClick={() => closeDropdownAndExecute(() => resolveAlert(alert.id))}
                        disabled={isOpeningModal}
                        className={`w-full text-left px-4 py-2 text-sm flex items-center transition-colors ${
                          isOpeningModal
                            ? 'text-green-400 cursor-not-allowed bg-green-25'
                            : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                        }`}
                      >
                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                        Resolve Alert
                      </button>
                    )}

                    {alert.is_resolved && (
                      <div className="px-4 py-2 text-sm text-gray-500 italic">
                        Alert already resolved
                        {alert.resolved_at && (
                          <div className="text-xs text-gray-400 mt-1">
                            {formatDate(alert.resolved_at)}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}