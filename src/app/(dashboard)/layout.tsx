'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

export default function DashboardLayout() {
  const { isAuthenticated, isLoading, admin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    console.log('Dashboard redirect check:', { isLoading, isAuthenticated, admin: admin?.role || null })

    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('Redirecting to login - not authenticated')
        router.push('/login')
      } else if (isAuthenticated && admin) {
        // Redirect based on role
        if (admin.role === 'super_admin') {
          console.log('Redirecting super admin to /super-admin/dashboard')
          router.push('/super-admin/dashboard')
        } else if (admin.role === 'admin') {
          console.log('Redirecting admin to /admin/dashboard')
          router.push('/admin/dashboard')
        }
      } else if (isAuthenticated && !admin) {
        console.log('Authenticated but admin data not loaded yet, waiting...')
      }
    }
  }, [isAuthenticated, isLoading, admin, router])

  if (isLoading || (isAuthenticated && !admin)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">
            {isLoading ? 'Loading...' : 'Redirecting to your dashboard...'}
          </p>
        </div>
      </div>
    )
  }

  // This layout is just for redirecting, no actual content
  return null
}