'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isAuthenticated, isLoading, admin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !admin) {
    return null // Redirect will happen in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar adminData={admin} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen ml-64">
          {/* Header */}
          <Header adminData={admin} />

          {/* Page content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}