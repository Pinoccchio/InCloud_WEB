'use client'

import React, { useState, useRef, useEffect } from 'react'
import {
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  TruckIcon,
  ShoppingCartIcon,
  Cog6ToothIcon,
  EyeIcon,
  BellSlashIcon
} from '@heroicons/react/24/outline'
import { useNotifications } from '@/contexts/NotificationContext'

interface NotificationDropdownProps {
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
}

export default function NotificationDropdown({ isOpen, onToggle, onClose }: NotificationDropdownProps) {
  const {
    notifications,
    unreadCount,
    criticalCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    acknowledge,
    clearNotification,
    refreshNotifications
  } = useNotifications()

  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead
      case 'critical':
        return notification.severity === 'critical' && !notification.isAcknowledged
      default:
        return true
    }
  }).slice(0, 20) // Limit to 20 most recent

  const getSeverityIcon = (type: string, severity: string) => {
    if (type === 'order') return <ShoppingCartIcon className="w-4 h-4" />
    if (type === 'inventory') return <TruckIcon className="w-4 h-4" />
    if (severity === 'critical') return <ExclamationTriangleIcon className="w-4 h-4" />
    return <InformationCircleIcon className="w-4 h-4" />
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-blue-600 bg-blue-50'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  const [loadingStates, setLoadingStates] = useState<Set<string>>(new Set())

  const handleNotificationClick = async (notification: Record<string, unknown>) => {
    // Add loading state for instant feedback
    if (!notification.isRead) {
      setLoadingStates(prev => new Set([...prev, notification.id as string]))
      try {
        await markAsRead(notification.id as string)
      } finally {
        setLoadingStates(prev => {
          const newSet = new Set(prev)
          newSet.delete(notification.id as string)
          return newSet
        })
      }
    }

    // Navigate to related page based on notification type
    if (notification.type === 'order' && notification.relatedId) {
      window.location.href = '/admin/orders'
    } else if (notification.type === 'alert' || notification.type === 'inventory') {
      window.location.href = '/admin/alerts'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <button
        onClick={onToggle}
        className={`relative p-2 rounded-lg transition-all duration-200 ${
          isOpen
            ? 'text-primary-600 bg-primary-50'
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        }`}
        aria-label={`Notifications ${
          unreadCount > 0
            ? `(${unreadCount} unread${criticalCount > 0 ? `, ${criticalCount} critical` : ''})`
            : !isConnected ? '(connection issue)' : ''
        }`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onKeyDown={(e) => {
          if (e.key === 'Escape' && isOpen) {
            onClose()
          }
        }}
      >
        <BellIcon className="w-5 h-5" />

        {/* Smart Notification Badge */}
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white rounded-full shadow-lg border-2 border-white ${
            criticalCount > 0
              ? 'bg-red-600 animate-pulse'
              : 'bg-red-500'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection Issues Badge (only when disconnected and no notifications) */}
        {!isConnected && unreadCount === 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-3 h-3 bg-yellow-500 rounded-full animate-pulse border-2 border-white shadow-lg" title="Connection issue">
            <span className="sr-only">Connection issue</span>
          </span>
        )}

      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-96 sm:w-80 md:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] flex flex-col
                     max-sm:fixed max-sm:inset-x-4 max-sm:top-16 max-sm:w-auto max-sm:max-h-[calc(100vh-5rem)]"
          role="dialog"
          aria-label="Notification panel"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onClose()
            }
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <BellIcon className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              {!isConnected && (
                <span className="flex items-center text-xs text-yellow-700 bg-yellow-100 px-2 py-1 rounded-md border border-yellow-200">
                  <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Reconnecting...
                </span>
              )}
              {isConnected && (
                <span className="flex items-center text-xs text-green-700 bg-green-100 px-2 py-1 rounded-md border border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  Connected
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshNotifications}
                disabled={isLoading}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Refresh notifications"
              >
                <svg
                  className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-gray-200">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'critical', label: 'Critical', count: criticalCount }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as 'all' | 'unread' | 'critical')}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1 text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Actions Bar */}
          {filteredNotifications.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-sm text-gray-600">
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-sm text-gray-600">Loading...</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <BellSlashIcon className="w-12 h-12 mb-2 text-gray-300" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-all duration-200 cursor-pointer relative ${
                      !notification.isRead ? 'bg-blue-50 border-l-4 border-primary-500' : ''
                    } ${loadingStates.has(notification.id) ? 'opacity-75' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        getSeverityColor(notification.severity)
                      }`}>
                        {loadingStates.has(notification.id) ? (
                          <svg className="w-4 h-4 animate-spin text-gray-600" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          getSeverityIcon(notification.type, notification.severity)
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-500 ml-2">
                            {formatTime(notification.createdAt)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>

                        {/* Severity Badge */}
                        <div className="flex items-center justify-between mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            notification.severity === 'critical' ? 'bg-red-100 text-red-800' :
                            notification.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                            notification.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {notification.severity}
                          </span>

                          {/* Actions */}
                          <div className="flex items-center space-x-2">
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                                title="Mark as read"
                              >
                                <EyeIcon className="w-3 h-3" />
                              </button>
                            )}

                            {!notification.isAcknowledged && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  acknowledge(notification.id)
                                }}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="Acknowledge"
                              >
                                <CheckIcon className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                clearNotification(notification.id)
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Dismiss"
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 p-3">
            <button
              onClick={() => {
                onClose()
                window.location.href = '/admin/alerts'
              }}
              className="w-full text-center text-sm text-primary-600 hover:text-primary-800 font-medium py-2"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  )
}