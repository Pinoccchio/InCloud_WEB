'use client'

import { useState, useEffect } from 'react'
import {
  UserGroupIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  CubeIcon
} from '@heroicons/react/24/outline'
import { LoadingSpinner } from '@/components/ui'
import {
  SuperAdminDashboardService,
  type SuperAdminMetrics,
  type AdminActivity
} from '@/lib/services/superAdminDashboardService'

export default function SuperAdminDashboard() {
  const [metrics, setMetrics] = useState<SuperAdminMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<AdminActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [metricsData, activityData] = await Promise.all([
        SuperAdminDashboardService.getSuperAdminMetrics(),
        SuperAdminDashboardService.getRecentAdminActivity(10)
      ])

      setMetrics(metricsData)
      setRecentActivity(activityData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const StatCard = ({
    title,
    value,
    icon,
    color,
    subtitle
  }: {
    title: string
    value: number | string
    icon: React.ReactNode
    color: string
    subtitle?: string
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  )

  const getActivityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-blue-500'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 min-w-0 max-w-full">
      {/* Admin Statistics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total Admins"
            value={metrics?.totalAdmins || 0}
            icon={<UserGroupIcon className="w-6 h-6 text-blue-600" />}
            color="bg-blue-100"
            subtitle={`${metrics?.activeAdmins || 0} active`}
          />
          <StatCard
            title="Super Admins"
            value={metrics?.superAdmins || 0}
            icon={<ShieldCheckIcon className="w-6 h-6 text-red-600" />}
            color="bg-red-100"
            subtitle="System administrators"
          />
          <StatCard
            title="Regular Admins"
            value={metrics?.regularAdmins || 0}
            icon={<UserGroupIcon className="w-6 h-6 text-green-600" />}
            color="bg-green-100"
            subtitle="Operational staff"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {recentActivity.length > 0 ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 py-2 border-b border-gray-100 last:border-0">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getActivityColor(activity.severity)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 font-medium">
                    {activity.action.toUpperCase()} on {activity.tableName}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                    {activity.changeSummary}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">{activity.adminName}</span> ({activity.adminRole}) • {formatTimestamp(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
          )}
        </div>
      </div>

      {/* Admin Management Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShieldCheckIcon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics?.superAdmins || 0}</p>
              <p className="text-sm font-medium text-gray-900">Super Admins</p>
              <p className="text-xs text-gray-500 mt-1">System administrators</p>
            </div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserGroupIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics?.regularAdmins || 0}</p>
              <p className="text-sm font-medium text-gray-900">Regular Admins</p>
              <p className="text-xs text-gray-500 mt-1">Operational staff</p>
            </div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {metrics && metrics.totalAdmins > 0
                  ? Math.round((metrics.activeAdmins / metrics.totalAdmins) * 100)
                  : 0}%
              </p>
              <p className="text-sm font-medium text-gray-900">Active Rate</p>
              <p className="text-xs text-gray-500 mt-1">Admin engagement</p>
            </div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CubeIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalCustomers || 0}</p>
              <p className="text-sm font-medium text-gray-900">Customers</p>
              <p className="text-xs text-gray-500 mt-1">Total registered</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}