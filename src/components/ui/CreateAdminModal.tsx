'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline'
import { Button } from './Button'
import { Input } from './Input'
import { useToastActions } from '@/contexts/ToastContext'
import { useAuth } from '@/contexts/AuthContext'

// Form validation schema
const createAdminSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['admin', 'super_admin'])
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type CreateAdminFormData = z.infer<typeof createAdminSchema>

interface CreateAdminModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateAdminModal({ isOpen, onClose, onSuccess }: CreateAdminModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success, error } = useToastActions()
  const { admin: currentAdmin } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<CreateAdminFormData>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      role: 'admin'
    }
  })


  const onSubmit = async (data: CreateAdminFormData) => {
    if (!currentAdmin) {
      error('Authentication Error', 'You must be logged in to create admin users')
      return
    }

    try {
      setIsSubmitting(true)

      // Create Supabase Auth user using service role with admin context
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          fullName: data.fullName,
          role: data.role,
          currentAdminId: currentAdmin.id,
          currentAdminRole: currentAdmin.role
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create admin user')
      }

      // Success
      success('Admin Created', `New ${data.role.replace('_', ' ')} account created successfully`)
      reset()
      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error creating admin:', err)
      error(
        'Creation Failed',
        err instanceof Error ? err.message : 'Failed to create admin user'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />

      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center">
          <DialogPanel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-4">
                  <UserPlusIcon className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    Create New Admin
                  </DialogTitle>
                  <p className="text-sm text-gray-600">
                    Add a new admin user to the system
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
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

              {/* Email */}
              <Input
                label="Email Address"
                type="email"
                placeholder="admin@jasfoodtrading.com"
                error={errors.email?.message}
                {...register('email')}
              />

              {/* Password */}
              <Input
                label="Password"
                type="password"
                placeholder="Minimum 8 characters"
                showPasswordToggle
                error={errors.password?.message}
                {...register('password')}
              />

              {/* Confirm Password */}
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Re-enter password"
                showPasswordToggle
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

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


              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Admin...' : 'Create Admin'}
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}