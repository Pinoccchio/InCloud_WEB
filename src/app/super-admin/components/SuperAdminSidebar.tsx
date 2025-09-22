'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  HomeIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { Logo } from '@/components/ui'

interface AdminData {
  id: string
  user_id: string
  email: string
  fullName: string
  role: 'admin' | 'super_admin'
  branches: string[]
}

interface SidebarProps {
  adminData: AdminData | null
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/super-admin/dashboard',
    icon: HomeIcon,
    description: 'User management overview'
  },
  {
    name: 'User Management',
    href: '/super-admin/users',
    icon: UserGroupIcon,
    description: 'Manage all system users'
  },
  {
    name: 'System Settings',
    href: '/super-admin/settings',
    icon: Cog6ToothIcon,
    description: 'System configuration'
  },
]

export default function SuperAdminSidebar({ adminData }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Logo size="lg" showText={true} />
        </div>

        {/* Super Admin Badge */}
        <div className="px-6 py-4 bg-red-50 border-b border-red-100">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
            <span className="text-sm font-semibold text-red-700">Super Admin Panel</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group',
                  isActive
                    ? 'bg-red-50 text-red-700 shadow-sm border border-red-100'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon
                  className={clsx(
                    'mr-3 flex-shrink-0 h-5 w-5 transition-colors',
                    isActive
                      ? 'text-red-600'
                      : 'text-gray-400 group-hover:text-gray-600'
                  )}
                />
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className={clsx(
                    'text-xs mt-0.5',
                    isActive
                      ? 'text-red-500'
                      : 'text-gray-500 group-hover:text-gray-600'
                  )}>
                    {item.description}
                  </div>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {adminData?.fullName?.charAt(0)?.toUpperCase() || 'S'}
                </span>
              </div>
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {adminData?.fullName || 'Super Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                System Administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}