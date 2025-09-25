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
import { useSidebar } from '@/contexts/SidebarContext'

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
  const { isCollapsed, isMobileOpen, closeMobileSidebar } = useSidebar()

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={clsx(
        "fixed inset-y-0 left-0 z-50 bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ease-in-out",
        // Desktop behavior
        "hidden md:block",
        isCollapsed ? "md:w-20" : "md:w-64",
        // Mobile behavior
        "md:translate-x-0",
        isMobileOpen ? "block w-64 translate-x-0" : "block w-64 -translate-x-full"
      )}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className={clsx(
          "flex items-center h-16 border-b border-gray-200 transition-all duration-300",
          isCollapsed ? "px-3 justify-center" : "px-6"
        )}>
          {isCollapsed ? (
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">IC</span>
            </div>
          ) : (
            <Logo size="lg" showText={true} />
          )}
        </div>

        {/* Navigation */}
        <nav className={clsx(
          "flex-1 py-6 space-y-2 overflow-y-auto transition-all duration-300",
          isCollapsed ? "px-2" : "px-4"
        )}>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <div key={item.name} className="relative group">
                <Link
                  href={item.href}
                  className={clsx(
                    'flex items-center text-sm font-medium rounded-lg transition-all duration-200 group relative',
                    isCollapsed
                      ? 'px-3 py-3 justify-center'
                      : 'px-4 py-3',
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm border border-primary-100'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={clsx(
                      'flex-shrink-0 h-5 w-5 transition-colors',
                      isCollapsed ? '' : 'mr-3',
                      isActive
                        ? 'text-primary-600'
                        : 'text-gray-400 group-hover:text-gray-600'
                    )}
                  />
                  {!isCollapsed && (
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
                  )}
                </Link>

                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-300 mt-0.5">{item.description}</div>
                    <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        {/* User info */}
        <div className={clsx(
          "border-t border-gray-200 bg-gray-50 transition-all duration-300",
          isCollapsed ? "p-3" : "p-4"
        )}>
          <div className={clsx(
            "flex items-center",
            isCollapsed ? "justify-center" : ""
          )}>
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {adminData?.fullName?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
            </div>
            {!isCollapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {adminData?.fullName || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Administrator
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}