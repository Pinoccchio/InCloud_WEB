/**
 * Audit Log Formatting Utilities
 *
 * This module provides human-readable formatting for audit log data,
 * converting technical JSON objects and metadata into user-friendly text.
 */

// Field name mapping from technical to user-friendly
const FIELD_LABELS: Record<string, string> = {
  full_name: 'Full Name',
  email: 'Email Address',
  role: 'Role',
  branches: 'Branch Assignments',
  is_active: 'Account Status',
  user_id: 'User ID',
  created_at: 'Created Date',
  updated_at: 'Last Updated',
  last_login: 'Last Login',
  password: 'Password',
  name: 'Name',
  description: 'Description',
  status: 'Status',
  price: 'Price',
  quantity: 'Quantity',
  sku: 'SKU',
  barcode: 'Barcode'
}

// Role formatting
const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  super_admin: 'Super Admin'
}

/**
 * Formats a field name to be user-friendly
 */
export function formatFieldName(fieldName: string): string {
  return FIELD_LABELS[fieldName] || fieldName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Formats a field value to be human-readable
 */
export function formatFieldValue(field: string, value: unknown): string {
  if (value === null || value === undefined) {
    return 'Not set'
  }

  // Handle specific field types
  switch (field) {
    case 'role':
      return ROLE_LABELS[String(value)] || String(value)

    case 'is_active':
      return value ? 'Active' : 'Inactive'

    case 'branches':
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return 'All branches (Super Admin access)'
        }
        return `Assigned to ${value.length} branch${value.length > 1 ? 'es' : ''}`
      }
      return String(value)

    case 'password':
      return '[Password Changed]'

    case 'created_at':
    case 'updated_at':
    case 'last_login':
      if (typeof value === 'string') {
        return new Date(value).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
      return String(value)

    case 'email':
      return String(value)

    case 'price':
      if (typeof value === 'number') {
        return `₱${value.toFixed(2)}`
      }
      return String(value)

    default:
      // Handle arrays
      if (Array.isArray(value)) {
        if (value.length === 0) {
          return 'None'
        }
        return value.join(', ')
      }

      // Handle objects
      if (typeof value === 'object' && value !== null) {
        return '[Complex Data]'
      }

      return String(value)
  }
}

/**
 * Creates a human-readable change description
 */
export function formatFieldChange(field: string, oldValue: unknown, newValue: unknown): string {
  const fieldLabel = formatFieldName(field)
  const oldFormatted = formatFieldValue(field, oldValue)
  const newFormatted = formatFieldValue(field, newValue)

  // Handle special cases
  if (field === 'password') {
    return 'Password was changed'
  }

  if (field === 'is_active') {
    if (newValue) {
      return 'Account was activated'
    } else {
      return 'Account was deactivated'
    }
  }

  if (field === 'role') {
    return `Role changed from ${oldFormatted} to ${newFormatted}`
  }

  if (field === 'branches') {
    return `Branch assignments updated`
  }

  return `${fieldLabel} changed from "${oldFormatted}" to "${newFormatted}"`
}

/**
 * Generates a natural language summary for an audit log action
 */
export function generateActionSummary(
  action: string,
  tableName: string,
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null,
  _metadata?: Record<string, unknown> | null
): string {
  const entityName = tableName.replace('_', ' ').toLowerCase()

  switch (action) {
    case 'create':
      if (tableName === 'admins') {
        const name = newData?.full_name || 'Unknown User'
        const role = formatFieldValue('role', newData?.role)
        return `Created new ${role} account for ${name}`
      }
      return `Created new ${entityName}`

    case 'update':
      if (tableName === 'admins') {
        const name = newData?.full_name || oldData?.full_name || 'Unknown User'
        return `Updated admin account for ${name}`
      }
      return `Updated ${entityName}`

    case 'delete':
      if (tableName === 'admins') {
        const name = oldData?.full_name || 'Unknown User'
        return `Deleted admin account for ${name}`
      }
      return `Deleted ${entityName}`

    case 'login':
      return 'Logged into the system'

    case 'logout':
      return 'Logged out of the system'

    case 'password_change':
      return 'Changed password'

    default:
      return `Performed ${action} on ${entityName}`
  }
}

/**
 * Extracts relevant changes from old and new data
 */
export function getRelevantChanges(
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown> | null
): Array<{ field: string; oldValue: unknown; newValue: unknown; description: string }> {
  if (!oldData || !newData) return []

  const changes: Array<{ field: string; oldValue: unknown; newValue: unknown; description: string }> = []

  // Get all unique keys
  const allKeys = new Set([
    ...Object.keys(oldData),
    ...Object.keys(newData)
  ])

  // Skip technical fields that users don't need to see
  const skipFields = ['id', 'created_at', 'updated_at', 'user_id']

  allKeys.forEach(key => {
    if (skipFields.includes(key)) return

    const oldValue = oldData[key]
    const newValue = newData[key]

    // Check if values are different
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue,
        newValue,
        description: formatFieldChange(key, oldValue, newValue)
      })
    }
  })

  return changes
}

/**
 * Formats metadata into user-friendly key-value pairs
 */
export function formatMetadata(metadata: Record<string, unknown> | null): Array<{ label: string; value: string }> {
  if (!metadata) return []

  const formatted: Array<{ label: string; value: string }> = []

  // Only show user-relevant metadata
  const userRelevantKeys = ['reason', 'action_context', 'notes']

  Object.entries(metadata).forEach(([key, value]) => {
    if (userRelevantKeys.includes(key) && value !== null && value !== undefined) {
      formatted.push({
        label: formatFieldName(key),
        value: String(value)
      })
    }
  })

  return formatted
}