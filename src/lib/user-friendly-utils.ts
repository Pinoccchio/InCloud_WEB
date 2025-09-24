/**
 * Utility functions for creating user-friendly interfaces
 * Transforms technical jargon into business-friendly language
 */

import {
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  LockClosedIcon,
  EyeIcon,
  ComputerDesktopIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'

// Action mapping for user-friendly descriptions
export const ACTION_DESCRIPTIONS = {
  // Database operations
  'CREATE on table admins': 'Added new team member',
  'UPDATE on table admins': 'Updated team member information',
  'DELETE on table admins': 'Removed team member',
  'CREATE on table products': 'Added new product',
  'UPDATE on table products': 'Updated product information',
  'DELETE on table products': 'Removed product',
  'CREATE on table orders': 'Created new order',
  'UPDATE on table orders': 'Updated order status',
  'DELETE on table orders': 'Cancelled order',
  'CREATE on table branches': 'Added new branch',
  'UPDATE on table branches': 'Updated branch information',
  'DELETE on table branches': 'Removed branch',

  // Authentication actions
  'login': 'Signed in to system',
  'logout': 'Signed out of system',
  'password_reset': 'Reset password',
  'profile_update': 'Updated profile',

  // Generic actions
  'view': 'Viewed information',
  'read': 'Accessed data',
  'export': 'Downloaded report',
  'import': 'Uploaded data',
  'backup': 'Created backup',
  'restore': 'Restored data'
} as const

// Icon mapping for actions
export const ACTION_ICONS = {
  'create': UserPlusIcon,
  'add': UserPlusIcon,
  'update': PencilIcon,
  'edit': PencilIcon,
  'delete': TrashIcon,
  'remove': TrashIcon,
  'login': LockClosedIcon,
  'logout': LockClosedIcon,
  'view': EyeIcon,
  'read': EyeIcon,
  'export': ClipboardDocumentListIcon,
  'import': ClipboardDocumentListIcon,
  'order': ShoppingCartIcon,
  'system': ComputerDesktopIcon
} as const

/**
 * Convert technical action to user-friendly description
 */
export function getFriendlyActionDescription(action: string, tableName?: string): string {
  // Try exact match first
  const key = tableName ? `${action.toUpperCase()} on table ${tableName}` : action
  if (key in ACTION_DESCRIPTIONS) {
    return ACTION_DESCRIPTIONS[key as keyof typeof ACTION_DESCRIPTIONS]
  }

  // Fallback to generic actions
  const genericAction = action.toLowerCase()
  switch (genericAction) {
    case 'create':
    case 'insert':
      return tableName ? `Added new ${tableName.replace('_', ' ')}` : 'Added new item'
    case 'update':
    case 'modify':
      return tableName ? `Updated ${tableName.replace('_', ' ')}` : 'Updated information'
    case 'delete':
    case 'remove':
      return tableName ? `Removed ${tableName.replace('_', ' ')}` : 'Removed item'
    case 'login':
      return 'Signed in'
    case 'logout':
      return 'Signed out'
    case 'view':
    case 'read':
      return 'Viewed information'
    default:
      return action.charAt(0).toUpperCase() + action.slice(1).toLowerCase()
  }
}

/**
 * Get appropriate icon for action
 */
export function getActionIcon(action: string): typeof UserPlusIcon {
  const actionKey = action.toLowerCase()

  if (actionKey.includes('create') || actionKey.includes('add')) {
    return ACTION_ICONS.create
  }
  if (actionKey.includes('update') || actionKey.includes('edit')) {
    return ACTION_ICONS.update
  }
  if (actionKey.includes('delete') || actionKey.includes('remove')) {
    return ACTION_ICONS.delete
  }
  if (actionKey.includes('login')) {
    return ACTION_ICONS.login
  }
  if (actionKey.includes('logout')) {
    return ACTION_ICONS.logout
  }
  if (actionKey.includes('view') || actionKey.includes('read')) {
    return ACTION_ICONS.view
  }
  if (actionKey.includes('order')) {
    return ACTION_ICONS.order
  }
  if (actionKey.includes('export') || actionKey.includes('import')) {
    return ACTION_ICONS.export
  }

  return ACTION_ICONS.system
}

/**
 * Format relative time (e.g., "2 hours ago", "Yesterday")
 */
export function getRelativeTime(dateTime: string): string {
  const now = new Date()
  const date = new Date(dateTime)
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / 60000)
  const diffInHours = Math.floor(diffInMinutes / 60)
  const diffInDays = Math.floor(diffInHours / 24)

  if (diffInMinutes < 1) {
    return 'Just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7)
    return `${weeks} week${weeks === 1 ? '' : 's'} ago`
  } else if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30)
    return `${months} month${months === 1 ? '' : 's'} ago`
  } else {
    const years = Math.floor(diffInDays / 365)
    return `${years} year${years === 1 ? '' : 's'} ago`
  }
}

/**
 * Get friendly time with fallback to relative time
 */
export function getFriendlyTime(dateTime: string): string {
  const now = new Date()
  const date = new Date(dateTime)
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 24) {
    return getRelativeTime(dateTime)
  } else if (diffInHours < 48) {
    return `Yesterday at ${date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}`
  } else if (diffInHours < 168) { // Within a week
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
}

/**
 * Group activities by time periods
 */
export function groupActivitiesByTime<T extends { created_at: string }>(
  activities: T[]
): { label: string; items: T[] }[] {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000)
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const groups: { label: string; items: T[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'This Week', items: [] },
    { label: 'This Month', items: [] },
    { label: 'Older', items: [] }
  ]

  activities.forEach(activity => {
    const activityDate = new Date(activity.created_at)

    if (activityDate >= today) {
      groups[0].items.push(activity)
    } else if (activityDate >= yesterday) {
      groups[1].items.push(activity)
    } else if (activityDate >= weekAgo) {
      groups[2].items.push(activity)
    } else if (activityDate >= monthAgo) {
      groups[3].items.push(activity)
    } else {
      groups[4].items.push(activity)
    }
  })

  // Return only groups that have items
  return groups.filter(group => group.items.length > 0)
}

/**
 * Convert role to user-friendly display text
 */
export function getFriendlyRole(role: string): string {
  switch (role.toLowerCase()) {
    case 'super_admin':
      return 'Super Administrator'
    case 'admin':
      return 'Branch Manager'
    case 'manager':
      return 'Branch Manager'
    case 'staff':
      return 'Staff Member'
    case 'customer':
      return 'Customer'
    default:
      return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
  }
}

/**
 * Get user-friendly permissions description
 */
export function getFriendlyPermissions(role: string): string[] {
  switch (role.toLowerCase()) {
    case 'super_admin':
      return [
        'Manage all team members',
        'Access all branches',
        'View system reports',
        'Manage products and inventory',
        'Process customer orders',
        'Export business data',
        'System administration'
      ]
    case 'admin':
    case 'manager':
      return [
        'Manage branch inventory',
        'Process customer orders',
        'View branch reports',
        'Update product information',
        'Manage stock levels',
        'Handle customer inquiries'
      ]
    case 'staff':
      return [
        'View product information',
        'Process basic orders',
        'Update stock levels',
        'Handle customer support'
      ]
    default:
      return ['Basic access permissions']
  }
}

/**
 * Simplify IP address display or location
 */
export function getFriendlyLocation(ipAddress: string | null): string | null {
  if (!ipAddress) return null

  // For internal/private IPs, show as office
  if (ipAddress.startsWith('192.168.') ||
      ipAddress.startsWith('10.') ||
      ipAddress.startsWith('172.')) {
    return 'Office Network'
  }

  // For external IPs, just show "External"
  return 'External Access'
}

/**
 * Format activity for timeline display
 */
export interface TimelineActivity {
  icon: typeof UserPlusIcon
  description: string
  time: string
  user?: string
  location?: string
}

export function formatActivityForTimeline(
  action: string,
  tableName: string | null,
  createdAt: string,
  userName?: string,
  ipAddress?: string | null
): TimelineActivity {
  const friendlyAction = tableName
    ? getFriendlyActionDescription(action, tableName)
    : getFriendlyActionDescription(action)

  const location = getFriendlyLocation(ipAddress)

  return {
    icon: getActionIcon(action),
    description: friendlyAction,
    time: getFriendlyTime(createdAt),
    user: userName,
    location: location || undefined
  }
}

/**
 * Format detailed audit description from change summary or fallback to generic
 */
export function getDetailedAuditDescription(
  changeSummary: string | null,
  action: string,
  tableName: string | null,
  fieldChanges?: Record<string, unknown> | null
): string {
  // If we have a detailed change summary, use it
  if (changeSummary) {
    return changeSummary
  }

  // Fallback to generating from field changes if available
  if (fieldChanges && tableName === 'admins') {
    return generateAdminChangeDescription(action, fieldChanges)
  }

  // Final fallback to generic description
  return getFriendlyActionDescription(action, tableName)
}

/**
 * Generate admin-specific change descriptions from field changes
 */
export function generateAdminChangeDescription(
  action: string,
  fieldChanges: Record<string, unknown>
): string {
  const changes = Object.entries(fieldChanges)

  if (action === 'create') {
    return 'Created new admin account'
  }

  if (action === 'delete') {
    return 'Deleted admin account'
  }

  if (action === 'update' && changes.length > 0) {
    const changeDescriptions: string[] = []

    for (const [field, change] of changes) {
      if (typeof change === 'object' && change !== null && 'old' in change && 'new' in change) {
        const oldValue = (change as { old: unknown; new: unknown }).old
        const newValue = (change as { old: unknown; new: unknown }).new

        switch (field) {
          case 'email':
            changeDescriptions.push(`Changed email from ${oldValue} to ${newValue}`)
            break
          case 'role':
            const oldRole = oldValue === 'super_admin' ? 'Super Admin' : 'Branch Manager'
            const newRole = newValue === 'super_admin' ? 'Super Admin' : 'Branch Manager'
            changeDescriptions.push(`Changed role from ${oldRole} to ${newRole}`)
            break
          case 'full_name':
            changeDescriptions.push(`Changed name from "${oldValue}" to "${newValue}"`)
            break
          case 'is_active':
            changeDescriptions.push(newValue ? 'Activated account' : 'Deactivated account')
            break
          default:
            changeDescriptions.push(`Updated ${field.replace('_', ' ')}`)
            break
        }
      }
    }

    return changeDescriptions.length > 0
      ? changeDescriptions.join('; ')
      : 'Updated admin information'
  }

  return 'Updated admin information'
}

/**
 * Format change context for display
 */
export function formatChangeContext(context: string | null): string | null {
  if (!context) return null

  // Clean up technical context into user-friendly format
  if (context.includes('Admin account modification by')) {
    const parts = context.split(' by ')
    if (parts.length > 1) {
      return `Modified by ${parts[1]}`
    }
  }

  if (context === 'Admin account creation') {
    return 'Account created'
  }

  if (context === 'Admin account deletion') {
    return 'Account deleted'
  }

  if (context === 'Automatic login timestamp update') {
    return 'Login activity'
  }

  return context
}