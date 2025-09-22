'use client'

import { useState } from 'react'
import {
  Cog6ToothIcon,
  BellIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'

export default function SettingsPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [lowStockThreshold, setLowStockThreshold] = useState(10)
  const [expirationWarningDays, setExpirationWarningDays] = useState(7)

  const handleSaveSettings = () => {
    // In real implementation, this would save to Supabase
    console.log('Saving settings...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-1">
          Configure system-wide settings, notifications, and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BellIcon className="w-5 h-5 mr-2 text-primary-600" />
              Notification Settings
            </CardTitle>
            <CardDescription>
              Manage system alerts and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Push Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Enable real-time notifications in the dashboard
                </p>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email Alerts
                </label>
                <p className="text-sm text-gray-500">
                  Send critical alerts via email
                </p>
              </div>
              <button
                onClick={() => setEmailAlerts(!emailAlerts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  emailAlerts ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Low Stock Threshold
              </label>
              <input
                type="number"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                min="1"
                max="100"
              />
              <p className="text-sm text-gray-500">
                Alert when stock falls below this number
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Expiration Warning (Days)
              </label>
              <input
                type="number"
                value={expirationWarningDays}
                onChange={(e) => setExpirationWarningDays(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                min="1"
                max="30"
              />
              <p className="text-sm text-gray-500">
                Alert when products expire within this many days
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldCheckIcon className="w-5 h-5 mr-2 text-primary-600" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage security policies and access controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium text-green-800">Two-Factor Authentication</div>
                  <div className="text-sm text-green-600">Enabled for all admin accounts</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium text-blue-800">Row Level Security</div>
                  <div className="text-sm text-blue-600">Active on all database tables</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <div>
                  <div className="font-medium text-yellow-800">Session Timeout</div>
                  <div className="text-sm text-yellow-600">8 hours of inactivity</div>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full">
              View Audit Logs
            </Button>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Cog6ToothIcon className="w-5 h-5 mr-2 text-primary-600" />
              System Information
            </CardTitle>
            <CardDescription>
              System status and configuration details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">System Version</span>
              <span className="text-sm font-medium">InCloud v1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Database Status</span>
              <span className="text-sm font-medium text-green-600">Healthy</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Last Backup</span>
              <span className="text-sm font-medium">2 hours ago</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <span className="text-sm font-medium">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Storage Used</span>
              <span className="text-sm font-medium">2.4 GB / 10 GB</span>
            </div>
          </CardContent>
        </Card>

        {/* Branch Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BuildingStorefrontIcon className="w-5 h-5 mr-2 text-primary-600" />
              Branch Management
            </CardTitle>
            <CardDescription>
              Manage branch locations and settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Sampaloc Main Branch</div>
                  <div className="text-sm text-gray-500">Main distribution center</div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Sampaloc Branch 2</div>
                  <div className="text-sm text-gray-500">Secondary storage facility</div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">Sampaloc Branch 3</div>
                  <div className="text-sm text-gray-500">Customer service center</div>
                </div>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Active
                </span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Manage Branches
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Save Settings */}
      <div className="flex justify-end">
        <Button onClick={handleSaveSettings} className="px-6">
          Save Settings
        </Button>
      </div>
    </div>
  )
}