'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon, PencilIcon, KeyIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'
import { Input } from './Input'
import { useToastActions } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'

// Form validation schema
const editAdminSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  role: z.enum(['admin', 'super_admin']),
  isActive: z.boolean()
})

type EditAdminFormData = z.infer<typeof editAdminSchema>

interface AdminUser {
  id: string
  user_id: string
  full_name: string
  email?: string
  role: 'admin' | 'super_admin'
  is_active: boolean
  branches?: string[]
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
  const { success, error } = useToastActions()
  const { admin: currentAdmin } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<EditAdminFormData>({
    resolver: zodResolver(editAdminSchema)
  })

  // Load admin data into form when modal opens or admin changes
  useEffect(() => {
    if (isOpen && admin) {
      reset({
        fullName: admin.full_name,
        role: admin.role,
        isActive: admin.is_active
      })
    }
  }, [isOpen, admin, reset])

  // Check if current admin can edit the target admin
  const canEditAdmin = () => {
    if (!currentAdmin || !admin) return false

    // Must be super admin to edit any admin
    if (currentAdmin.role !== 'super_admin') return false

    // Super admin can edit their own profile
    if (admin.id === currentAdmin.id) return true

    // Super admin cannot edit other super admins
    if (admin.role === 'super_admin' && admin.id !== currentAdmin.id) return false

    // Super admin can edit regular admins
    return admin.role === 'admin'
  }

  // Check if current admin can toggle status
  const canToggleStatus = () => {
    if (!currentAdmin || !admin) return false

    // Must be super admin to toggle status
    if (currentAdmin.role !== 'super_admin') return false

    // Super admin CANNOT toggle their own status (security protection)
    if (admin.id === currentAdmin.id) return false

    // Super admin cannot toggle other super admin status
    if (admin.role === 'super_admin' && admin.id !== currentAdmin.id) return false

    // Super admin can toggle regular admin status
    return admin.role === 'admin'
  }

  const onSubmit = async (data: EditAdminFormData) => {
    if (!admin || !currentAdmin) return

    // Check permissions before submitting
    if (!canEditAdmin()) {
      error(
        'Permission Denied',
        admin.role === 'super_admin'
          ? 'You cannot edit other super admin profiles. You can only edit your own profile.'
          : 'You do not have permission to edit this admin profile.'
      )
      return
    }

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
          isActive: data.isActive,
          currentAdminId: currentAdmin.id,
          currentAdminRole: currentAdmin.role
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update admin user')
      }

      success('Admin Updated', 'Admin details have been updated successfully')
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error updating admin:', err)
      error(
        'Update Failed',
        err instanceof Error ? err.message : 'Failed to update admin user'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!admin || !currentAdmin) {
      error('Authentication Error', 'You must be logged in to reset passwords')
      return
    }

    try {
      setIsResettingPassword(true)

      const response = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: admin.id,
          currentAdminId: currentAdmin.id,
          currentAdminRole: currentAdmin.role
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reset password')
      }

      success(
        'Password Reset Sent',
        `Password reset email sent to ${result.email}`
      )
    } catch (err) {
      console.error('Error resetting password:', err)
      error(
        'Password Reset Failed',
        err instanceof Error ? err.message : 'Failed to reset password'
      )
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
    <Dialog open={isOpen} onClose={handleClose} className="relative z-60">
      <div className="fixed inset-0 bg-black/25 z-60" />

      <div className="fixed inset-0 overflow-y-auto z-60">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all z-60 relative">
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
                {admin?.role === 'super_admin' ? (
                  <div>
                    <div className="flex h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      Super Admin
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Super admin role cannot be changed
                    </p>
                  </div>
                ) : (
                  <select
                    {...register('role')}
                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 ring-offset-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                )}
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
              </div>

              {/* Account Status */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-800">
                  Account Status
                </label>
                {canToggleStatus() ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        {...register('isActive')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-900">Account is active</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      {admin.is_active ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />
                      ) : (
                        <XCircleIcon className="w-5 h-5 text-red-500 mt-0.5" />
                      )}
                      <div>
                        <p className="text-sm text-gray-700">
                          {admin.is_active
                            ? 'This admin can access the system and perform their assigned tasks.'
                            : 'This admin cannot access the system. Deactivated accounts retain their data but cannot log in.'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex h-10 w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-600 items-center">
                      {admin.is_active ? (
                        <>
                          <CheckCircleIcon className="w-4 h-4 text-green-500 mr-2" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="w-4 h-4 text-red-500 mr-2" />
                          Inactive
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {admin.id === currentAdmin?.id
                        ? 'You cannot change your own account status'
                        : 'Account status cannot be changed for this user'
                      }
                    </p>
                  </div>
                )}
              </div>


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