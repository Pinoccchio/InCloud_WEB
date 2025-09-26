'use client'

import { useState, useEffect } from 'react'
import {
  BellIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase/auth'
import { getMainBranchId } from '@/lib/constants/branch'
import AlertsModal from './components/AlertsModal'
import AlertsTable from './components/AlertsTable'
import AlertFilters from './components/AlertFilters'

interface AlertSummary {
  total_alerts: number
  critical_alerts: number
  high_alerts: number
  medium_alerts: number
  low_alerts: number
}


export default function AlertsPage() {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  // Summary and modal states
  const [alertSummary, setAlertSummary] = useState<AlertSummary>({
    total_alerts: 0,
    critical_alerts: 0,
    high_alerts: 0,
    medium_alerts: 0,
    low_alerts: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { addToast } = useToast()

  useEffect(() => {
    loadAlertSummary()
  }, [refreshTrigger])

  const loadAlertSummary = async () => {
    try {
      setIsLoading(true)
      const branchId = await getMainBranchId()

      // Load alert summary from database
      const { data: alertsData, error } = await supabase
        .from('alerts')
        .select('severity')
        .eq('branch_id', branchId)
        .eq('status', 'active')

      if (error) throw error

      if (alertsData) {
        // Calculate alert summary by severity
        const totalAlerts = alertsData.length
        let criticalAlerts = 0
        let highAlerts = 0
        let mediumAlerts = 0
        let lowAlerts = 0

        alertsData.forEach((alert) => {
          switch (alert.severity) {
            case 'critical':
              criticalAlerts++
              break
            case 'high':
              highAlerts++
              break
            case 'medium':
              mediumAlerts++
              break
            case 'low':
              lowAlerts++
              break
          }
        })

        setAlertSummary({
          total_alerts: totalAlerts,
          critical_alerts: criticalAlerts,
          high_alerts: highAlerts,
          medium_alerts: mediumAlerts,
          low_alerts: lowAlerts
        })
      }
    } catch (error) {
      console.error('Error loading alert data:', error)
      addToast({
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load alert data.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshData = () => {
    setRefreshTrigger(prev => prev + 1)
    addToast({
      type: 'info',
      title: 'Data Refreshed',
      message: 'Alert data has been refreshed successfully.'
    })
  }

  const handleExportData = () => {
    addToast({
      type: 'info',
      title: 'Export Started',
      message: 'Alert data export is being prepared. You will be notified when ready.'
    })
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setTypeFilter('')
    setSeverityFilter('')
    setStatusFilter('')
    setDateFilter('')
  }


  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alerts & Notifications</h1>
          <p className="text-gray-600 mt-1">
            Monitor system alerts for low stock, expiring products, and configure alert settings
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleRefreshData}
            variant="outline"
            disabled={isLoading}
            className="flex items-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            ) : (
              <ArrowPathIcon className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleExportData}
            className="flex items-center"
          >
            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center"
          >
            <Cog6ToothIcon className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <BellIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Alerts</p>
              <p className="text-lg font-semibold text-gray-900">{alertSummary.total_alerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Critical</p>
              <p className="text-lg font-semibold text-gray-900">{alertSummary.critical_alerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">High</p>
              <p className="text-lg font-semibold text-gray-900">{alertSummary.high_alerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <InformationCircleIcon className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Medium</p>
              <p className="text-lg font-semibold text-gray-900">{alertSummary.medium_alerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <InformationCircleIcon className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Low</p>
              <p className="text-lg font-semibold text-gray-900">{alertSummary.low_alerts}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Filters */}
      <AlertFilters
        searchQuery={searchQuery}
        typeFilter={typeFilter}
        severityFilter={severityFilter}
        statusFilter={statusFilter}
        dateFilter={dateFilter}
        onSearchChange={setSearchQuery}
        onTypeChange={setTypeFilter}
        onSeverityChange={setSeverityFilter}
        onStatusChange={setStatusFilter}
        onDateChange={setDateFilter}
        onClearFilters={clearAllFilters}
      />

      {/* Alerts Table */}
      <AlertsTable
        key={refreshTrigger}
        searchQuery={searchQuery}
        typeFilter={typeFilter}
        severityFilter={severityFilter}
        statusFilter={statusFilter}
        dateFilter={dateFilter}
        onRefresh={() => setRefreshTrigger(prev => prev + 1)}
      />

      {/* Alert Settings Modal */}
      <AlertsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}