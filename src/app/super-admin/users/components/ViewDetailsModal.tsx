'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import {
  XMarkIcon,
  EyeIcon,
  UserIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ClockIcon,
  CheckIcon,
  XMarkIcon as CrossIcon
} from '@heroicons/react/24/outline'
import { Button, LoadingSpinner } from '@/components/ui'
import { useToastActions } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/auth'
import {
  getFriendlyRole,
  getFriendlyTime,
  getRelativeTime
} from '@/lib/user-friendly-utils'

interface AdminUser {
  id: string
  user_id: string
  full_name: string
  email: string
  role: 'admin' | 'super_admin'
  branches: string[]
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

interface AdminDetails {
  total_actions: number
  last_action: string | null
  login_count: number
  recent_activity: {
    action: string
    table_name: string
    change_summary: string | null
    created_at: string
  }[]
}

interface ViewDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  admin: AdminUser | null
}

// Cache for admin details to prevent repeated API calls
const detailsCache = new Map<string, { data: AdminDetails, timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const ViewDetailsModal = React.memo<ViewDetailsModalProps>(({ isOpen, onClose, admin }) => {
  const [adminDetails, setAdminDetails] = useState<AdminDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { error } = useToastActions()
  const { admin: currentAdmin } = useAuth()

  // Memoized cache key
  const cacheKey = useMemo(() => admin?.id || null, [admin?.id])

  // Check if data exists in cache
  const getCachedData = useCallback((key: string): AdminDetails | null => {
    const cached = detailsCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    return null
  }, [])

  // Store data in cache
  const setCachedData = useCallback((key: string, data: AdminDetails) => {
    detailsCache.set(key, { data, timestamp: Date.now() })
  }, [])

  const loadAdminDetails = useCallback(async () => {
    if (!admin?.id || !cacheKey) return

    try {
      // Check cache first
      const cachedData = getCachedData(cacheKey)
      if (cachedData) {
        setAdminDetails(cachedData)
        return
      }

      setIsLoading(true)

      // Check permissions
      if (!currentAdmin || currentAdmin.role !== 'super_admin') {
        throw new Error('Unauthorized: Super admin access required')
      }

      // Get audit log statistics
      const [totalActionsQuery, recentActivityQuery, loginStatsQuery] = await Promise.all([
        // Total actions count
        supabase
          .from('audit_logs')
          .select('id', { count: 'exact' })
          .eq('admin_id', admin.id),

        // Recent activity (last 5 actions for simplified view)
        supabase
          .from('audit_logs')
          .select('action, table_name, change_summary, created_at')
          .eq('admin_id', admin.id)
          .order('created_at', { ascending: false })
          .limit(5),

        // Login statistics
        supabase
          .from('audit_logs')
          .select('created_at')
          .eq('admin_id', admin.id)
          .eq('action', 'login')
          .order('created_at', { ascending: false })
      ])

      if (totalActionsQuery.error) throw totalActionsQuery.error
      if (recentActivityQuery.error) throw recentActivityQuery.error
      if (loginStatsQuery.error) throw loginStatsQuery.error

      // Get most recent action
      const lastActionQuery = await supabase
        .from('audit_logs')
        .select('created_at')
        .eq('admin_id', admin.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (lastActionQuery.error) throw lastActionQuery.error

      const details: AdminDetails = {
        total_actions: totalActionsQuery.count || 0,
        last_action: lastActionQuery.data?.[0]?.created_at || null,
        login_count: loginStatsQuery.data?.length || 0,
        recent_activity: recentActivityQuery.data || []
      }

      setAdminDetails(details)
      setCachedData(cacheKey, details)

    } catch (err) {
      console.error('Error loading admin details:', err)
      error(
        'Load Failed',
        err instanceof Error ? err.message : 'Failed to load admin details'
      )
    } finally {
      setIsLoading(false)
    }
  }, [admin?.id, cacheKey, currentAdmin, error, getCachedData, setCachedData])

  const formatDateOnly = useCallback((dateTime: string) => {
    return new Date(dateTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }, [])

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && admin?.id) {
      loadAdminDetails()
    }
  }, [isOpen, admin?.id, loadAdminDetails])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAdminDetails(null)
    }
  }, [isOpen])

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose()
    }
  }, [isLoading, onClose])

  if (!admin) return null

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all mx-4">
            {/* Header */}
            <div className="bg-white px-4 sm:px-6 pt-5 pb-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <EyeIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-semibold text-gray-900">
                      Team Member Details
                    </DialogTitle>
                    <p className="text-sm text-gray-900">
                      Profile and activity overview
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 py-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner size="lg" />
                  <span className="ml-3 text-gray-900 text-base font-medium">Loading team member details...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Profile Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                      <UserIcon className="w-5 h-5 mr-2" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-16 w-16 rounded-full flex items-center justify-center ${
                          admin.role === 'super_admin'
                            ? 'bg-gradient-to-br from-red-500 to-red-600'
                            : 'bg-blue-500'
                        }`}>
                          <span className="text-lg font-medium text-white">
                            {admin.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <p className="text-base font-semibold text-gray-900">{admin.full_name}</p>
                          <p className="text-sm text-gray-900 font-medium">
                            {getFriendlyRole(admin.role)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-900">
                          <EnvelopeIcon className="w-4 h-4 mr-3 text-gray-700" />
                          <span className="font-medium">Email:</span>
                          <span className="ml-2">{admin.email}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-900">
                          <ShieldCheckIcon className="w-4 h-4 mr-3 text-gray-700" />
                          <span className="font-medium">Status:</span>
                          <div className="ml-2 flex items-center">
                            {admin.is_active ? (
                              <>
                                <CheckIcon className="w-4 h-4 text-green-600 mr-1" />
                                <span className="text-green-800 font-medium">Active</span>
                              </>
                            ) : (
                              <>
                                <CrossIcon className="w-4 h-4 text-red-600 mr-1" />
                                <span className="text-red-800 font-medium">Inactive</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Account Timeline */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                      <CalendarIcon className="w-5 h-5 mr-2" />
                      Activity
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-900">Member since:</span>
                        <span className="text-sm text-gray-900">{formatDateOnly(admin.created_at)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-900">Last seen:</span>
                        <span className="text-sm text-gray-900">
                          {admin.last_login ? getRelativeTime(admin.last_login) : 'Never signed in'}
                        </span>
                      </div>
                      {adminDetails && (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-900">Total activities:</span>
                            <span className="text-sm text-gray-900 font-mono">{adminDetails.total_actions}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-gray-900">Login sessions:</span>
                            <span className="text-sm text-gray-900 font-mono">{adminDetails.login_count}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>


                  {/* Recent Activity */}
                  {adminDetails && adminDetails.recent_activity.length > 0 && (
                    <div className="bg-yellow-50 rounded-lg p-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center">
                        <ClockIcon className="w-5 h-5 mr-2" />
                        Recent Activity
                      </h3>
                      <div className="space-y-3">
                        {adminDetails.recent_activity.map((activity, index) => {
                          // Use detailed change summary if available, otherwise fall back to generic description
                          const friendlyDescription = activity.change_summary
                            ? activity.change_summary
                            : activity.table_name
                              ? `${activity.action === 'create' ? 'Added' : activity.action === 'update' ? 'Updated' : activity.action === 'delete' ? 'Removed' : 'Accessed'} ${activity.table_name.replace('_', ' ')}`
                              : activity.action === 'login' ? 'Signed in' : activity.action === 'logout' ? 'Signed out' : activity.action

                          return (
                            <div key={index} className="flex justify-between items-start p-3 bg-white rounded-lg">
                              <span className="text-sm text-gray-900 font-medium flex-1 pr-4">
                                {friendlyDescription}
                              </span>
                              <span className="text-sm text-gray-700 flex-shrink-0">
                                {getFriendlyTime(activity.created_at)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <Button
                onClick={handleClose}
                disabled={isLoading}
                className="min-w-[80px] text-base"
              >
                Close
              </Button>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
})

ViewDetailsModal.displayName = 'ViewDetailsModal'