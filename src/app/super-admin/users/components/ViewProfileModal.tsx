'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  ClockIcon,
  ChartBarIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import { supabase } from '@/lib/supabase/auth'
import { LoadingSpinner } from '@/components/ui'
import { formatActivityForTimeline, getFriendlyRole, getRelativeTime } from '@/lib/user-friendly-utils'
import {
  generateActionSummary,
  getRelevantChanges,
  formatMetadata
} from '@/lib/audit-formatters'

interface AdminUser {
  id: string
  user_id: string
  full_name: string
  email?: string
  role: 'admin' | 'super_admin'
  branches: string[]
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

interface AuditLog {
  id: string
  table_name: string
  action: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  change_summary: string | null
  field_changes: Record<string, unknown> | null
  change_context: string | null
  user_id: string | null
  admin_id: string | null
  performed_by: string | null
  created_at: string
}

interface ViewProfileModalProps {
  isOpen: boolean
  onClose: () => void
  admin: AdminUser | null
}

export function ViewProfileModal({ isOpen, onClose, admin }: ViewProfileModalProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoadingAudit, setIsLoadingAudit] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'audit'>('overview')
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const [activityTimeframe, setActivityTimeframe] = useState<'7d' | '30d' | '90d' | 'all'>('30d')
  const [adminNames, setAdminNames] = useState<Record<string, string>>({})

  // Load admin names for audit log display
  const loadAdminNames = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('admins')
        .select('id, full_name')

      if (error) throw error

      const nameMap: Record<string, string> = {}
      data?.forEach(adminData => {
        nameMap[adminData.id] = adminData.full_name
      })
      setAdminNames(nameMap)
    } catch (error) {
      console.error('Error loading admin names:', error)
    }
  }, [])

  const loadAuditLogs = useCallback(async () => {
    if (!admin) return

    try {
      setIsLoadingAudit(true)

      // Calculate date filter based on timeframe
      let dateFilter = ''
      const now = new Date()

      switch (activityTimeframe) {
        case '7d':
          dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
          break
        case '30d':
          dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
          break
        case '90d':
          dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
          break
        case 'all':
          dateFilter = ''
          break
      }

      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('record_id', admin.id)
        .order('created_at', { ascending: false })

      if (dateFilter) {
        query = query.gte('created_at', dateFilter)
      }

      const { data, error } = await query.limit(50)

      if (error) throw error
      setAuditLogs(data || [])
    } catch (error) {
      console.error('Error loading audit logs:', error)
      setAuditLogs([])
    } finally {
      setIsLoadingAudit(false)
    }
  }, [admin, activityTimeframe])

  useEffect(() => {
    if (isOpen && admin) {
      loadAdminNames()
      loadAuditLogs()
    }
  }, [isOpen, admin, activityTimeframe, loadAuditLogs, loadAdminNames])

  const getActivityStats = () => {
    if (!auditLogs.length) return null

    // Calculate login activities (looking for login-related changes)
    const loginActivities = auditLogs.filter(log =>
      log.change_summary?.toLowerCase().includes('login') ||
      log.action === 'login' ||
      (log.table_name === 'admins' && log.change_summary?.toLowerCase().includes('login activity'))
    )

    // Calculate different types of data changes
    const dataChanges = auditLogs.filter(log => ['create', 'update', 'delete'].includes(log.action))
    const adminUpdates = auditLogs.filter(log => log.table_name === 'admins' && log.action === 'update')
    const accountActivations = auditLogs.filter(log =>
      log.change_summary?.toLowerCase().includes('activated') ||
      (log.field_changes && 'is_active' in (log.field_changes as any))
    )

    const stats = {
      totalActions: auditLogs.length,
      loginCount: loginActivities.length,
      dataChanges: dataChanges.length,
      adminUpdates: adminUpdates.length,
      accountChanges: accountActivations.length,
      lastActivity: auditLogs[0]?.created_at,
      mostCommonAction: '',
      recentActions: auditLogs.slice(0, 3)
    }

    // Find most common action using change_summary or generated summary
    const actionCounts = auditLogs.reduce((acc, log) => {
      const action = log.change_summary || generateActionSummary(log.action, log.table_name, log.old_data, log.new_data)
      acc[action] = (acc[action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    stats.mostCommonAction = Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No activity'

    return stats
  }

  // Helper function to get appropriate styling for different change types
  const getChangeTypeStyles = (action: string, tableName: string) => {
    switch (action) {
      case 'create':
        return {
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          borderColor: 'border-green-200',
          bgHover: 'hover:bg-green-50'
        }
      case 'update':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          borderColor: 'border-blue-200',
          bgHover: 'hover:bg-blue-50'
        }
      case 'delete':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          borderColor: 'border-red-200',
          bgHover: 'hover:bg-red-50'
        }
      default:
        return {
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-600',
          borderColor: 'border-gray-200',
          bgHover: 'hover:bg-gray-50'
        }
    }
  }

  // Helper function to format field values for display
  const formatFieldValue = (value: any) => {
    if (value === null || value === undefined) return 'null'
    if (typeof value === 'boolean') return value ? 'true' : 'false'
    if (typeof value === 'string' && value.length > 50) return `${value.substring(0, 50)}...`
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }

  // Helper function to categorize changes
  const categorizeFieldChanges = (fieldChanges: Array<{field: string, oldValue: any, newValue: any}>) => {
    const categories = {
      security: [] as typeof fieldChanges,
      profile: [] as typeof fieldChanges,
      system: [] as typeof fieldChanges,
      other: [] as typeof fieldChanges
    }

    fieldChanges.forEach(change => {
      const field = change.field.toLowerCase()
      if (field.includes('password') || field.includes('role') || field.includes('active') || field.includes('permission')) {
        categories.security.push(change)
      } else if (field.includes('name') || field.includes('email') || field.includes('profile')) {
        categories.profile.push(change)
      } else if (field.includes('created') || field.includes('updated') || field.includes('id')) {
        categories.system.push(change)
      } else {
        categories.other.push(change)
      }
    })

    return categories
  }

  const renderAuditLogItem = (log: AuditLog) => {
    // Get performer name from admin_id
    const performerName = log.admin_id
      ? adminNames[log.admin_id] || 'Unknown Admin'
      : 'System'

    const timeline = formatActivityForTimeline(
      log.action,
      log.table_name,
      log.created_at,
      performerName,
      null
    )

    // Use change_summary if available, otherwise generate action summary
    const actionSummary = log.change_summary || generateActionSummary(
      log.action,
      log.table_name,
      log.old_data,
      log.new_data,
      log.metadata
    )

    const relevantChanges = getRelevantChanges(log.old_data, log.new_data)
    const metadata = formatMetadata(log.metadata)
    const styles = getChangeTypeStyles(log.action, log.table_name)

    // Extract field changes from the new field_changes field
    const fieldChanges = log.field_changes ? Object.entries(log.field_changes as Record<string, any>).map(([field, change]) => ({
      field,
      oldValue: change.old,
      newValue: change.new,
      description: `${field}: ${formatFieldValue(change.old)} → ${formatFieldValue(change.new)}`
    })) : []

    const categorizedChanges = categorizeFieldChanges(fieldChanges)

    return (
      <div key={log.id} className={`flex items-start space-x-3 p-4 border ${styles.borderColor} rounded-lg ${styles.bgHover} transition-colors`}>
        <div className="flex-shrink-0">
          <div className={`flex items-center justify-center w-10 h-10 ${styles.iconBg} rounded-full`}>
            <timeline.icon className={`w-5 h-5 ${styles.iconColor}`} />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header with action and timing */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {actionSummary}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-xs text-gray-500">
                  by {performerName}
                </p>
                <span className="text-gray-300">•</span>
                <time className="text-xs text-gray-500">
                  {getRelativeTime(log.created_at)}
                </time>
                {log.table_name && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-xs text-gray-500 capitalize">
                      {log.table_name.replace('_', ' ')}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Change Categories */}
          {fieldChanges.length > 0 && (
            <div className="mt-3 space-y-2">
              {/* Security Changes */}
              {categorizedChanges.security.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <ShieldCheckIcon className="w-3 h-3 text-red-500" />
                    <p className="text-xs font-medium text-red-700">Security Changes</p>
                  </div>
                  {categorizedChanges.security.slice(0, showTechnicalDetails ? categorizedChanges.security.length : 2).map((change, index) => (
                    <div key={index} className="text-xs text-gray-700 bg-red-50 border border-red-100 px-2 py-1 rounded ml-4">
                      <span className="font-medium text-red-800">{change.field}:</span>{' '}
                      <span className="text-red-600">{formatFieldValue(change.oldValue)}</span> → <span className="text-red-800 font-medium">{formatFieldValue(change.newValue)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Profile Changes */}
              {categorizedChanges.profile.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-3 h-3 text-blue-500" />
                    <p className="text-xs font-medium text-blue-700">Profile Changes</p>
                  </div>
                  {categorizedChanges.profile.slice(0, showTechnicalDetails ? categorizedChanges.profile.length : 2).map((change, index) => (
                    <div key={index} className="text-xs text-gray-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded ml-4">
                      <span className="font-medium text-blue-800">{change.field}:</span>{' '}
                      <span className="text-blue-600">{formatFieldValue(change.oldValue)}</span> → <span className="text-blue-800 font-medium">{formatFieldValue(change.newValue)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Other Changes */}
              {categorizedChanges.other.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="w-3 h-3 text-gray-500" />
                    <p className="text-xs font-medium text-gray-700">Data Changes</p>
                  </div>
                  {categorizedChanges.other.slice(0, showTechnicalDetails ? categorizedChanges.other.length : 2).map((change, index) => (
                    <div key={index} className="text-xs text-gray-700 bg-gray-50 border border-gray-100 px-2 py-1 rounded ml-4">
                      <span className="font-medium text-gray-800">{change.field}:</span>{' '}
                      <span className="text-gray-600">{formatFieldValue(change.oldValue)}</span> → <span className="text-gray-800 font-medium">{formatFieldValue(change.newValue)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* System Changes (only show in technical details) */}
              {categorizedChanges.system.length > 0 && showTechnicalDetails && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-1">
                    <BuildingOfficeIcon className="w-3 h-3 text-gray-400" />
                    <p className="text-xs font-medium text-gray-600">System Changes</p>
                  </div>
                  {categorizedChanges.system.map((change, index) => (
                    <div key={index} className="text-xs text-gray-600 bg-gray-50 border border-gray-100 px-2 py-1 rounded ml-4">
                      <span className="font-medium">{change.field}:</span>{' '}
                      {formatFieldValue(change.oldValue)} → {formatFieldValue(change.newValue)}
                    </div>
                  ))}
                </div>
              )}

              {/* Show more button */}
              {(categorizedChanges.security.length + categorizedChanges.profile.length + categorizedChanges.other.length > 4) && !showTechnicalDetails && (
                <button
                  onClick={() => setShowTechnicalDetails(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Show {(categorizedChanges.security.length + categorizedChanges.profile.length + categorizedChanges.other.length) - 4} more changes
                </button>
              )}
            </div>
          )}

          {/* Change Context */}
          {log.change_context && (
            <div className="mt-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                <div className="flex items-start space-x-2">
                  <EyeIcon className="w-3 h-3 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-800">Context</p>
                    <p className="text-xs text-amber-700 mt-0.5">{log.change_context}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Legacy relevant changes (fallback) */}
          {relevantChanges.length > 0 && fieldChanges.length === 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-gray-700">Changes:</p>
              {relevantChanges.slice(0, showTechnicalDetails ? relevantChanges.length : 3).map((change, index) => (
                <div key={index} className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2 py-1 rounded">
                  {change.description}
                </div>
              ))}
              {relevantChanges.length > 3 && !showTechnicalDetails && (
                <button
                  onClick={() => setShowTechnicalDetails(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Show {relevantChanges.length - 3} more changes
                </button>
              )}
            </div>
          )}

          {/* Metadata */}
          {metadata.length > 0 && showTechnicalDetails && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-700 mb-2">Additional Information</p>
              <div className="space-y-1">
                {metadata.map((item, index) => (
                  <div key={index} className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    <span className="font-medium text-gray-700">{item.label}:</span> {item.value}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Details Collapsible */}
          {(log.old_data || log.new_data || log.metadata) && showTechnicalDetails && (
            <details className="mt-3">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 font-medium">
                Raw Technical Data
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded-lg text-xs border">
                {log.old_data && (
                  <div className="mb-3">
                    <span className="font-medium text-gray-700 block mb-1">Previous Values:</span>
                    <pre className="text-gray-600 whitespace-pre-wrap overflow-x-auto bg-white p-2 rounded border text-xs">
                      {JSON.stringify(log.old_data, null, 2)}
                    </pre>
                  </div>
                )}
                {log.new_data && (
                  <div className="mb-3">
                    <span className="font-medium text-gray-700 block mb-1">New Values:</span>
                    <pre className="text-gray-600 whitespace-pre-wrap overflow-x-auto bg-white p-2 rounded border text-xs">
                      {JSON.stringify(log.new_data, null, 2)}
                    </pre>
                  </div>
                )}
                {log.metadata && (
                  <div>
                    <span className="font-medium text-gray-700 block mb-1">Metadata:</span>
                    <pre className="text-gray-600 whitespace-pre-wrap overflow-x-auto bg-white p-2 rounded border text-xs">
                      {JSON.stringify(log.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>
      </div>
    )
  }

  if (!isOpen || !admin) return null

  const stats = getActivityStats()

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-60">
      <div className="fixed inset-0 bg-black/25 z-60" />

      <div className="fixed inset-0 overflow-y-auto z-60">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all z-60 relative">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                  admin.role === 'super_admin'
                    ? 'bg-gradient-to-br from-red-500 to-red-600 ring-2 ring-red-200'
                    : 'bg-blue-500'
                }`}>
                  <span className="text-sm font-medium text-white">
                    {admin.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    {admin.full_name}
                  </DialogTitle>
                  <p className="text-sm text-gray-600">{getFriendlyRole(admin.role)}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="px-6 -mb-px flex space-x-6">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('activity')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'activity'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Activity
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'audit'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Audit History
                </button>
              </nav>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <UserIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Full Name</p>
                        <p className="text-sm text-gray-900">{admin.full_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <EnvelopeIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Email</p>
                        <p className="text-sm text-gray-900">{admin.email || 'Not available'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Role</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          admin.role === 'super_admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {getFriendlyRole(admin.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <BuildingOfficeIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Branch Access</p>
                        <p className="text-sm text-gray-900">
                          {admin.role === 'super_admin' || admin.branches.length === 0
                            ? 'All branches'
                            : `${admin.branches.length} branch${admin.branches.length > 1 ? 'es' : ''}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Created</p>
                        <p className="text-sm text-gray-900">
                          {new Date(admin.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <ClockIcon className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">Last Login</p>
                        <p className="text-sm text-gray-900">
                          {admin.last_login
                            ? getRelativeTime(admin.last_login)
                            : 'Never'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Account Status</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {admin.is_active && (
                          <span className="text-xs text-gray-500">
                            Can access the system
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                {/* Activity Stats */}
                {stats && (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <ChartBarIcon className="w-5 h-5 text-blue-600" />
                        <div className="ml-2">
                          <p className="text-lg font-semibold text-blue-900">{stats.totalActions}</p>
                          <p className="text-xs text-blue-700">Total Actions</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <ClockIcon className="w-5 h-5 text-green-600" />
                        <div className="ml-2">
                          <p className="text-lg font-semibold text-green-900">{stats.loginCount}</p>
                          <p className="text-xs text-green-700">Login Activities</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <ShieldCheckIcon className="w-5 h-5 text-purple-600" />
                        <div className="ml-2">
                          <p className="text-lg font-semibold text-purple-900">{stats.dataChanges}</p>
                          <p className="text-xs text-purple-700">Data Changes</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <UserIcon className="w-5 h-5 text-orange-600" />
                        <div className="ml-2">
                          <p className="text-lg font-semibold text-orange-900">{stats.adminUpdates}</p>
                          <p className="text-xs text-orange-700">Admin Updates</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <ShieldCheckIcon className="w-5 h-5 text-red-600" />
                        <div className="ml-2">
                          <p className="text-lg font-semibold text-red-900">{stats.accountChanges}</p>
                          <p className="text-xs text-red-700">Account Changes</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center">
                        <CalendarIcon className="w-5 h-5 text-gray-600" />
                        <div className="ml-2">
                          <p className="text-xs font-semibold text-gray-900">Last Activity</p>
                          <p className="text-xs text-gray-700">
                            {stats.lastActivity ? getRelativeTime(stats.lastActivity) : 'No activity'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Most Common Action */}
                {stats?.mostCommonAction && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Most Common Activity</h4>
                    <p className="text-sm text-gray-600">{stats.mostCommonAction}</p>
                  </div>
                )}

                {/* Recent Activity Preview */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Recent Activity</h4>
                  {isLoadingAudit ? (
                    <div className="flex justify-center py-4">
                      <LoadingSpinner size="sm" />
                    </div>
                  ) : auditLogs.length > 0 ? (
                    <div className="space-y-3">
                      {auditLogs.slice(0, 5).map(renderAuditLogItem)}
                      {auditLogs.length > 5 && (
                        <button
                          onClick={() => setActiveTab('audit')}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View all {auditLogs.length} activities →
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No recent activity found</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="space-y-4">
                {/* Filters and Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <select
                      value={activityTimeframe}
                      onChange={(e) => setActivityTimeframe(e.target.value as '7d' | '30d' | '90d' | 'all')}
                      className="block px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="7d">Last 7 days</option>
                      <option value="30d">Last 30 days</option>
                      <option value="90d">Last 90 days</option>
                      <option value="all">All time</option>
                    </select>
                  </div>

                  <button
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    {showTechnicalDetails ? (
                      <EyeSlashIcon className="w-4 h-4" />
                    ) : (
                      <EyeIcon className="w-4 h-4" />
                    )}
                    <span>{showTechnicalDetails ? 'Hide' : 'Show'} Technical Details</span>
                  </button>
                </div>

                {/* Audit Log List */}
                {isLoadingAudit ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : auditLogs.length > 0 ? (
                  <div className="space-y-3">
                    {auditLogs.map(renderAuditLogItem)}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ChartBarIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No audit logs found for this timeframe</p>
                  </div>
                )}
              </div>
            )}
          </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Close
              </button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}