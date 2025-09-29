'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  UserGroupIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ChartBarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { DashboardService, type DashboardMetrics, type RecentActivity } from '@/lib/services/dashboardService'
import MetricCard from '../components/MetricCard'
import AlertCard from '../components/AlertCard'

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { addToast } = useToast()

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load dashboard metrics and recent activity in parallel
      const [metrics, activity] = await Promise.all([
        DashboardService.getDashboardMetrics(),
        DashboardService.getRecentActivity(10)
      ])

      setDashboardData(metrics)
      setRecentActivity(activity)

    } catch (error) {
      console.error('Error loading dashboard data:', error)
      addToast({
        type: 'error',
        title: 'Dashboard Error',
        message: 'Failed to load dashboard data. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleRefresh = () => {
    loadDashboardData()
    addToast({
      type: 'success',
      title: 'Dashboard Refreshed',
      message: 'Dashboard data has been updated successfully.',
    })
  }

  const quickActions = [
    {
      name: 'Add Product',
      description: 'Add new product to inventory',
      href: '/admin/products',
      icon: CubeIcon,
      color: 'primary' as const
    },
    {
      name: 'Process Orders',
      description: 'Review pending orders',
      href: '/admin/orders',
      icon: ClipboardDocumentListIcon,
      color: 'secondary' as const
    },
    {
      name: 'Manage Inventory',
      description: 'Update stock levels',
      href: '/admin/inventory',
      icon: UserGroupIcon,
      color: 'success' as const
    },
    {
      name: 'View Alerts',
      description: 'Check system alerts',
      href: '/admin/alerts',
      icon: ExclamationTriangleIcon,
      color: 'warning' as const
    }
  ]

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome to InCloud Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your frozen food inventory and operations with real-time analytics
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={isLoading}
              className="flex items-center"
            >
              <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Active Products"
          value={dashboardData?.activeProducts || 0}
          change={{ value: dashboardData?.productChange || 0, period: 'this month' }}
          icon={<CubeIcon className="w-5 h-5" />}
          color="primary"
          isLoading={isLoading}
        />
        <MetricCard
          title="Active Orders"
          value={dashboardData?.activeOrders || 0}
          change={{ value: dashboardData?.orderChange || 0, period: 'this month' }}
          icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
          color="secondary"
          isLoading={isLoading}
        />
        <MetricCard
          title="Low Stock Items"
          value={dashboardData?.lowStockItems || 0}
          icon={<ExclamationTriangleIcon className="w-5 h-5" />}
          color="warning"
          isLoading={isLoading}
        />
        <MetricCard
          title="Critical Alerts"
          value={dashboardData?.criticalAlerts || 0}
          icon={<ExclamationTriangleIcon className="w-5 h-5" />}
          color="warning"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <Link
                    key={action.name}
                    href={action.href}
                    className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 group"
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        action.color === 'primary' ? 'bg-primary-50 text-primary-600' :
                        action.color === 'secondary' ? 'bg-blue-50 text-blue-600' :
                        action.color === 'success' ? 'bg-green-50 text-green-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900 group-hover:text-gray-700">
                        {action.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {action.description}
                      </div>
                    </div>
                    <PlusIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                  </Link>
                )
              })}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Link href="/admin/alerts">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'order' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'alert' ? (
                        activity.severity === 'critical' ? 'bg-red-100 text-red-600' :
                        activity.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                        'bg-yellow-100 text-yellow-600'
                      ) : 'bg-gray-100 text-gray-600'
                    }`}>
                      {activity.type === 'order' ? (
                        <ClipboardDocumentListIcon className="w-4 h-4" />
                      ) : (
                        <ExclamationTriangleIcon className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {activity.description}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}