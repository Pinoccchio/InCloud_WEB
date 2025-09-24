'use client'

import React, { useState, memo, useEffect } from 'react'
import {
  XMarkIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import { AuditLog } from '../hooks/useAuditLogs'
import {
  formatFieldValue,
  generateActionSummary,
  getRelevantChanges,
  formatMetadata
} from '@/lib/audit-formatters'

interface ModalDetailsProps {
  auditLog: AuditLog | null
  isOpen: boolean
  onClose: () => void
}

const CopyButton = memo(function CopyButton({
  text,
  label
}: {
  text: string
  label: string
}) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copyToClipboard}
      className="text-gray-400 hover:text-gray-600 flex items-center"
      title={`Copy ${label}`}
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 text-green-500" />
      ) : (
        <ClipboardDocumentIcon className="h-4 w-4" />
      )}
    </Button>
  )
})

const ChangesDiff = memo(function ChangesDiff({
  oldData,
  newData
}: {
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
}) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const relevantChanges = getRelevantChanges(oldData, newData)

  if (!oldData && !newData) return null

  if (relevantChanges.length === 0 && (oldData || newData)) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <InformationCircleIcon className="h-5 w-5 text-blue-400 mr-2" />
          <span className="text-sm text-blue-700">
            {oldData && !newData ? 'Data was removed' :
             !oldData && newData ? 'New data was created' :
             'No field changes detected'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {relevantChanges.length > 0 && (
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <DocumentTextIcon className="w-4 h-4 mr-2" />
            Changes Made ({relevantChanges.length})
          </h5>
          <div className="space-y-3">
            {relevantChanges.map((change, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium mb-2">
                      {change.description}
                    </p>
                    {showTechnicalDetails && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-200">
                        <div>
                          <label className="block text-xs font-medium text-red-700 mb-1">
                            Previous Value
                          </label>
                          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-800">
                            {formatFieldValue(change.field, change.oldValue)}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-green-700 mb-1">
                            New Value
                          </label>
                          <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-800">
                            {formatFieldValue(change.field, change.newValue)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Technical Details Toggle */}
      {(oldData || newData) && (
        <div className="border-t border-gray-200 pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-gray-600 hover:text-gray-900"
          >
            {showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
          </Button>

          {showTechnicalDetails && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
              {oldData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Original Data (Technical)
                  </label>
                  <div className="bg-red-50 border border-red-200 rounded p-3 max-h-64 overflow-auto">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(oldData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {newData && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Updated Data (Technical)
                  </label>
                  <div className="bg-green-50 border border-green-200 rounded p-3 max-h-64 overflow-auto">
                    <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                      {JSON.stringify(newData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
})

const ModalDetails = memo(function ModalDetails({
  auditLog,
  isOpen,
  onClose
}: ModalDetailsProps) {
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !auditLog) return null

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
    if (!dateTime) return 'Unknown'
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    })
  }

  const reason = auditLog.metadata?.reason
  const actionContext = auditLog.metadata?.action_context

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal */}
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl">
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${
                  auditLog.admins.role === 'super_admin'
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : 'bg-blue-500'
                }`}>
                  <span className="text-lg font-medium text-white">
                    {auditLog.admins.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Audit Log Details
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDateTime(auditLog.created_at)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </Button>
            </div>

            {/* Basic Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action Performed
                  </label>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getActionBadgeColor(auditLog.action)}`}>
                    {auditLog.action.toUpperCase()}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin User
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-900 font-medium">
                        {auditLog.admins.full_name}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(auditLog.admins.role)}`}>
                        {auditLog.admins.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{auditLog.admins.email}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table/Resource
                  </label>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-900 font-mono bg-gray-100 px-3 py-1.5 rounded flex-1">
                      {auditLog.table_name}
                    </p>
                  </div>
                </div>

                {auditLog.record_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Record ID
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-900 font-mono bg-gray-100 px-3 py-1.5 rounded flex-1 break-all">
                        {auditLog.record_id}
                      </p>
                      <CopyButton text={auditLog.record_id} label="Record ID" />
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">

                {(() => {
                  // Use existing summary if it exists and is user-friendly, otherwise generate one
                  const displaySummary = auditLog.change_summary ||
                    generateActionSummary(
                      auditLog.action,
                      auditLog.table_name,
                      auditLog.old_data,
                      auditLog.new_data,
                      auditLog.metadata
                    )

                  return displaySummary && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Summary
                      </label>
                      <p className="text-sm text-gray-900 bg-blue-50 border border-blue-200 p-3 rounded">
                        {displaySummary}
                      </p>
                    </div>
                  )
                })()}

                {reason && typeof reason === 'string' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason
                    </label>
                    <p className="text-sm text-gray-900 bg-yellow-50 border border-yellow-200 p-3 rounded">
                      {reason}
                    </p>
                  </div>
                )}

                {actionContext && typeof actionContext === 'string' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Context
                    </label>
                    <p className="text-sm text-gray-900 bg-purple-50 border border-purple-200 p-3 rounded">
                      {actionContext}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Data Changes Section */}
          {(auditLog.old_data || auditLog.new_data) && (
            <div className="border-t border-gray-200 px-6 py-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                Data Changes
              </h4>
              <ChangesDiff oldData={auditLog.old_data} newData={auditLog.new_data} />
            </div>
          )}

          {/* Additional Information */}
          {(() => {
            const formattedMetadata = formatMetadata(auditLog.metadata)
            return formattedMetadata.length > 0 && (
              <div className="border-t border-gray-200 px-6 py-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Additional Information
                </h4>
                <div className="space-y-3">
                  {formattedMetadata.map((item, index) => (
                    <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 mb-1">
                            {item.label}
                          </p>
                          <p className="text-sm text-blue-800">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse">
            <Button
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              Close Details
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
})

export default ModalDetails