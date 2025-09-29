'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { LoadingSpinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import { NotificationProvider } from '@/contexts/NotificationContext'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'

interface AdminLayoutProps {
  children: React.ReactNode
}

// Inner layout component that uses the sidebar context
interface AdminData {
  id: string
  user_id: string
  email: string
  fullName: string
  role: 'admin' | 'super_admin'
  branches: string[]
}

function AdminLayoutInner({ children, admin }: { children: React.ReactNode, admin: AdminData | null }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="flex min-w-0">
        {/* Sidebar */}
        <AdminSidebar adminData={admin} />

        {/* Main content */}
        <div className={clsx(
          "flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out",
          // Desktop margins based on sidebar state
          isCollapsed ? "md:ml-20" : "md:ml-64",
          // No margin on mobile (sidebar is overlay)
          "ml-0"
        )}>
          {/* Header */}
          <AdminHeader adminData={admin} />

          {/* Page content */}
          <main className="flex-1 p-4 md:p-6 min-w-0 max-w-full overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthenticated, isLoading, admin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (admin?.role !== 'admin') {
        // Redirect super admins to their dashboard
        router.push('/super-admin/dashboard')
      }
    }
  }, [isAuthenticated, isLoading, admin, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || admin?.role !== 'admin') {
    return null // Redirect will happen in useEffect
  }

  return (
    <SidebarProvider>
      <NotificationProvider>
        <AdminLayoutInner admin={admin}>
          {children}
        </AdminLayoutInner>
      </NotificationProvider>
    </SidebarProvider>
  )
}