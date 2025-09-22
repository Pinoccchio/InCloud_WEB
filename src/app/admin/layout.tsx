'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import AdminSidebar from './components/AdminSidebar'
import AdminHeader from './components/AdminHeader'

interface AdminLayoutProps {
  children: React.ReactNode
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <AdminSidebar adminData={admin} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen ml-64">
          {/* Header */}
          <AdminHeader adminData={admin} />

          {/* Page content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}