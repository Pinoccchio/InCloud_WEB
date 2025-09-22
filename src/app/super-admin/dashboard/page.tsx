'use client'

import { useState, useEffect } from 'react'
import {
  UserGroupIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/auth'

interface UserStats {
  totalUsers: number
  totalAdmins: number
  totalSuperAdmins: number
  activeUsers: number
  inactiveUsers: number
  recentlyAdded: number
}

export default function SuperAdminDashboard() {
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<Array<{
    id: number
    action: string
    user: string
    timestamp: string
    status: 'success' | 'warning' | 'info'
  }>>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Load admin statistics
      const { data: admins, error } = await supabase
        .from('admins')
        .select('id, role, is_active, created_at')

      if (!error && admins) {
        const now = new Date()
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        setUserStats({
          totalUsers: admins.length,
          totalAdmins: admins.filter(a => a.role === 'admin').length,
          totalSuperAdmins: admins.filter(a => a.role === 'super_admin').length,
          activeUsers: admins.filter(a => a.is_active).length,
          inactiveUsers: admins.filter(a => !a.is_active).length,
          recentlyAdded: admins.filter(a => new Date(a.created_at) > lastWeek).length
        })
      }

      // Simulated recent activity
      setRecentActivity([
        {
          id: 1,
          action: 'New admin account created',
          user: 'John Doe',
          timestamp: '2 hours ago',
          status: 'success'
        },
        {
          id: 2,
          action: 'Admin account deactivated',
          user: 'Jane Smith',
          timestamp: '5 hours ago',
          status: 'warning'
        },
        {
          id: 3,
          action: 'Role changed to Super Admin',
          user: 'Mike Johnson',
          timestamp: '1 day ago',
          status: 'info'
        }
      ])
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color }: {
    title: string
    value: number
    icon: React.ReactNode
    color: string
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              System-wide user management and administration
            </p>
          </div>
          <Link href="/super-admin/users">
            <Button className="flex items-center">
              <UserPlusIcon className="w-4 h-4 mr-2" />
              Add New User
            </Button>
          </Link>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={userStats?.totalUsers || 0}
          icon={<UserGroupIcon className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100"
        />
        <StatCard
          title="Super Admins"
          value={userStats?.totalSuperAdmins || 0}
          icon={<ShieldCheckIcon className="w-6 h-6 text-red-600" />}
          color="bg-red-100"
        />
        <StatCard
          title="Regular Admins"
          value={userStats?.totalAdmins || 0}
          icon={<UserGroupIcon className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
        />
        <StatCard
          title="Active Users"
          value={userStats?.activeUsers || 0}
          icon={<CheckCircleIcon className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
        />
        <StatCard
          title="Inactive Users"
          value={userStats?.inactiveUsers || 0}
          icon={<XCircleIcon className="w-6 h-6 text-gray-600" />}
          color="bg-gray-100"
        />
        <StatCard
          title="Recently Added"
          value={userStats?.recentlyAdded || 0}
          icon={<ClockIcon className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/super-admin/users?action=create"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <UserPlusIcon className="w-5 h-5 text-red-600" />
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">Add New Admin</p>
                <p className="text-sm text-gray-500">Create a new admin account</p>
              </div>
            </Link>
            <Link
              href="/super-admin/users"
              className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-900">Manage Users</p>
                <p className="text-sm text-gray-500">View and edit all users</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 py-2">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  activity.status === 'success' ? 'bg-green-500' :
                  activity.status === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">
                    {activity.user} • {activity.timestamp}
                  </p>
                </div>
              </div>
            ))}
            <Link href="/super-admin/users">
              <Button variant="ghost" size="sm" className="w-full mt-2">
                View All Activity
              </Button>
            </Link>
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
              <p className="font-medium text-gray-900">User Management</p>
              <p className="text-sm text-gray-500">All systems operational</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-gray-900">Database</p>
              <p className="text-sm text-gray-500">Connected and responsive</p>
            </div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div>
              <p className="font-medium text-gray-900">Authentication</p>
              <p className="text-sm text-gray-500">Service running normally</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}