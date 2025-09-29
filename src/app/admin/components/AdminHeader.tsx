'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeftStartOnRectangleIcon,
  UserIcon,
  ChevronDownIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { useSidebar } from '@/contexts/SidebarContext'
import NotificationDropdown from '@/components/ui/NotificationDropdown'

interface AdminData {
  id: string
  user_id: string
  email: string
  fullName: string
  role: 'admin' | 'super_admin'
}

interface AdminHeaderProps {
  adminData: AdminData | null
}

export default function AdminHeader({ adminData }: AdminHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const { logout } = useAuth()
  const { toggleSidebar } = useSidebar()
  const router = useRouter()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const getManagingContext = () => {
    if (!adminData) return 'Loading...'

    if (adminData.role === 'super_admin') {
      return 'System-wide (All Branches)'
    } else {
      return 'J.A\'s Food Trading - Main Branch'
    }
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
              className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-95"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>

            {/* Title */}
            <div className="hidden md:block">
              <h2 className="text-lg font-semibold text-gray-900">
                InCloud Admin
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Managing: {getManagingContext()}
              </p>
            </div>

            {/* Mobile title */}
            <div className="md:hidden">
              <h2 className="text-lg font-semibold text-gray-900">
                Admin
              </h2>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <NotificationDropdown
              isOpen={showNotifications}
              onToggle={() => setShowNotifications(!showNotifications)}
              onClose={() => setShowNotifications(false)}
            />

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