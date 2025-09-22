'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  UserGroupIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import MetricCard from '../components/MetricCard'
import AlertCard from '../components/AlertCard'

interface DashboardData {
  totalAdmins: number
  totalProducts: number
  activeOrders: number
  lowStockAlerts: number
  adminChange: number
  productChange: number
  orderChange: number
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [recentAlerts, setRecentAlerts] = useState<Array<{
    id: number
    title: string
    message: string
    type: 'info' | 'success' | 'warning' | 'error'
    timestamp: string
    isAcknowledged: boolean
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading dashboard data
    // In real implementation, this would fetch from Supabase
    const loadDashboardData = async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setDashboardData({
        totalAdmins: 5,
        totalProducts: 248,
        activeOrders: 23,
        lowStockAlerts: 7,
        adminChange: 0,
        productChange: 12,
        orderChange: -5
      })

      setRecentAlerts([
        {
          id: 1,
          title: 'Low Stock Alert',
          message: 'Frozen Chicken Wings (Premium) has only 5 units left across all branches.',
          type: 'warning' as const,
          timestamp: '2 minutes ago',
          isAcknowledged: false
        },
        {
          id: 2,
          title: 'Product Expiring Soon',
          message: 'Batch #FT2024-003 of Frozen Fish Fillet expires in 3 days.',
          type: 'warning' as const,
          timestamp: '15 minutes ago',
          isAcknowledged: true
        },
        {
          id: 3,
          title: 'New Order Received',
          message: 'Order #ORD-2024-0156 received from Customer Maria Santos.',
          type: 'info' as const,
          timestamp: '1 hour ago',
          isAcknowledged: false
        }
      ])

      setIsLoading(false)
    }

    loadDashboardData()
  }, [])

  const quickActions = [
    {
      name: 'Add New Admin',
      description: 'Create a new admin account',
      href: '/dashboard/admin-users?action=create',
      icon: UserGroupIcon,
      color: 'primary' as const
    },
    {
      name: 'Add Product',
      description: 'Add new product to inventory',
      href: '/dashboard/products?action=create',
      icon: CubeIcon,
      color: 'secondary' as const
    },
    {
      name: 'Process Orders',
      description: 'Review pending orders',
      href: '/dashboard/orders?status=pending',
      icon: ClipboardDocumentListIcon,
      color: 'success' as const
    },
    {
      name: 'View Analytics',
      description: 'Generate reports and insights',
      href: '/dashboard/analytics',
      icon: ChartBarIcon,
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
          <div className="text-right">
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="font-medium text-gray-900">{new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Admins"
          value={dashboardData?.totalAdmins || 0}
          change={{ value: dashboardData?.adminChange || 0, period: 'this month' }}
          icon={<UserGroupIcon className="w-5 h-5" />}
          color="primary"
          isLoading={isLoading}
        />
        <MetricCard
          title="Products"
          value={dashboardData?.totalProducts || 0}
          change={{ value: dashboardData?.productChange || 0, period: 'this month' }}
          icon={<CubeIcon className="w-5 h-5" />}
          color="secondary"
          isLoading={isLoading}
        />
        <MetricCard
          title="Active Orders"
          value={dashboardData?.activeOrders || 0}
          change={{ value: dashboardData?.orderChange || 0, period: 'this week' }}
          icon={<ClipboardDocumentListIcon className="w-5 h-5" />}
          color="success"
          isLoading={isLoading}
        />
        <MetricCard
          title="Low Stock Alerts"
          value={dashboardData?.lowStockAlerts || 0}
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

        {/* Recent Alerts */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Recent Alerts</h2>
              <Link href="/dashboard/alerts">
                <Button variant="ghost" size="sm">View all</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    title={alert.title}
                    message={alert.message}
                    type={alert.type}
                    timestamp={alert.timestamp}
                    isAcknowledged={alert.isAcknowledged}
                    onAcknowledge={() => {
                      setRecentAlerts(prev =>
                        prev.map(a => a.id === alert.id ? { ...a, isAcknowledged: true } : a)
                      )
                    }}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ExclamationTriangleIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No recent alerts</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <div className="font-medium text-gray-900">Database</div>
              <div className="text-sm text-gray-500">All systems operational</div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <div className="font-medium text-gray-900">Real-time Sync</div>
              <div className="text-sm text-gray-500">Connected to all branches</div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <div className="font-medium text-gray-900">Analytics Engine</div>
              <div className="text-sm text-gray-500">Processing data normally</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}