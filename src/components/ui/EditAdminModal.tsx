'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon, PencilIcon, KeyIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'
import { Input } from './Input'
import { createClient } from '@supabase/supabase-js'

// Form validation schema
const editAdminSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['admin', 'super_admin']),
  branches: z.array(z.string()).optional()
})

type EditAdminFormData = z.infer<typeof editAdminSchema>

interface Branch {
  id: string
  name: string
  address: string
  is_active: boolean
}

interface AdminUser {
  id: string
  user_id: string
  full_name: string
  email?: string
  role: 'admin' | 'super_admin'
  branches: string[]
  is_active: boolean
}

interface EditAdminModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  admin: AdminUser | null
}

export function EditAdminModal({ isOpen, onClose, onSuccess, admin }: EditAdminModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [branches, setBranches] = useState<Branch[]>([])
  const [loadingBranches, setLoadingBranches] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm<EditAdminFormData>({
    resolver: zodResolver(editAdminSchema)
  })

  const selectedRole = watch('role')
  const selectedBranches = watch('branches') || []

  // Load admin data into form when modal opens or admin changes
  useEffect(() => {
    if (isOpen && admin) {
      reset({
        fullName: admin.full_name,
        role: admin.role,
        branches: admin.branches || []
      })
      loadBranches()
    }
  }, [isOpen, admin, reset])

  const loadBranches = async () => {
    try {
      setLoadingBranches(true)

      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      const { data, error } = await supabase
        .from('branches')
        .select('id, name, address, is_active')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setBranches(data || [])
    } catch (error) {
      console.error('Error loading branches:', error)
    } finally {
      setLoadingBranches(false)
    }
  }

  const handleBranchToggle = (branchId: string) => {
    const currentBranches = selectedBranches || []
    const isSelected = currentBranches.includes(branchId)

    if (isSelected) {
      setValue('branches', currentBranches.filter(id => id !== branchId))
    } else {
      setValue('branches', [...currentBranches, branchId])
    }
  }

  const onSubmit = async (data: EditAdminFormData) => {
    if (!admin) return

    try {
      setIsSubmitting(true)

      const response = await fetch('/api/admin/update-user', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: admin.id,
          fullName: data.fullName,
          role: data.role,
          branches: data.branches || []
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update admin user')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating admin:', error)
      alert(error instanceof Error ? error.message : 'Failed to update admin user')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!admin) return

    try {
      setIsResettingPassword(true)

      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: admin.id
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password')
      }

      alert(`Password reset email sent to ${result.email}`)
    } catch (error) {
      console.error('Error resetting password:', error)
      alert(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      setIsResettingPassword(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting && !isResettingPassword) {
      reset()
      onClose()
    }
  }

  if (!admin) return null

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <PencilIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    Edit Admin User
                  </DialogTitle>
                  <p className="text-sm text-gray-600">
                    Update admin user details and permissions
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting || isResettingPassword}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Full Name */}
              <Input
                label="Full Name"
                placeholder="Enter admin's full name"
                error={errors.fullName?.message}
                {...register('fullName')}
              />

              {/* Email - Read Only */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Email Address
                </label>
                <div className="flex h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                  {admin.email || 'No email set'}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Email address cannot be changed after account creation
                </p>
              </div>

              {/* Role Selection */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Role
                </label>
                <select
                  {...register('role')}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {/* Branch Assignment (only for regular admins) */}
              {selectedRole === 'admin' && (
                <div>
                  <label className="mb-3 block text-sm font-semibold text-gray-800">
                    Branch Access
                  </label>
                  {loadingBranches ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading branches...</span>
                    </div>
                  ) : branches.length === 0 ? (
                    <p className="text-sm text-gray-600 py-2">No branches available</p>
                  ) : (
                    <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-md p-3">
                      {branches.map((branch) => (
                        <label
                          key={branch.id}
                          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBranches.includes(branch.id)}
                            onChange={() => handleBranchToggle(branch.id)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {branch.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {branch.address}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-xs text-gray-600">
                    Leave empty to grant access to all branches
                  </p>
                </div>
              )}

              {/* Password Reset Section */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Password Management</h4>
                    <p className="text-xs text-gray-600 mt-1">
                      Send password reset email to the admin user
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePasswordReset}
                    isLoading={isResettingPassword}
                    disabled={isSubmitting || isResettingPassword}
                  >
                    <KeyIcon className="w-4 h-4 mr-2" />
                    Reset Password
                  </Button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isSubmitting || isResettingPassword}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={isSubmitting || isResettingPassword}
                >
                  {isSubmitting ? 'Updating...' : 'Update Admin'}
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}