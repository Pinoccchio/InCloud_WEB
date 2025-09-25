'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeftIcon,
  UserIcon,
  ClockIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline'
import { Button, LoadingSpinner } from '@/components/ui'
import { useToastActions } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/auth'
import AuditLogTable from '../../../audit/components/StreamlinedTable'
import AuditFilters from '../../../audit/components/SmartFilters'
import AuditDetails from '../../../audit/components/ModalDetails'

interface AuditLog {
  id: string
  admin_id: string
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  created_at: string
  admins: {
    id: string
    full_name: string
    email: string
    role: string
  }
}

interface AdminUser {
  id: string
  full_name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  last_login: string | null
  branches: string[]
}

interface Filters {
  search: string
  action: string
  adminId: string
  tableName: string
  dateFrom: string
  dateTo: string
}

export default function AdminAuditHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const adminId = params.id as string

  const [admin, setAdmin] = useState<AdminUser | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLog | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
    hasNextPage: false,
    hasPrevPage: false
  })

  const [filters, setFilters] = useState<Filters>({
    search: '',
    action: '',
    adminId: adminId,
    tableName: '',
    dateFrom: '',
    dateTo: ''
  })

  const { success, error } = useToastActions()
  const { admin: currentAdmin } = useAuth()

  // Load admin details using direct Supabase client
  const loadAdminDetails = useCallback(async () => {
    try {
      // Check permissions
      if (!currentAdmin || currentAdmin.role !== 'super_admin') {
        error('Permission Denied', 'Super admin access required')
        router.push('/super-admin/users')
        return
      }

      // Get admin details directly from admins table
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('*')
        .eq('id', adminId)
        .single()

      if (adminError || !adminData) {
        error('Admin Not Found', 'Could not find admin details')
        router.push('/super-admin/users')
        return
      }

      setAdmin({
        id: adminData.id,
        full_name: adminData.full_name,
        email: adminData.email,
        role: adminData.role,
        is_active: adminData.is_active,
        created_at: adminData.created_at,
        last_login: adminData.last_login,
        branches: adminData.branches || []
      })
    } catch (err) {
      console.error('Error loading admin details:', err)
      error('Load Failed', 'Failed to load admin details')
    }
  }, [currentAdmin, adminId, router, error])

  // Load audit logs using direct Supabase client
  const loadAuditLogs = useCallback(async (page: number = 1) => {
    try {
      setIsLoading(true)

      // Check permissions
      if (!currentAdmin || currentAdmin.role !== 'super_admin') {
        throw new Error('Unauthorized: Super admin access required')
      }

      const limit = 50
      const offset = (page - 1) * limit

      // Build the query for specific admin
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          admin_id,
          action,
          table_name,
          record_id,
          old_data,
          new_data,
          metadata,
          created_at,
          admins!inner (
            id,
            full_name,
            email,
            role
          )
        `, { count: 'exact' })
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Apply additional filters (excluding adminId since we're already filtering by it)
      if (filters.search) {
        query = query.or(`action.ilike.%${filters.search}%,table_name.ilike.%${filters.search}%,metadata->>reason.ilike.%${filters.search}%`)
      }
      if (filters.action) {
        query = query.eq('action', filters.action)
      }
      if (filters.tableName) {
        query = query.eq('table_name', filters.tableName)
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom + 'T00:00:00Z')
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo + 'T23:59:59Z')
      }

      const { data, error: fetchError, count } = await query

      if (fetchError) {
        throw fetchError
      }

      // Transform data to match expected format
      const transformedData = data?.map(log => ({
        ...log,
        admins: log.admins
      })) || []

      setAuditLogs(transformedData)

      // Calculate pagination
      const totalItems = count || 0
      const totalPages = Math.ceil(totalItems / limit)
      setPagination({
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      })
      setCurrentPage(page)

    } catch (err) {
      console.error('Error loading audit logs:', err)
      error(
        'Load Failed',
        err instanceof Error ? err.message : 'Failed to load audit logs'
      )
    } finally {
      setIsLoading(false)
    }
  }, [currentAdmin, adminId, filters, error])

  // Export audit logs using direct Supabase client
  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Check permissions
      if (!currentAdmin || currentAdmin.role !== 'super_admin') {
        throw new Error('Unauthorized: Super admin access required')
      }

      // Build export query for specific admin
      let query = supabase
        .from('audit_logs')
        .select(`
          id,
          admin_id,
          action,
          table_name,
          record_id,
          old_data,
          new_data,
          metadata,
          created_at,
          admins!inner (
            id,
            full_name,
            email,
            role
          )
        `)
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })
        .limit(10000)

      // Apply additional filters (excluding adminId since we're already filtering by it)
      if (filters.search) {
        query = query.or(`action.ilike.%${filters.search}%,table_name.ilike.%${filters.search}%,metadata->>reason.ilike.%${filters.search}%`)
      }
      if (filters.action) {
        query = query.eq('action', filters.action)
      }
      if (filters.tableName) {
        query = query.eq('table_name', filters.tableName)
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom + 'T00:00:00Z')
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo + 'T23:59:59Z')
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      if (!data || data.length === 0) {
        error('No Data', 'No audit logs found for export with current filters')
        return
      }

      // Convert to CSV
      const headers = [
        'Date/Time',
        'Action',
        'Table',
        'Record ID',
        'Reason'
      ]

      const csvRows = [
        headers.join(','),
        ...data.map(log => [
          `"${new Date(log.created_at).toISOString()}"`,
          `"${log.action}"`,
          `"${log.table_name || ''}"`,
          `"${log.record_id || ''}"`,
          `"${log.metadata?.reason || ''}"`
        ].join(','))
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${admin?.full_name.replace(/\s+/g, '-') || 'admin'}-audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      success(
        'Export Successful',
        `Audit logs for ${admin?.full_name} have been exported successfully`
      )

    } catch (err) {
      console.error('Error exporting audit logs:', err)
      error(
        'Export Failed',
        err instanceof Error ? err.message : 'Failed to export audit logs'
      )
    } finally {
      setIsExporting(false)
    }
  }

  // Handle filter changes
  const handleFiltersChange = (newFilters: Filters) => {
    setFilters({ ...newFilters, adminId: adminId })
    setCurrentPage(1)
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      search: '',
      action: '',
      adminId: adminId,
      tableName: '',
      dateFrom: '',
      dateTo: ''
    })
    setCurrentPage(1)
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    loadAuditLogs(page)
  }

  // Handle view details
  const handleViewDetails = (auditLog: AuditLog) => {
    setSelectedAuditLog(auditLog)
    setShowDetails(true)
  }

  // Calculate stats
  const stats = {
    totalActions: auditLogs.length > 0 ? pagination.totalItems : 0,
    todayActions: auditLogs.filter(log => {
      const logDate = new Date(log.created_at)
      const today = new Date()
      return logDate.toDateString() === today.toDateString()
    }).length,
    createActions: auditLogs.filter(log => log.action === 'create').length,
    deleteActions: auditLogs.filter(log => log.action === 'delete').length
  }

  // Load data on mount
  useEffect(() => {
    if (adminId && currentAdmin) {
      loadAdminDetails()
      loadAuditLogs(currentPage)
    }
  }, [adminId, currentAdmin, currentPage, loadAdminDetails, loadAuditLogs])

  // Load audit logs when filters change
  useEffect(() => {
    if (adminId && currentAdmin) {
      loadAuditLogs(1)
    }
  }, [filters, adminId, currentAdmin, loadAuditLogs])

  if (!admin && !isLoading) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">Admin not found</p>
        <Button onClick={() => router.push('/super-admin/users')} className="mt-4">
          Back to User Management
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/super-admin/users')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
          <div className="h-6 border-l border-gray-300" />
          <div className="flex items-center space-x-3">
            {admin && (
              <>
                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                  admin.role === 'super_admin'
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : 'bg-blue-500'
                }`}>
                  <span className="text-sm font-medium text-white">
                    {admin.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {admin.full_name} - Audit History
                  </h1>
                  <p className="text-gray-600">
                    {admin.email} • {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleExport}
            disabled={isExporting || auditLogs.length === 0}
            className="flex items-center"
            variant="outline"
          >
            {isExporting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
                Export CSV
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentChartBarIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">
                {stats.totalActions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Actions</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">
                {stats.todayActions}
              </div>
              <div className="text-sm text-gray-500">Today&apos;s Actions</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserIcon className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">
                {stats.createActions}
              </div>
              <div className="text-sm text-gray-500">Create Actions</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">
                {stats.deleteActions}
              </div>
              <div className="text-sm text-gray-500">Delete Actions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <AuditFilters
        filters={filters}
        admins={admin ? [{ id: admin.id, full_name: admin.full_name, role: admin.role }] : []}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
        isLoading={isLoading}
      />

      {/* Audit Log Table */}
      <AuditLogTable
        auditLogs={auditLogs}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onViewDetails={handleViewDetails}
      />

      {/* Audit Details Modal */}
      <AuditDetails
        auditLog={selectedAuditLog}
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false)
          setSelectedAuditLog(null)
        }}
      />
    </div>
  )
}