'use client'

import React, { memo } from 'react'
import {
  EyeIcon,
  CalendarIcon,
  ComputerDesktopIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import { Button, LoadingSpinner } from '@/components/ui'
import { AuditLog, Pagination } from '../hooks/useAuditLogs'
import { generateActionSummary } from '@/lib/audit-formatters'

interface StreamlinedTableProps {
  auditLogs: AuditLog[]
  isLoading: boolean
  pagination: Pagination
  onPageChange: (page: number) => void
  onViewDetails: (auditLog: AuditLog) => void
}

// Skeleton row for loading state
const SkeletonRow = memo(function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            <div className="w-20 h-3 bg-gray-200 rounded"></div>
            <div className="w-16 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="w-24 h-3 bg-gray-200 rounded"></div>
            <div className="w-16 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-2">
          <div className="w-20 h-3 bg-gray-200 rounded"></div>
          <div className="w-12 h-3 bg-gray-200 rounded"></div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="w-32 h-3 bg-gray-200 rounded"></div>
      </td>
      <td className="px-6 py-4">
        <div className="w-16 h-8 bg-gray-200 rounded"></div>
      </td>
    </tr>
  )
})

// Individual audit log row
const AuditLogRow = memo(function AuditLogRow({
  log,
  onViewDetails
}: {
  log: AuditLog
  onViewDetails: (log: AuditLog) => void
}) {
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

  const getRoleBadgeColor = (role: string) => {
    return role === 'super_admin'
      ? 'bg-red-100 text-red-800 border-red-200'
      : 'bg-blue-100 text-blue-800 border-blue-200'
  }

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return { date: 'Unknown', time: '' }

    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const truncateText = (text: string, maxLength: number = 50) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
  }

  const dateTime = formatDateTime(log.created_at)

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Date & Time */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <CalendarIcon className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-gray-900">{dateTime.date}</div>
            <div className="text-gray-500">{dateTime.time}</div>
          </div>
        </div>
      </td>

      {/* Admin */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-8 w-8">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              log.admins.role === 'super_admin'
                ? 'bg-gradient-to-br from-red-500 to-red-600'
                : 'bg-blue-500'
            }`}>
              <span className="text-xs font-medium text-white">
                {log.admins.full_name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <div className="text-sm font-medium text-gray-900">
              {log.admins.full_name}
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(log.admins.role)}`}>
                {log.admins.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Action */}
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionBadgeColor(log.action)}`}>
          {log.action.toUpperCase()}
        </span>
      </td>

      {/* Table */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
          {log.table_name}
        </div>
        {log.record_id && (
          <div className="text-xs text-gray-500 font-mono mt-1">
            ID: {truncateText(log.record_id, 8)}
          </div>
        )}
      </td>

      {/* Details */}
      <td className="px-6 py-4 max-w-xs">
        <div className="text-sm text-gray-900">
          {(() => {
            // Generate user-friendly summary
            const displaySummary = log.change_summary ||
              generateActionSummary(
                log.action,
                log.table_name,
                log.old_data,
                log.new_data,
                log.metadata
              )

            return displaySummary && (
              <div className="mb-1">
                <span className="font-medium text-gray-700">{truncateText(displaySummary, 45)}</span>
              </div>
            )
          })()}
          {(() => {
            const reason = log.metadata?.reason
            return reason && typeof reason === 'string' ? (
              <div className="mb-1">
                <span className="text-xs text-gray-600">Reason:</span>{' '}
                <span className="text-xs text-gray-800">{truncateText(reason, 35)}</span>
              </div>
            ) : null
          })()}
          {log.change_context && (
            <div className="flex items-center text-xs text-gray-500 mt-1">
              <ComputerDesktopIcon className="w-3 h-3 mr-1 flex-shrink-0" />
              <span>{truncateText(log.change_context, 35)}</span>
            </div>
          )}
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewDetails(log)}
          className="flex items-center"
        >
          <EyeIcon className="w-4 h-4 mr-1" />
          Details
        </Button>
      </td>
    </tr>
  )
})

// Pagination component
const TablePagination = memo(function TablePagination({
  pagination,
  onPageChange
}: {
  pagination: Pagination
  onPageChange: (page: number) => void
}) {
  if (pagination.totalPages <= 1) return null

  return (
    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
      {/* Mobile pagination */}
      <div className="flex-1 flex justify-between sm:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.currentPage - 1)}
          disabled={!pagination.hasPrevPage}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
        >
          Next
        </Button>
      </div>

      {/* Desktop pagination */}
      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-gray-700">
            Showing{' '}
            <span className="font-medium">
              {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium">
              {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}
            </span>{' '}
            of{' '}
            <span className="font-medium">{pagination.totalItems}</span>{' '}
            results
          </p>
        </div>

        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="rounded-l-md border-r-0"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
              let pageNum
              if (pagination.totalPages <= 5) {
                pageNum = i + 1
              } else if (pagination.currentPage <= 3) {
                pageNum = i + 1
              } else if (pagination.currentPage >= pagination.totalPages - 2) {
                pageNum = pagination.totalPages - 4 + i
              } else {
                pageNum = pagination.currentPage - 2 + i
              }

              if (pageNum > pagination.totalPages || pageNum < 1) return null

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.currentPage ? "primary" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className="border-r-0"
                >
                  {pageNum}
                </Button>
              )
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="rounded-r-md"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>
    </div>
  )
})

const StreamlinedTable = memo(function StreamlinedTable({
  auditLogs,
  isLoading,
  pagination,
  onPageChange,
  onViewDetails
}: StreamlinedTableProps) {
  // Show skeleton during loading
  if (isLoading && auditLogs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Table
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.from({ length: 10 }, (_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Show empty state
  if (!isLoading && auditLogs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-12">
          <DocumentTextIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
          <p className="text-gray-500 text-sm">
            Try adjusting your filters or date range to see more results
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Loading overlay for refresh */}
      {isLoading && auditLogs.length > 0 && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="text-center">
            <LoadingSpinner size="md" />
            <p className="mt-2 text-sm text-gray-600">Updating...</p>
          </div>
        </div>
      )}

      <div className="relative overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Table
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {auditLogs.map((log) => (
              <AuditLogRow
                key={log.id}
                log={log}
                onViewDetails={onViewDetails}
              />
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  )
})

export default StreamlinedTable