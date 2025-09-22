'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftStartOnRectangleIcon,
  UserIcon,
  ChevronDownIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

interface AdminData {
  id: string
  user_id: string
  email: string
  fullName: string
  role: 'admin' | 'super_admin'
  branches: string[]
}

interface AdminHeaderProps {
  adminData: AdminData | null
}

export default function AdminHeader({ adminData }: AdminHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const { logout } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const formatBranches = (branches: string[]) => {
    if (!branches || branches.length === 0) return 'All branches'
    if (branches.length === 1) return branches[0]
    return `${branches.length} branches`
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title and Branch Info */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              InCloud Admin
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Managing: {formatBranches(adminData?.branches || [])}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-3 text-sm text-gray-700 hover:text-gray-900 focus:outline-none"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="font-medium">{adminData?.fullName || 'Admin'}</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </div>
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs text-gray-500">Signed in as</p>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {adminData?.email}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                      >
                        <ArrowLeftStartOnRectangleIcon className="w-4 h-4 mr-2 text-gray-500" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}