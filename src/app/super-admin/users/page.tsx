'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  UserPlusIcon,
  PencilIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  KeyIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { Button, LoadingSpinner, CreateAdminModal, EditAdminModal, ConfirmDialog } from '@/components/ui'
import { supabase, getBranches, type BranchesResult } from '@/lib/supabase/auth'
import { useToastActions } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'

interface AdminUser {
  id: string
  user_id: string
  full_name: string
  email?: string
  role: 'admin' | 'super_admin'
  branches: string[]
  is_active: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}


export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'super_admin'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ admin: AdminUser, newStatus: boolean } | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [adminToDelete, setAdminToDelete] = useState<AdminUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [branches, setBranches] = useState<BranchesResult>([])
  const searchParams = useSearchParams()
  const { success, error } = useToastActions()
  const { admin: currentAdmin } = useAuth()

  // Permission checking functions
  const canEditAdmin = (targetAdmin: AdminUser) => {
    if (!currentAdmin) return false

    // Must be super admin to edit any admin
    if (currentAdmin.role !== 'super_admin') return false

    // Super admin can edit their own profile
    if (targetAdmin.id === currentAdmin.id) return true

    // Super admin cannot edit other super admins
    if (targetAdmin.role === 'super_admin' && targetAdmin.id !== currentAdmin.id) return false

    // Super admin can edit regular admins
    return targetAdmin.role === 'admin'
  }

  const canToggleStatus = (targetAdmin: AdminUser) => {
    if (!currentAdmin) return false

    // Must be super admin to toggle any admin status
    if (currentAdmin.role !== 'super_admin') return false

    // Super admin CANNOT deactivate themselves (security protection)
    if (targetAdmin.id === currentAdmin.id) return false

    // Super admin cannot toggle other super admin status
    if (targetAdmin.role === 'super_admin' && targetAdmin.id !== currentAdmin.id) return false

    // Super admin can toggle regular admin status
    return targetAdmin.role === 'admin'
  }

  const canDeleteAdmin = (targetAdmin: AdminUser) => {
    if (!currentAdmin) return false

    // Must be super admin to delete any admin
    if (currentAdmin.role !== 'super_admin') return false

    // Super admin CANNOT delete themselves (security protection)
    if (targetAdmin.id === currentAdmin.id) return false

    // Super admin cannot delete other super admins
    if (targetAdmin.role === 'super_admin') return false

    // Super admin can only delete regular admins
    return targetAdmin.role === 'admin'
  }

  const getActionMessage = (targetAdmin: AdminUser) => {
    if (!currentAdmin) return 'No permissions'

    if (currentAdmin.role !== 'super_admin') {
      return 'Super admin access required'
    }

    // Self-protection message
    if (targetAdmin.id === currentAdmin.id) {
      return 'Self-protection active'
    }

    // Other super admin protection
    if (targetAdmin.role === 'super_admin' && targetAdmin.id !== currentAdmin.id) {
      return 'Protected account'
    }

    // Has edit access but no status toggle
    if (canEditAdmin(targetAdmin) && !canToggleStatus(targetAdmin)) {
      return 'Edit only'
    }

    return 'No actions available'
  }

  useEffect(() => {
    loadAdmins()
    loadBranches()

    // Check if create action is requested
    if (searchParams.get('action') === 'create') {
      setShowCreateModal(true)
    }
  }, [searchParams])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdown) {
        setOpenDropdown(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [openDropdown])

  const loadAdmins = async () => {
    try {
      // Get admins data including email
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select(`
          id,
          user_id,
          full_name,
          email,
          role,
          branches,
          is_active,
          last_login,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })

      if (adminError) throw adminError

      setAdmins(adminData as AdminUser[] || [])
    } catch (error) {
      console.error('Error loading admins:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadBranches = async () => {
    try {
      const result = await getBranches()
      if (result.success && result.data) {
        setBranches(result.data)
      } else {
        console.error('Error loading branches:', result.error)
        setBranches([])
      }
    } catch (error) {
      console.error('Error loading branches:', error)
      setBranches([])
    }
  }

  const handleToggleStatus = (admin: AdminUser) => {
    if (!canToggleStatus(admin)) {
      error(
        'Permission Denied',
        'You do not have permission to change this admin\'s status.'
      )
      return
    }
    setConfirmAction({ admin, newStatus: !admin.is_active })
    setShowConfirmDialog(true)
  }

  const confirmToggleStatus = async () => {
    if (!confirmAction) return

    try {
      setIsUpdatingStatus(true)
      const { admin, newStatus } = confirmAction

      const response = await fetch('/api/admin/toggle-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: admin.id,
          isActive: newStatus,
          currentAdminId: currentAdmin?.id,
          currentAdminRole: currentAdmin?.role
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update admin status')
      }

      // Show success message
      success(
        'Status Updated',
        `${admin.full_name} has been ${newStatus ? 'activated' : 'deactivated'} successfully`
      )

      // Refresh admin list
      loadAdmins()
    } catch (err) {
      console.error('Error updating admin status:', err)
      error(
        'Status Update Failed',
        err instanceof Error ? err.message : 'Failed to update admin status'
      )
    } finally {
      setIsUpdatingStatus(false)
      setShowConfirmDialog(false)
      setConfirmAction(null)
    }
  }

  const handleEditAdmin = (admin: AdminUser) => {
    if (!canEditAdmin(admin)) {
      error(
        'Permission Denied',
        admin.role === 'super_admin'
          ? 'You cannot edit other super admin profiles. You can only edit your own profile.'
          : 'You do not have permission to edit this admin profile.'
      )
      return
    }
    setSelectedAdmin(admin)
    setShowEditModal(true)
  }

  const handleDeleteAdmin = (admin: AdminUser) => {
    if (!canDeleteAdmin(admin)) {
      error(
        'Permission Denied',
        'You can only delete regular admin accounts. Super admin accounts cannot be deleted.'
      )
      return
    }
    setAdminToDelete(admin)
    setShowDeleteDialog(true)
  }

  const confirmDeleteAdmin = async () => {
    if (!adminToDelete || !currentAdmin) return

    try {
      setIsDeleting(true)

      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: adminToDelete.id,
          currentAdminId: currentAdmin.id,
          currentAdminRole: currentAdmin.role
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete admin account')
      }

      success(
        'Account Deleted',
        `${adminToDelete.full_name} has been deleted successfully`
      )

      // Refresh admin list
      loadAdmins()
    } catch (err) {
      console.error('Error deleting admin:', err)
      error(
        'Delete Failed',
        err instanceof Error ? err.message : 'Failed to delete admin account'
      )
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setAdminToDelete(null)
    }
  }

  const handleModalSuccess = () => {
    loadAdmins()
  }

  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = admin.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'all' || admin.role === roleFilter
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && admin.is_active) ||
                         (statusFilter === 'inactive' && !admin.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleBadgeColor = (role: string) => {
    return role === 'super_admin'
      ? 'bg-red-600 text-white'
      : 'bg-blue-600 text-white'
  }

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-600 text-white'
      : 'bg-gray-600 text-white'
  }

  const formatBranches = (userBranches: string[], role: string) => {
    // Super admin gets system-wide access (empty array)
    if (role === 'super_admin' || !userBranches || userBranches.length === 0) {
      return 'All branches'
    }

    // For single-branch system, show actual branch name
    if (userBranches.length === 1) {
      const branch = branches.find(b => b.id === userBranches[0])
      return branch ? branch.name : 'Main Branch'
    }

    // For multi-branch scenarios, show count and names if available
    if (userBranches.length <= 3) {
      const branchNames = userBranches
        .map(branchId => branches.find(b => b.id === branchId)?.name)
        .filter(Boolean)
        .join(', ')
      return branchNames || `${userBranches.length} branch${userBranches.length === 1 ? '' : 'es'}`
    }

    // Fallback for many branches
    return `${userBranches.length} branches`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Loading admin users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage admin accounts, roles, and permissions for the system
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center"
        >
          <UserPlusIcon className="w-4 h-4 mr-2" />
          Add New Admin
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-600" />
            </div>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'super_admin')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
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
                setRoleFilter('all')
                setStatusFilter('all')
              }}
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Admin List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredAdmins.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                ? 'No admin users match your filters'
                : 'No admin users found'}
            </p>
            {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="outline"
                className="mt-4"
              >
                <UserPlusIcon className="w-4 h-4 mr-2" />
                Add First Admin
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-full inline-block align-middle">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Branches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-blue-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            admin.role === 'super_admin'
                              ? 'bg-gradient-to-br from-red-500 to-red-600 ring-2 ring-red-200'
                              : 'bg-blue-500'
                          }`}>
                            <span className="text-sm font-medium text-white">
                              {admin.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {admin.full_name}
                            {admin.id === currentAdmin?.id && (
                              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(admin.role)}`}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatBranches(admin.branches, admin.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(admin.is_active)}`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.last_login
                        ? new Date(admin.last_login).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {/* Actions Dropdown - shadcn Button */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenDropdown(openDropdown === admin.id ? null : admin.id)
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                          >
                            <span className="text-lg font-bold">⋮</span>
                          </button>

                          {openDropdown === admin.id && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenDropdown(null)}
                              />
                              <div className="absolute right-0 bottom-full mb-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                                <div className="py-1">
                                  {/* Edit Profile - Always visible */}
                                  {canEditAdmin(admin) ? (
                                    <button
                                      onClick={() => {
                                        handleEditAdmin(admin)
                                        setOpenDropdown(null)
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                                    >
                                      <PencilIcon className="w-4 h-4 mr-2 text-gray-500" />
                                      Edit Profile
                                    </button>
                                  ) : (
                                    <div className="px-4 py-2 cursor-not-allowed bg-gray-50">
                                      <div className="flex items-center text-gray-400">
                                        <PencilIcon className="w-4 h-4 mr-2" />
                                        <span className="text-sm">Edit Profile</span>
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1 ml-6">
                                        {getActionMessage(admin)}
                                      </div>
                                    </div>
                                  )}

                                  {/* Status Toggle - Only for Regular Admins */}
                                  {admin.role === 'admin' && (
                                    <>
                                      <div className="border-t border-gray-100 my-1"></div>
                                      {canToggleStatus(admin) ? (
                                        <button
                                          onClick={() => {
                                            handleToggleStatus(admin)
                                            setOpenDropdown(null)
                                          }}
                                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center ${
                                            admin.is_active
                                              ? 'text-red-600 hover:text-red-700'
                                              : 'text-green-600 hover:text-green-700'
                                          }`}
                                        >
                                          <KeyIcon className="w-4 h-4 mr-2" />
                                          {admin.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                      ) : (
                                        <div className="px-4 py-2 cursor-not-allowed bg-gray-50">
                                          <div className="flex items-center text-gray-400">
                                            <KeyIcon className="w-4 h-4 mr-2" />
                                            <span className="text-sm">Change Status</span>
                                          </div>
                                          <div className="text-xs text-gray-500 mt-1 ml-6">
                                            Restricted
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {/* Delete Account - Only for Regular Admins */}
                                  {admin.role === 'admin' && canDeleteAdmin(admin) && (
                                    <>
                                      <div className="border-t border-gray-100 my-1"></div>
                                      <button
                                        onClick={() => {
                                          handleDeleteAdmin(admin)
                                          setOpenDropdown(null)
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center"
                                      >
                                        <TrashIcon className="w-4 h-4 mr-2" />
                                        Delete Account
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 min-w-0">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">
                {admins.length}
              </div>
              <div className="text-sm text-gray-500">Total Admins</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-red-600 font-semibold text-sm">SA</span>
              </div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">
                {admins.filter(a => a.role === 'super_admin').length}
              </div>
              <div className="text-sm text-gray-500">Super Admins</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">
                {admins.filter(a => a.is_active).length}
              </div>
              <div className="text-sm text-gray-500">Active Admins</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-2 w-2 bg-red-500 rounded-full"></div>
            </div>
            <div className="ml-4">
              <div className="text-2xl font-semibold text-gray-900">
                {admins.filter(a => !a.is_active).length}
              </div>
              <div className="text-sm text-gray-500">Inactive Admins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateAdminModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleModalSuccess}
      />

      <EditAdminModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedAdmin(null)
        }}
        onSuccess={handleModalSuccess}
        admin={selectedAdmin}
      />

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false)
          setConfirmAction(null)
        }}
        onConfirm={confirmToggleStatus}
        title={confirmAction?.newStatus ? 'Activate Admin' : 'Deactivate Admin'}
        message={
          confirmAction?.newStatus
            ? `Are you sure you want to activate ${confirmAction.admin.full_name}? They will regain access to the system.`
            : `Are you sure you want to deactivate ${confirmAction?.admin.full_name}? They will lose access to the system.`
        }
        confirmText={confirmAction?.newStatus ? 'Activate' : 'Deactivate'}
        type={confirmAction?.newStatus ? 'info' : 'warning'}
        isLoading={isUpdatingStatus}
      />

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false)
          setAdminToDelete(null)
        }}
        onConfirm={confirmDeleteAdmin}
        title="Delete Admin Account"
        message={
          adminToDelete
            ? `Are you sure you want to delete ${adminToDelete.full_name}? This action cannot be undone and will permanently remove their account and all associated data.`
            : ''
        }
        confirmText="Delete Account"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  )
}