'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase/auth'
import { getMainBranchId } from '@/lib/constants/branch'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

export interface AdminNotification {
  id: string
  type: 'order' | 'alert' | 'system' | 'inventory' | 'expiration' | 'stock'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  data?: Record<string, unknown>
  actionUrl?: string
  isRead: boolean
  isAcknowledged: boolean
  isResolved: boolean
  acknowledgedAt?: string
  resolvedAt?: string
  createdAt: string
  relatedId?: string
}

interface NotificationContextType {
  notifications: AdminNotification[]
  unreadCount: number
  criticalCount: number
  isLoading: boolean
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  acknowledge: (id: string) => Promise<void>
  resolve: (id: string) => Promise<void>
  clearNotification: (id: string) => void
  refreshNotifications: () => Promise<void>
  isConnected: boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

function dedupeNotifications(notifications: AdminNotification[]): AdminNotification[] {
  const seen = new Set<string>()

  return notifications.filter((notification) => {
    if (seen.has(notification.id)) return false
    seen.add(notification.id)
    return true
  })
}

async function syncExpiredNotifications() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return

  await fetch('/api/notifications/expired-products', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`
    }
  })
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { admin, isAuthenticated } = useAuth()
  const { addToast } = useToast()

  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const notificationsChannelRef = useRef<RealtimeChannel | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const displayedToastIdsRef = useRef<Set<string>>(new Set())

  const clearReconnectTimer = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }

  const removeNotificationsChannel = () => {
    if (notificationsChannelRef.current) {
      supabase.removeChannel(notificationsChannelRef.current)
      notificationsChannelRef.current = null
    }
  }

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated || !admin) return

    setIsLoading(true)
    try {
      await syncExpiredNotifications()
      const branchId = await getMainBranchId()

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
          related_entity_id,
          metadata,
          action_url
        `)
        .eq('branch_id', branchId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (notificationsError) throw notificationsError

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
        actionUrl: notification.action_url,
      }))

      setNotifications(dedupeNotifications(allNotifications))
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

  useEffect(() => {
    if (!isAuthenticated || !admin) {
      clearReconnectTimer()
      removeNotificationsChannel()
      setIsConnected(false)
      return
    }

    let isDisposed = false

    const setupSubscriptions = async () => {
      try {
        if (isDisposed) return

        const branchId = await getMainBranchId()
        removeNotificationsChannel()

        const channelName = `notifications-${admin.id}-${branchId}-${Date.now()}`
        const nextChannel = supabase
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
              const newNotification = payload.new

              if (!newNotification?.id) {
                console.error('Invalid notification payload - missing ID:', payload)
                return
              }

              const notification: AdminNotification = {
                id: newNotification.id,
                type: newNotification.type || 'system',
                severity: newNotification.severity || 'medium',
                title: newNotification.title || 'Notification',
                message: newNotification.message || '',
                data: (newNotification.metadata && typeof newNotification.metadata === 'object')
                  ? newNotification.metadata
                  : {},
                isRead: newNotification.admin_is_read === true,
                isAcknowledged: newNotification.is_acknowledged === true,
                isResolved: newNotification.is_resolved === true,
                acknowledgedAt: newNotification.acknowledged_at,
                resolvedAt: newNotification.resolved_at,
                createdAt: newNotification.created_at || new Date().toISOString(),
                relatedId: newNotification.related_entity_id,
                actionUrl: newNotification.action_url,
              }

              setNotifications(prev => {
                if (prev.some(existing => existing.id === notification.id)) {
                  return prev
                }

                return dedupeNotifications([notification, ...prev]).slice(0, 50)
              })

              const shouldShowToast =
                (newNotification.severity === 'critical' || newNotification.severity === 'high') &&
                !displayedToastIdsRef.current.has(notification.id)

              if (shouldShowToast) {
                displayedToastIdsRef.current.add(notification.id)
                addToast({
                  type: newNotification.severity === 'critical' ? 'error' : 'warning',
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
              const updatedNotification = payload.new

              if (!updatedNotification?.id) {
                console.error('Invalid update payload - missing ID:', payload)
                return
              }

              setNotifications(prev =>
                prev.map(notif =>
                  notif.id === updatedNotification.id
                    ? {
                        ...notif,
                        isRead: updatedNotification.admin_is_read === true || notif.isRead,
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
          .on(
            'postgres_changes',
            {
              event: 'DELETE',
              schema: 'public',
              table: 'notifications',
              filter: `branch_id=eq.${branchId}`
            },
            async (payload) => {
              const deletedNotification = payload.old

              if (!deletedNotification?.id) {
                console.error('Invalid delete payload - missing ID:', payload)
                return
              }

              setNotifications(prev =>
                prev.filter(notif => notif.id !== deletedNotification.id)
              )
            }
          )
          .subscribe((status, err) => {
            if (err) {
              console.error('Subscription error:', err)
            }

            if (isDisposed) return

            setIsConnected(status === 'SUBSCRIBED')

            if (status === 'CLOSED' && !reconnectTimeoutRef.current) {
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null
                setupSubscriptions()
              }, 5000)
            }
          })

        notificationsChannelRef.current = nextChannel
      } catch (error) {
        console.error('Error setting up subscriptions:', error)
        setIsConnected(false)

        if (!isDisposed && !reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null
            setupSubscriptions()
          }, 10000)
        }
      }
    }

    setupSubscriptions()
    loadNotifications()

    return () => {
      isDisposed = true
      clearReconnectTimer()
      removeNotificationsChannel()
      setIsConnected(false)
    }
  }, [isAuthenticated, admin, loadNotifications, addToast])

  const markAsRead = async (id: string) => {
    try {
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      )

      const { error } = await supabase
        .from('notifications')
        .update({ admin_is_read: true })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error marking notification as read:', error)
      loadNotifications()
    }
  }

  const markAllAsRead = async () => {
    try {
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      )

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
      const now = new Date().toISOString()
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isAcknowledged: true, isRead: true, acknowledgedAt: now } : notif
        )
      )

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
      const now = new Date().toISOString()
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === id ? { ...notif, isResolved: true, resolvedAt: now } : notif
        )
      )

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
    await syncExpiredNotifications()
    await loadNotifications()
  }

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
