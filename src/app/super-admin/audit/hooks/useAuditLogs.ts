'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase/auth'
import { useAuth } from '@/contexts/AuthContext'
import { generateActionSummary } from '@/lib/audit-formatters'

export interface AuditLog {
  id: string
  admin_id: string | null
  action: string
  table_name: string
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  created_at: string | null
  change_summary: string | null
  field_changes: Record<string, unknown> | null
  change_context: string | null
  admins: {
    id: string
    full_name: string
    email: string
    role: string
  }
}

export interface AuditFilters {
  search: string
  action: string
  adminId: string
  tableName: string
  dateFrom: string
  dateTo: string
}

export interface Pagination {
  currentPage: number
  totalPages: number
  totalItems: number
  itemsPerPage: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

interface UseAuditLogsReturn {
  auditLogs: AuditLog[]
  admins: Array<{ id: string; full_name: string; role: string }>
  isLoading: boolean
  isExporting: boolean
  error: string | null
  pagination: Pagination
  filters: AuditFilters
  setFilters: (filters: Partial<AuditFilters>) => void
  clearFilters: () => void
  goToPage: (page: number) => void
  exportLogs: () => Promise<void>
  refetch: () => void
}

const ITEMS_PER_PAGE = 50
const DEBOUNCE_MS = 500

export function useAuditLogs(): UseAuditLogsReturn {
  const { admin: currentAdmin } = useAuth()

  // Core state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [admins, setAdmins] = useState<Array<{ id: string; full_name: string; role: string }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: ITEMS_PER_PAGE,
    hasNextPage: false,
    hasPrevPage: false
  })

  // Filter state
  const [filters, setFiltersState] = useState<AuditFilters>({
    search: '',
    action: '',
    adminId: '',
    tableName: '',
    dateFrom: '',
    dateTo: ''
  })

  // Debounced filters for API calls
  const [debouncedFilters, setDebouncedFilters] = useState<AuditFilters>(filters)

  // Debounce filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters)
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [filters])

  // Reset to first page when filters change
  useEffect(() => {
    if (pagination.currentPage !== 1) {
      setPagination(prev => ({ ...prev, currentPage: 1 }))
    }
  }, [debouncedFilters, pagination.currentPage])

  // Authorization check
  const isAuthorized = useMemo(() => {
    return currentAdmin?.role === 'super_admin'
  }, [currentAdmin])

  // Build query with optimized approach
  const buildQuery = useCallback((page: number, filters: AuditFilters, includeCount = true) => {
    const offset = (page - 1) * ITEMS_PER_PAGE

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
        change_summary,
        field_changes,
        change_context,
        admins!inner (
          id,
          full_name,
          email,
          role
        )
      `, { count: includeCount ? 'exact' : undefined })
      .order('created_at', { ascending: false })
      .range(offset, offset + ITEMS_PER_PAGE - 1)

    // Apply filters efficiently
    if (filters.search) {
      const searchTerm = `%${filters.search}%`
      query = query.or(`admins.full_name.ilike.${searchTerm},action.ilike.${searchTerm},table_name.ilike.${searchTerm},metadata->>reason.ilike.${searchTerm},change_summary.ilike.${searchTerm}`)
    }

    if (filters.action) {
      query = query.eq('action', filters.action)
    }

    if (filters.adminId) {
      query = query.eq('admin_id', filters.adminId)
    }

    if (filters.tableName) {
      query = query.eq('table_name', filters.tableName)
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', `${filters.dateFrom}T00:00:00Z`)
    }

    if (filters.dateTo) {
      query = query.lte('created_at', `${filters.dateTo}T23:59:59Z`)
    }

    return query
  }, [])

  // Load audit logs
  const loadAuditLogs = useCallback(async (page: number = 1, newFilters: AuditFilters = debouncedFilters) => {
    if (!isAuthorized) {
      setError('Unauthorized: Super admin access required')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data, error: fetchError, count } = await buildQuery(page, newFilters)

      if (fetchError) {
        throw fetchError
      }

      setAuditLogs(data || [])

      // Update pagination
      const totalItems = count || 0
      const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)

      setPagination({
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: ITEMS_PER_PAGE,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      })

    } catch (err) {
      console.error('Error loading audit logs:', err)
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
    } finally {
      setIsLoading(false)
    }
  }, [isAuthorized, buildQuery, debouncedFilters])

  // Load admins for filter dropdown
  const loadAdmins = useCallback(async () => {
    if (!isAuthorized) return

    try {
      const { data, error: fetchError } = await supabase
        .from('audit_logs')
        .select(`
          admin_id,
          admins!inner (
            id,
            full_name,
            role
          )
        `)

      if (fetchError) {
        console.error('Error loading admins for filter:', fetchError)
        return
      }

      // Extract unique admins
      const uniqueAdmins = data?.reduce((acc: Array<{ id: string; full_name: string; role: string }>, log) => {
        const admin = log.admins
        if (!acc.find(a => a.id === admin.id)) {
          acc.push({
            id: admin.id,
            full_name: admin.full_name,
            role: admin.role
          })
        }
        return acc
      }, []) || []

      setAdmins(uniqueAdmins)
    } catch (err) {
      console.error('Error loading admins:', err)
    }
  }, [isAuthorized])

  // Export functionality
  const exportLogs = useCallback(async (): Promise<void> => {
    if (!isAuthorized) {
      throw new Error('Unauthorized: Super admin access required')
    }

    try {
      setIsExporting(true)

      const { data, error: fetchError } = await buildQuery(1, debouncedFilters, false)
        .limit(10000)

      if (fetchError) {
        throw fetchError
      }

      if (!data || data.length === 0) {
        throw new Error('No audit logs found for export with current filters')
      }

      // Generate CSV
      const headers = [
        'Date/Time',
        'Admin Name',
        'Admin Role',
        'Action',
        'Table',
        'Record ID',
        'Summary',
        'Context'
      ]

      const csvRows = [
        headers.join(','),
        ...data.map(log => {
          // Generate user-friendly summary for CSV export
          const userFriendlySummary = log.change_summary ||
            generateActionSummary(
              log.action,
              log.table_name,
              log.old_data,
              log.new_data,
              log.metadata
            )

          return [
            `"${log.created_at ? new Date(log.created_at).toISOString() : ''}"`,
            `"${log.admins.full_name}"`,
            `"${log.admins.role === 'super_admin' ? 'Super Admin' : 'Admin'}"`,
            `"${log.action.toUpperCase()}"`,
            `"${log.table_name || ''}"`,
            `"${log.record_id || ''}"`,
            `"${userFriendlySummary || ''}"`,
            `"${log.change_context || ''}"`
          ].join(',')
        })
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `incloud-audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (err) {
      console.error('Error exporting audit logs:', err)
      throw err
    } finally {
      setIsExporting(false)
    }
  }, [isAuthorized, buildQuery, debouncedFilters])

  // Public methods
  const setFilters = useCallback((newFilters: Partial<AuditFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setFiltersState({
      search: '',
      action: '',
      adminId: '',
      tableName: '',
      dateFrom: '',
      dateTo: ''
    })
  }, [])

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= pagination.totalPages && page !== pagination.currentPage) {
      loadAuditLogs(page)
    }
  }, [pagination.totalPages, pagination.currentPage, loadAuditLogs])

  const refetch = useCallback(() => {
    loadAuditLogs(pagination.currentPage)
  }, [loadAuditLogs, pagination.currentPage])

  // Load data when filters change
  useEffect(() => {
    loadAuditLogs(1, debouncedFilters)
  }, [loadAuditLogs, debouncedFilters])

  // Load admins on mount
  useEffect(() => {
    loadAdmins()
  }, [loadAdmins])

  return {
    auditLogs,
    admins,
    isLoading,
    isExporting,
    error,
    pagination,
    filters,
    setFilters,
    clearFilters,
    goToPage,
    exportLogs,
    refetch
  }
}