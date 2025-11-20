'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { clsx } from 'clsx'
import { LoadingSpinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext'
import SuperAdminSidebar from './components/SuperAdminSidebar'
import SuperAdminHeader from './components/SuperAdminHeader'

interface SuperAdminLayoutProps {
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

function SuperAdminLayoutInner({ children, admin }: { children: React.ReactNode, admin: AdminData | null }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <div className="flex min-w-0">
        {/* Sidebar */}
        <SuperAdminSidebar adminData={admin} />

        {/* Main content */}
        <div className={clsx(
          "flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out",
          // Desktop margins based on sidebar state
          isCollapsed ? "md:ml-20" : "md:ml-64",
          // No margin on mobile (sidebar is overlay)
          "ml-0"
        )}>
          {/* Header */}
          <SuperAdminHeader adminData={admin} />

          {/* Page content */}
          <main className="flex-1 p-4 md:p-6 min-w-0 max-w-full overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const { isAuthenticated, isLoading, admin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login')
      } else if (admin?.role !== 'super_admin') {
        // Redirect non-super admins to admin dashboard
        router.push('/admin/dashboard')
      }
    }
  }, [isAuthenticated, isLoading, admin, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!isAuthenticated || admin?.role !== 'super_admin') {
    return null // Redirect will happen in useEffect
  }

  return (
    <SidebarProvider>
      <SuperAdminLayoutInner admin={admin}>
        {children}
      </SuperAdminLayoutInner>
    </SidebarProvider>
  )
}