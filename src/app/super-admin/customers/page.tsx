'use client'

import { useState, useEffect } from 'react'
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon
} from '@heroicons/react/24/outline'
import { Button, LoadingSpinner } from '@/components/ui'
import { supabase, getBranches, type BranchesResult } from '@/lib/supabase/auth'
import { useToastActions } from '@/contexts/ToastContext'

interface Customer {
  id: string
  full_name: string
  email: string
  phone: string | null
  address: any | null
  customer_type: string | null
  preferred_branch_id: string | null
  preferred_branch_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
  total_orders?: number
  total_spent?: number
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [branches, setBranches] = useState<BranchesResult>([])
  const { success, error } = useToastActions()

  useEffect(() => {
    loadCustomers()
    loadBranches()
  }, [])

  const loadCustomers = async () => {
    try {
      setIsLoading(true)

      // Get customers with branch and order statistics
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select(`
          id,
          full_name,
          email,
          phone,
          address,
          customer_type,
          preferred_branch_id,
          is_active,
          created_at,
          updated_at,
          branches!customers_preferred_branch_id_fkey (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (customersError) throw customersError

      // Get order statistics for each customer
      const { data: orderStats, error: orderStatsError } = await supabase
        .from('orders')
        .select('customer_id, total_amount')

      if (orderStatsError) throw orderStatsError

      // Process customers with statistics
      const processedCustomers = (customersData || []).map(customer => {
        const customerOrders = orderStats?.filter(order => order.customer_id === customer.id) || []
        const totalOrders = customerOrders.length
        const totalSpent = customerOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

        return {
          ...customer,
          preferred_branch_name: customer.branches?.name || 'Not set',
          total_orders: totalOrders,
          total_spent: totalSpent
        }
      })

      setCustomers(processedCustomers as Customer[])
    } catch (err) {
      console.error('Error loading customers:', err)
      error('Load Failed', 'Failed to load customers')
    } finally {
      setIsLoading(false)
    }
  }

  const loadBranches = async () => {
    try {
      const result = await getBranches()
      if (result.success && result.data) {
        setBranches(result.data)
      }
    } catch (err) {
      console.error('Error loading branches:', err)
      setBranches([])
    }
  }

  const handleToggleStatus = async (customer: Customer) => {
    try {
      const { error: updateError } = await supabase
        .from('customers')
        .update({ is_active: !customer.is_active })
        .eq('id', customer.id)

      if (updateError) throw updateError

      success(
        'Status Updated',
        `${customer.full_name} has been ${!customer.is_active ? 'activated' : 'deactivated'} successfully`
      )

      loadCustomers()
    } catch (err) {
      console.error('Error updating customer status:', err)
      error('Update Failed', 'Failed to update customer status')
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm))

    const matchesType = typeFilter === 'all' || customer.customer_type === typeFilter

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && customer.is_active) ||
                         (statusFilter === 'inactive' && !customer.is_active)

    const matchesBranch = branchFilter === 'all' || customer.preferred_branch_id === branchFilter

    return matchesSearch && matchesType && matchesStatus && matchesBranch
  })

  const getTypeBadgeColor = (type: string | null) => {
    if (!type) return 'bg-gray-100 text-gray-800'
    switch (type.toLowerCase()) {
      case 'wholesale':
        return 'bg-purple-100 text-purple-800'
      case 'retail':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Calculate statistics
  const stats = {
    total: customers.length,
    active: customers.filter(c => c.is_active).length,
    inactive: customers.filter(c => c.is_active === false).length,
    wholesale: customers.filter(c => c.customer_type === 'wholesale').length,
    retail: customers.filter(c => c.customer_type === 'retail').length
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Loading customers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">
            View and manage customer accounts and their order history
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Customers</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <div className="text-2xl font-semibold text-gray-900">{stats.active}</div>
              <div className="text-sm text-gray-500">Active</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <XCircleIcon className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <div className="text-2xl font-semibold text-gray-900">{stats.inactive}</div>
              <div className="text-sm text-gray-500">Inactive</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-semibold text-sm">WS</span>
            </div>
            <div className="ml-3">
              <div className="text-2xl font-semibold text-gray-900">{stats.wholesale}</div>
              <div className="text-sm text-gray-500">Wholesale</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">RT</span>
            </div>
            <div className="ml-3">
              <div className="text-2xl font-semibold text-gray-900">{stats.retail}</div>
              <div className="text-sm text-gray-500">Retail</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-600" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Types</option>
              <option value="wholesale">Wholesale</option>
              <option value="retail">Retail</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setTypeFilter('all')
                setStatusFilter('all')
                setBranchFilter('all')
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'No customers match your filters'
                : 'No customers found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preferred Branch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {customer.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customer.full_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Joined {formatDate(customer.created_at)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-900">
                          <EnvelopeIcon className="w-4 h-4 mr-2 text-gray-400" />
                          {customer.email}
                        </div>
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-500">
                            <PhoneIcon className="w-4 h-4 mr-2 text-gray-400" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(customer.customer_type)}`}>
                        {customer.customer_type || 'Not set'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.preferred_branch_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {customer.total_orders || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(customer.total_spent || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        customer.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(customer)}
                          title={customer.is_active ? 'Deactivate customer' : 'Activate customer'}
                        >
                          {customer.is_active ? (
                            <XCircleIcon className="w-4 h-4 text-red-600" />
                          ) : (
                            <CheckCircleIcon className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
