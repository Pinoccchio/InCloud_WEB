'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftStartOnRectangleIcon,
  ChevronDownIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'

interface AdminData {
  id: string
  user_id: string
  email: string
  fullName: string
  role: 'admin' | 'super_admin'
  branches: string[]
}

interface SuperAdminHeaderProps {
  adminData: AdminData | null
}

export default function SuperAdminHeader({ adminData }: SuperAdminHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const { logout } = useAuth()
  const { toggleSidebar } = useSidebar()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-4 md:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Menu toggle and title */}
          <div className="flex items-center space-x-3">
            {/* Hamburger Menu Toggle */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 active:scale-95"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="hidden md:block">
              <h2 className="text-lg font-semibold text-gray-900">
                InCloud Super Admin
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                System administration and user management
              </p>
            </div>

            {/* Mobile title */}
            <div className="md:hidden">
              <h2 className="text-lg font-semibold text-gray-900">
                Super Admin
              </h2>
            </div>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {adminData?.fullName?.charAt(0)?.toUpperCase() || 'S'}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <span className="block font-medium text-gray-900 text-sm">
                  {adminData?.fullName || 'Super Admin'}
                </span>
                <span className="block text-xs text-gray-500">
                  System Administrator
                </span>
              </div>
              <ChevronDownIcon className="w-4 h-4 ml-1" />
            </button>

            {/* Dropdown */}
            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
                  <div className="py-2">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-900 truncate mt-1">
                        {adminData?.fullName || 'Super Admin'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {adminData?.email || 'admin@incloud.local'}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 flex items-center transition-colors duration-200"
                    >
                      <ArrowLeftStartOnRectangleIcon className="w-4 h-4 mr-3 text-gray-500" />
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}