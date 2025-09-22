'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import {
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '@/contexts/AuthContext'
import { clsx } from 'clsx'

interface AdminData {
  id: string
  user_id: string
  email: string
  fullName: string
  role: 'admin' | 'super_admin'
  branches: string[]
}

interface HeaderProps {
  adminData: AdminData | null
}

export default function Header({ adminData }: HeaderProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const router = useRouter()
  const { logout } = useAuth()

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Page title and breadcrumb would go here */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {adminData?.role === 'super_admin' ? 'Super Admin Dashboard' : 'Admin Dashboard'}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, {adminData?.fullName || 'Admin'}
            </p>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User menu */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center p-2 text-sm rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-sm font-medium text-white">
                    {adminData?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                  </span>
                </div>
                <div className="text-left">
                  <div className="font-medium">{adminData?.fullName || 'Admin'}</div>
                  <div className="text-xs text-gray-500 capitalize">
                    {adminData?.role?.replace('_', ' ') || 'Admin'}
                  </div>
                </div>
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white divide-y divide-gray-100 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="p-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={clsx(
                            'flex items-center w-full px-4 py-2 text-sm text-left rounded-md transition-colors',
                            active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                          )}
                        >
                          <UserCircleIcon className="mr-3 h-4 w-4" />
                          Profile Settings
                        </button>
                      )}
                    </Menu.Item>

                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={clsx(
                            'flex items-center w-full px-4 py-2 text-sm text-left rounded-md transition-colors',
                            active ? 'bg-gray-50 text-gray-900' : 'text-gray-700'
                          )}
                        >
                          <Cog6ToothIcon className="mr-3 h-4 w-4" />
                          Account Settings
                        </button>
                      )}
                    </Menu.Item>
                  </div>

                  <div className="p-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleSignOut}
                          disabled={isSigningOut}
                          className={clsx(
                            'flex items-center w-full px-4 py-2 text-sm text-left rounded-md transition-colors',
                            active ? 'bg-red-50 text-red-700' : 'text-red-600',
                            isSigningOut && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                          {isSigningOut ? 'Signing out...' : 'Sign out'}
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </header>
  )
}