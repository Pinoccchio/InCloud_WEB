'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import SuperAdminSidebar from './components/SuperAdminSidebar'
import SuperAdminHeader from './components/SuperAdminHeader'

interface SuperAdminLayoutProps {
  children: React.ReactNode
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
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Loading super admin panel...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || admin?.role !== 'super_admin') {
    return null // Redirect will happen in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <SuperAdminSidebar adminData={admin} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen ml-64">
          {/* Header */}
          <SuperAdminHeader adminData={admin} />

          {/* Page content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}