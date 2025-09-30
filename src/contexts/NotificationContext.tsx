'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { supabase } from '@/lib/supabase/auth'
import { getMainBranchId } from '@/lib/constants/branch'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

export interface AdminNotification {
  id: string
  type: 'order' | 'alert' | 'system' | 'inventory'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  data?: Record<string, unknown>
  isRead: boolean
  isAcknowledged: boolean
  isResolved: boolean
  acknowledgedAt?: string
  resolvedAt?: string
  createdAt: string
  relatedId?: string // order_id, product_id, etc.
}

interface NotificationContextType {
  notifications: AdminNotification[]
  unreadCount: number
  criticalCount: number
  isLoading: boolean

  // Actions
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  acknowledge: (id: string) => Promise<void>
  resolve: (id: string) => Promise<void>
  clearNotification: (id: string) => void
  refreshNotifications: () => Promise<void>

  // Real-time status
  isConnected: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { admin, isAuthenticated } = useAuth()
  const { addToast } = useToast()

  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !admin) return

    setIsLoading(true)
    try {
      const branchId = await getMainBranchId()

      // Load notifications from unified table
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select(`
          id,
          type,
          severity,
          title,
          message,
          admin_is_read,
          is_acknowledged,
          is_resolved,
          acknowledged_at,
          resolved_at,
          created_at,
          related_entity_type,
          related_entity_id,
          metadata,
          action_url
        `)
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (notificationsError) throw notificationsError

      // Transform notifications to AdminNotification format
      const allNotifications: AdminNotification[] = (notificationsData || []).map(notification => ({
        id: notification.id,
        type: notification.type,
        severity: notification.severity,
        title: notification.title,
        message: notification.message,
        data: notification.metadata || {},
        isRead: notification.admin_is_read || false,
        isAcknowledged: notification.is_acknowledged || false,
        isResolved: notification.is_resolved || false,
        acknowledgedAt: notification.acknowledged_at,
        resolvedAt: notification.resolved_at,
        createdAt: notification.created_at,
        relatedId: notification.related_entity_id,
      }))

      setNotifications(allNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
      addToast({
        type: 'error',
        title: 'Notification Error',
        message: 'Failed to load notifications'
      })
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated, admin, addToast])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!isAuthenticated || !admin) {
      setIsConnected(false)
      return
    }

    let notificationsChannel: unknown

    const setupSubscriptions = async () => {
      try {
        const branchId = await getMainBranchId()
        console.log('Setting up notification subscription for branch:', branchId)

        // Subscribe to notifications table with unique channel name
        const channelName = `notifications-${admin.id}-${branchId}-${Date.now()}`
        notificationsChannel = supabase
          .channel(channelName, {
            config: {
              presence: {
                key: `admin-${admin.id}`
              }
            }
          })
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notifications',
              filter: `branch_id=eq.${branchId}`
            },
            async (payload) => {
              console.log('🔔 New notification detected:', payload.new)

              const newNotification = payload.new
              const notification: AdminNotification = {
                id: newNotification.id,
                type: newNotification.type,
                severity: newNotification.severity,
                title: newNotification.title,
                message: newNotification.message,
                data: newNotification.metadata || {},
                isRead: false,
                isAcknowledged: false,
                isResolved: false,
                createdAt: newNotification.created_at,
                relatedId: newNotification.related_entity_id,
              }

              setNotifications(prev => [notification, ...prev])

              // Show toast for critical/high severity notifications
              if (newNotification.severity === 'critical' || newNotification.severity === 'high') {
                addToast({
                  type: newNotification.severity === 'critical' ? 'error' :
                        newNotification.severity === 'high' ? 'warning' : 'info',
                  title: newNotification.title,
                  message: newNotification.message,
                  duration: newNotification.severity === 'critical' ? 0 : 8000,
                  action: newNotification.action_url ? {
                    label: 'View',
                    onClick: () => {
                      window.location.href = newNotification.action_url
                    }
                  } : undefined
                })
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notifications',
              filter: `branch_id=eq.${branchId}`
            },
            async (payload) => {
              console.log('🔄 Notification updated:', payload.new.id)
              const updatedNotification = payload.new
              setNotifications(prev =>
                prev.map(notif =>
                  notif.id === updatedNotification.id
                    ? {
                        ...notif,
                        isRead: updatedNotification.admin_is_read || notif.isRead,
                        isAcknowledged: updatedNotification.is_acknowledged || notif.isAcknowledged,
                        isResolved: updatedNotification.is_resolved || notif.isResolved,
                        acknowledgedAt: updatedNotification.acknowledged_at || notif.acknowledgedAt,
                        resolvedAt: updatedNotification.resolved_at || notif.resolvedAt
                      }
                    : notif
                )
              )
            }
          )
          .subscribe((status, err) => {
            console.log('📡 Subscription status changed:', status)
            if (err) console.error('❌ Subscription error:', err)

            setIsConnected(status === 'SUBSCRIBED')

            if (status === 'CLOSED') {
              console.log('🔄 Connection closed, attempting to reconnect...')
              // Attempt to reconnect after a delay
              setTimeout(() => {
                setupSubscriptions()
              }, 5000)
            }
          })

        console.log('✅ Notification subscription set up successfully')

      } catch (error) {
        console.error('❌ Error setting up subscriptions:', error)
        setIsConnected(false)

        // Retry setup after delay
        setTimeout(() => {
          setupSubscriptions()
        }, 10000)
      }
    }

    // Initial setup
    setupSubscriptions()
    loadNotifications()

    return () => {
      console.log('🧹 Cleaning up notification subscription')
      if (notificationsChannel) {
        supabase.removeChannel(notificationsChannel)
      }
      setIsConnected(false)
    }
  }, [isAuthenticated, admin, loadNotifications, addToast])

  // Actions
  const markAsRead = async (id: string) => {
    try {
      // Update local state immediately
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      )

      // Update database - use admin_is_read for admin users
      const { error } = await supabase
        .from('notifications')
        .update({ admin_is_read: true })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error marking notification as read:', error)
      // Revert local state on error
      loadNotifications()
    }
  }

  const markAllAsRead = async () => {
    try {
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      )

      // Update all notifications in database - use admin_is_read for admin users
      const notificationIds = notifications
        .filter(notif => !notif.isRead)
        .map(notif => notif.id)

      if (notificationIds.length > 0) {
        const { error } = await supabase
          .from('notifications')
          .update({ admin_is_read: true })
          .in('id', notificationIds)

        if (error) throw error
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      loadNotifications()
    }
  }

  const acknowledge = async (id: string) => {
    try {
      // Update local state immediately
      const now = new Date().toISOString()
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isAcknowledged: true, isRead: true, acknowledgedAt: now } : notif
        )
      )

      // Update database - use admin_is_read for admin users
      const { error } = await supabase
        .from('notifications')
        .update({
          is_acknowledged: true,
          admin_is_read: true,
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: admin?.id
        })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error acknowledging notification:', error)
      loadNotifications()
    }
  }

  const resolve = async (id: string) => {
    try {
      // Update local state immediately
      const now = new Date().toISOString()
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isResolved: true, resolvedAt: now } : notif
        )
      )

      // Update database
      const { error } = await supabase
        .from('notifications')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolved_by: admin?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error resolving notification:', error)
      loadNotifications()
    }
  }

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id))
  }

  const refreshNotifications = async () => {
    await loadNotifications()
  }

  // Computed values
  const unreadCount = notifications.filter(n => !n.isRead).length
  const criticalCount = notifications.filter(n =>
    n.severity === 'critical' && !n.isAcknowledged
  ).length

  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    criticalCount,
    isLoading,
    isConnected,
    markAsRead,
    markAllAsRead,
    acknowledge,
    resolve,
    clearNotification,
    refreshNotifications,
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}