'use client'

import { ArrowRightIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import {
  formatValue,
  getFieldLabel,
  detectFieldType,
  calculateChangeMagnitude,
  formatCurrency
} from './audit-diff-formatters'

interface DiffViewerProps {
  oldData: Record<string, unknown> | null
  newData: Record<string, unknown> | null
  tableName: string
}

interface FieldChange {
  field: string
  label: string
  oldValue: unknown
  newValue: unknown
  type: 'added' | 'removed' | 'modified'
}

/**
 * DiffViewer Component
 *
 * Displays differences between old and new data in a GitHub-style diff format.
 * Features:
 * - Color-coded changes (red for old, green for new)
 * - Smart value formatting (currency, dates, enums)
 * - Field-by-field comparison
 * - Change magnitude calculation for numeric fields
 */
export function DiffViewer({ oldData, newData, tableName }: DiffViewerProps) {
  // Handle cases where one or both data objects are null
  if (!oldData && !newData) {
    return (
      <div className="text-sm text-gray-500 italic text-center py-4">
        No data available
      </div>
    )
  }

  // Identify changed fields
  const changes = identifyChanges(oldData, newData)

  if (changes.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic text-center py-4">
        No changes detected
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-700">Field Changes</h4>
        <span className="text-xs text-gray-500">({changes.length} field{changes.length !== 1 ? 's' : ''} changed)</span>
      </div>

      <div className="space-y-3">
        {changes.map((change, index) => (
          <FieldDiffRow key={`${change.field}-${index}`} change={change} />
        ))}
      </div>
    </div>
  )
}

/**
 * Individual field diff row component
 */
function FieldDiffRow({ change }: { change: FieldChange }) {
  const fieldType = detectFieldType(change.field, change.oldValue ?? change.newValue)
  const isNumeric = fieldType === 'currency' || fieldType === 'number'

  // Calculate magnitude for numeric changes
  const magnitude = isNumeric && change.type === 'modified'
    ? calculateChangeMagnitude(change.oldValue, change.newValue)
    : null

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Field Label Header */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">{change.label}</span>
          {change.type === 'modified' && magnitude && (
            <ChangeMagnitudeBadge magnitude={magnitude} fieldType={fieldType} />
          )}
        </div>
      </div>

      {/* Value Comparison */}
      <div className="divide-y divide-gray-200">
        {/* Old Value (Removed/Modified) */}
        {(change.type === 'removed' || change.type === 'modified') && (
          <div className="flex items-start gap-3 px-4 py-3 bg-red-50">
            <div className="flex-shrink-0 mt-0.5">
              <MinusIcon className="h-4 w-4 text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-red-700 mb-1">Before</div>
              <div className="text-sm text-red-900 font-mono break-words">
                {formatValue(change.field, change.oldValue)}
              </div>
            </div>
          </div>
        )}

        {/* Arrow indicator for modified fields */}
        {change.type === 'modified' && (
          <div className="flex items-center justify-center py-2 bg-gray-50">
            <ArrowRightIcon className="h-4 w-4 text-gray-400" />
          </div>
        )}

        {/* New Value (Added/Modified) */}
        {(change.type === 'added' || change.type === 'modified') && (
          <div className="flex items-start gap-3 px-4 py-3 bg-green-50">
            <div className="flex-shrink-0 mt-0.5">
              <PlusIcon className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-green-700 mb-1">After</div>
              <div className="text-sm text-green-900 font-mono break-words">
                {formatValue(change.field, change.newValue)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Badge showing change magnitude for numeric fields
 */
function ChangeMagnitudeBadge({
  magnitude,
  fieldType
}: {
  magnitude: { amount: number; percentage: number | null }
  fieldType: string
}) {
  const isIncrease = magnitude.amount > 0
  const absAmount = Math.abs(magnitude.amount)

  return (
    <div className="flex items-center gap-2">
      {/* Amount change */}
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
          isIncrease
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {isIncrease ? '+' : '-'}
        {fieldType === 'currency' ? formatCurrency(absAmount) : absAmount.toFixed(2)}
      </span>

      {/* Percentage change */}
      {magnitude.percentage !== null && (
        <span className="text-xs text-gray-500">
          ({isIncrease ? '+' : '-'}
          {Math.abs(magnitude.percentage).toFixed(1)}%)
        </span>
      )}
    </div>
  )
}

/**
 * Identify changed fields between old and new data
 */
function identifyChanges(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null
): FieldChange[] {
  const changes: FieldChange[] = []

  // Skip fields that shouldn't be shown in diff
  const skipFields = ['id', 'created_at', 'updated_at', 'user_id', 'admin_id']

  // Get all unique field names
  const allFields = new Set<string>()
  if (oldData) Object.keys(oldData).forEach(field => allFields.add(field))
  if (newData) Object.keys(newData).forEach(field => allFields.add(field))

  allFields.forEach(field => {
    // Skip excluded fields
    if (skipFields.includes(field)) return

    const oldValue = oldData?.[field]
    const newValue = newData?.[field]

    // Field was added
    if (oldValue === undefined && newValue !== undefined) {
      changes.push({
        field,
        label: getFieldLabel(field),
        oldValue: null,
        newValue,
        type: 'added'
      })
      return
    }

    // Field was removed
    if (oldValue !== undefined && newValue === undefined) {
      changes.push({
        field,
        label: getFieldLabel(field),
        oldValue,
        newValue: null,
        type: 'removed'
      })
      return
    }

    // Field was modified
    if (oldValue !== newValue && !areValuesEqual(oldValue, newValue)) {
      changes.push({
        field,
        label: getFieldLabel(field),
        oldValue,
        newValue,
        type: 'modified'
      })
    }
  })

  // Sort changes: modified first, then added, then removed
  return changes.sort((a, b) => {
    const typeOrder = { modified: 0, added: 1, removed: 2 }
    return typeOrder[a.type] - typeOrder[b.type]
  })
}

/**
 * Deep equality check for values (handles objects and arrays)
 */
function areValuesEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true

  if (a === null || b === null) return a === b
  if (a === undefined || b === undefined) return a === b

  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime()
  }

  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((val, index) => areValuesEqual(val, b[index]))
  }

  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object)
    const bKeys = Object.keys(b as object)

    if (aKeys.length !== bKeys.length) return false

    return aKeys.every(key =>
      areValuesEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    )
  }

  return false
}
