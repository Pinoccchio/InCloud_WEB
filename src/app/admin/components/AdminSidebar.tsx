'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import {
  HomeIcon,
  CubeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
  BuildingStorefrontIcon,
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
    href: '/admin/dashboard',
    icon: HomeIcon,
    description: 'Overview and metrics'
  },
  {
    name: 'Products',
    href: '/admin/products',
    icon: CubeIcon,
    description: 'Product catalog management'
  },
  {
    name: 'Inventory',
    href: '/admin/inventory',
    icon: BuildingStorefrontIcon,
    description: 'Stock levels and transfers'
  },
  {
    name: 'Orders',
    href: '/admin/orders',
    icon: ClipboardDocumentListIcon,
    description: 'Order processing and tracking'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: ChartBarIcon,
    description: 'Reports and insights'
  },
  {
    name: 'Alerts',
    href: '/admin/alerts',
    icon: BellIcon,
    description: 'Notifications and warnings'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Cog6ToothIcon,
    description: 'Preferences and audit logs'
  },
]

export default function AdminSidebar({ adminData }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <Logo size="lg" showText={true} />
        </div>

        {/* Admin Badge */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-sm font-semibold text-blue-700">Admin Panel</span>
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
                    ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon
                  className={clsx(
                    'mr-3 flex-shrink-0 h-5 w-5 transition-colors',
                    isActive
                      ? 'text-primary-600'
                      : 'text-gray-400 group-hover:text-gray-600'
                  )}
                />
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className={clsx(
                    'text-xs mt-0.5',
                    isActive
                      ? 'text-primary-500'
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
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {adminData?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {adminData?.fullName || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                Administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}