'use client'

import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { AuditLog } from '../page'
import { DiffViewer } from '@/components/audit/DiffViewer'

interface AuditLogDetailModalProps {
  isOpen: boolean
  onClose: () => void
  auditLog: AuditLog
}

export function AuditLogDetailModal({ isOpen, onClose, auditLog }: AuditLogDetailModalProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const renderJSON = (data: Record<string, unknown> | null) => {
    if (!data || Object.keys(data).length === 0) {
      return <p className="text-sm text-gray-500 italic">No data</p>
    }

    return (
      <pre className="mt-2 p-3 bg-gray-50 rounded-md text-xs overflow-x-auto text-gray-900 font-mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    )
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create':
        return 'bg-green-100 text-green-800'
      case 'update':
        return 'bg-blue-100 text-blue-800'
      case 'delete':
        return 'bg-red-100 text-red-800'
      case 'read':
        return 'bg-gray-100 text-gray-800'
      case 'login':
      case 'logout':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="w-full max-w-3xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <DialogTitle className="text-lg font-medium text-gray-900">
                Audit Log Details
              </DialogTitle>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Action</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(auditLog.action)}`}>
                    {auditLog.action.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Table</h4>
                  <p className="text-sm text-gray-900">{auditLog.table_name || 'N/A'}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Date & Time</h4>
                  <p className="text-sm text-gray-900">{formatDate(auditLog.created_at)}</p>
                </div>
                {auditLog.record_id && (
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Record ID</h4>
                    <p className="text-sm text-gray-900 font-mono">{auditLog.record_id}</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              {auditLog.change_summary && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Summary</h4>
                  <p className="text-sm text-gray-900 bg-blue-50 p-3 rounded-md">
                    {auditLog.change_summary}
                  </p>
                </div>
              )}

              {/* Context - hide if adjustment_reason exists to avoid duplication */}
              {auditLog.change_context && !auditLog.metadata?.adjustment_reason && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Context</h4>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                    {auditLog.change_context}
                  </p>
                </div>
              )}

              {/* Metadata (including adjustment_reason) */}
              {auditLog.metadata && Object.keys(auditLog.metadata).length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Metadata</h4>
                  {auditLog.metadata.adjustment_reason && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-xs font-medium text-yellow-800 mb-1">Adjustment Reason:</p>
                      <p className="text-sm text-yellow-900">{String(auditLog.metadata.adjustment_reason)}</p>
                    </div>
                  )}
                  {renderJSON(auditLog.metadata)}
                </div>
              )}

              {/* Field Changes - GitHub-style Diff Viewer */}
              {((auditLog.old_data && Object.keys(auditLog.old_data).length > 0) ||
                (auditLog.new_data && Object.keys(auditLog.new_data).length > 0)) && (
                <div className="mb-6">
                  <DiffViewer
                    oldData={auditLog.old_data}
                    newData={auditLog.new_data}
                    tableName={auditLog.table_name || 'unknown'}
                  />
                </div>
              )}

              {/* Legacy Field Changes JSON (fallback for non-diff data) */}
              {auditLog.field_changes && Object.keys(auditLog.field_changes).length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Field Changes</h4>
                  {renderJSON(auditLog.field_changes)}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
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
