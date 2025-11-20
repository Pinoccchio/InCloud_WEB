'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { Card, Button } from '@/components/ui'
import { AuditLogTable } from './components/AuditLogTable'
import { AuditFilters } from './components/AuditFilters'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

export interface AuditLog {
  id: string
  admin_id: string
  action: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'password_change' | 'permission_grant' | 'permission_revoke'
  table_name: string | null
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  metadata: Record<string, unknown>
  created_at: string
  change_summary: string | null
  field_changes: Record<string, unknown>
  change_context: string | null
}

export interface FilterState {
  dateRange: '7days' | '30days' | '90days' | 'all' | 'custom'
  startDate: string
  endDate: string
  actionType: string
  tableName: string
  searchQuery: string
}

export default function AuditHistoryPage() {
  const { admin } = useAuth()
  const supabase = createClient()

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalRecords, setTotalRecords] = useState(0)
  const itemsPerPage = 20

  const [filters, setFilters] = useState<FilterState>({
    dateRange: '30days',
    startDate: '',
    endDate: '',
    actionType: 'all',
    tableName: 'all',
    searchQuery: ''
  })

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    if (!admin?.id) return

    setLoading(true)
    try {
      // Build query
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('admin_id', admin.id)

      // Apply date range filter
      if (filters.dateRange !== 'all') {
        const now = new Date()
        let startDate: Date

        switch (filters.dateRange) {
          case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            break
          case '90days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
            break
          case 'custom':
            if (filters.startDate) {
              startDate = new Date(filters.startDate)
              query = query.gte('created_at', startDate.toISOString())
            }
            if (filters.endDate) {
              const endDate = new Date(filters.endDate)
              query = query.lte('created_at', endDate.toISOString())
            }
            break
        }

        if (filters.dateRange !== 'custom') {
          query = query.gte('created_at', startDate.toISOString())
        }
      }

      // Apply action type filter
      if (filters.actionType && filters.actionType !== 'all') {
        query = query.eq('action', filters.actionType)
      }

      // Apply table name filter
      if (filters.tableName && filters.tableName !== 'all') {
        query = query.eq('table_name', filters.tableName)
      }

      // Apply search query (search in change_summary or change_context)
      if (filters.searchQuery) {
        query = query.or(`change_summary.ilike.%${filters.searchQuery}%,change_context.ilike.%${filters.searchQuery}%,metadata->>adjustment_reason.ilike.%${filters.searchQuery}%`)
      }

      // Order by created_at descending
      query = query.order('created_at', { ascending: false })

      // Pagination
      const offset = (currentPage - 1) * itemsPerPage
      query = query.range(offset, offset + itemsPerPage - 1)

      const { data, error, count } = await query

      if (error) {
        console.error('Error fetching audit logs:', error)
        throw error
      }

      setAuditLogs(data || [])
      setTotalRecords(count || 0)
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      setAuditLogs([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount and when filters/page change
  useEffect(() => {
    fetchAuditLogs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin?.id, filters, currentPage])

  // Export to CSV
  const exportToCSV = () => {
    if (auditLogs.length === 0) return

    const headers = ['Date/Time', 'Action', 'Table', 'Record ID', 'Summary', 'Context']
    const rows = auditLogs.map(log => [
      new Date(log.created_at).toLocaleString(),
      log.action.toUpperCase(),
      log.table_name || 'N/A',
      log.record_id || 'N/A',
      log.change_summary || 'N/A',
      log.change_context || 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `audit_history_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit History</h1>
          <p className="mt-1 text-sm text-gray-600">
            View your action history and changes made in the system
          </p>
        </div>
        <Button
          onClick={exportToCSV}
          variant="outline"
          disabled={loading || auditLogs.length === 0}
          className="flex items-center gap-2"
        >
          <DocumentTextIcon className="h-5 w-5" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Total Actions</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalRecords}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">This Month</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {filters.dateRange === '30days' ? auditLogs.length : '-'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">This Week</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {filters.dateRange === '7days' ? auditLogs.length : '-'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-600">Current Page</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {currentPage} / {totalPages}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <AuditFilters
        filters={filters}
        onFiltersChange={(newFilters) => {
          setFilters(newFilters)
          setCurrentPage(1) // Reset to first page on filter change
        }}
      />

      {/* Audit Log Table */}
      <AuditLogTable
        auditLogs={auditLogs}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  )
}
