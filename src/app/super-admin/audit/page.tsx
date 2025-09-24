'use client'

import React, { useState, useCallback } from 'react'
import {
  ClockIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  EyeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'
import { Button, LoadingSpinner } from '@/components/ui'
import { useToastActions } from '@/contexts/ToastContext'
import { useAuditLogs, AuditLog } from './hooks/useAuditLogs'
import SmartFilters from './components/SmartFilters'
import StreamlinedTable from './components/StreamlinedTable'
import ModalDetails from './components/ModalDetails'

export default function AuditDashboardPage() {
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const { success, error } = useToastActions()

  const {
    auditLogs,
    admins,
    isLoading,
    isExporting,
    error: hookError,
    pagination,
    filters,
    setFilters,
    clearFilters,
    goToPage,
    exportLogs,
    refetch
  } = useAuditLogs()

  // Handle view details
  const handleViewDetails = useCallback((auditLog: AuditLog) => {
    setSelectedAuditLog(auditLog)
    setShowDetails(true)
  }, [])

  // Handle close details modal
  const handleCloseDetails = useCallback(() => {
    setShowDetails(false)
    setSelectedAuditLog(null)
  }, [])

  // Handle export with error handling
  const handleExport = useCallback(async () => {
    try {
      await exportLogs()
      success(
        'Export Successful',
        'Audit logs have been exported successfully'
      )
    } catch (err) {
      error(
        'Export Failed',
        err instanceof Error ? err.message : 'Failed to export audit logs'
      )
    }
  }, [exportLogs, success, error])

  // Show error state if hook error and no data
  if (hookError && auditLogs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Monitor and track all administrative actions in the system
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-red-900 mb-2">Access Error</h3>
            <p className="text-red-700 mb-4">{hookError}</p>
            <Button onClick={refetch} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Calculate stats
  const todaysLogs = auditLogs.filter(log => {
    if (!log.created_at) return false
    const logDate = new Date(log.created_at)
    const today = new Date()
    return logDate.toDateString() === today.toDateString()
  }).length

  const deleteLogs = auditLogs.filter(log => log.action === 'delete').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShieldCheckIcon className="w-8 h-8 mr-3 text-blue-600" />
            Audit Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and track all administrative actions in the system
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={refetch}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="flex items-center"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || auditLogs.length === 0}
            className="flex items-center"
            variant="outline"
          >
            {isExporting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentChartBarIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">
                {pagination.totalItems.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Audit Logs</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">
                {todaysLogs}
              </div>
              <div className="text-sm text-gray-500">Today&apos;s Actions</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">
                {admins.length}
              </div>
              <div className="text-sm text-gray-500">Active Admins</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">
                {deleteLogs}
              </div>
              <div className="text-sm text-gray-500">Delete Actions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {hookError && auditLogs.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2" />
            <span className="text-sm text-yellow-800">
              Warning: {hookError}
            </span>
          </div>
        </div>
      )}

      {/* Filters */}
      <SmartFilters
        filters={filters}
        admins={admins}
        onFiltersChange={setFilters}
        onClearFilters={clearFilters}
        isLoading={isLoading}
      />

      {/* Audit Log Table */}
      <StreamlinedTable
        auditLogs={auditLogs}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={goToPage}
        onViewDetails={handleViewDetails}
      />

      {/* Audit Details Modal */}
      <ModalDetails
        auditLog={selectedAuditLog}
        isOpen={showDetails}
        onClose={handleCloseDetails}
      />
    </div>
  )
}