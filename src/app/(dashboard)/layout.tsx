'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentSession } from '@/lib/supabase/auth'
import { LoadingSpinner } from '@/components/ui'
import Sidebar from './components/Sidebar'
import Header from './components/Header'

interface AdminData {
  id: string
  user_id: string
  email: string
  fullName: string
  role: 'admin' | 'super_admin'
  branches: string[]
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [adminData, setAdminData] = useState<AdminData | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const result = await getCurrentSession()

      if (!result.success || !result.data?.admin) {
        router.push('/login')
        return
      }

      // Verify super admin or admin role
      const { admin } = result.data
      if (!admin.role || (admin.role !== 'super_admin' && admin.role !== 'admin')) {
        router.push('/login')
        return
      }

      setAdminData(admin as AdminData)
      setIsAuthenticated(true)
    }

    checkAuth()
  }, [router])

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Redirect will happen in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar adminData={adminData} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen ml-64">
          {/* Header */}
          <Header adminData={adminData} />

          {/* Page content */}
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}