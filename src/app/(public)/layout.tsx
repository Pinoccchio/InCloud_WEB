'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Header, Footer } from '@/components/layout'
import { LoadingSpinner } from '@/components/ui'
import { useAuth } from '@/contexts/AuthContext'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading, admin } = useAuth()
  const isAuthPage = pathname === '/login' || pathname === '/signup'
  const isSetupPage = pathname === '/super-admin-setup'

  // Redirect authenticated users away from auth pages to role-specific dashboards
  useEffect(() => {
    if (!isLoading && isAuthenticated && (isAuthPage || isSetupPage)) {
      if (admin) {
        // Redirect based on role
        if (admin.role === 'super_admin') {
          router.push('/super-admin/dashboard')
        } else if (admin.role === 'admin') {
          router.push('/admin/dashboard')
        }
      } else {
        // If admin data not loaded yet, redirect to generic dashboard which will handle role redirection
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, isLoading, admin, isAuthPage, isSetupPage, router])

  // Show loading while checking auth status for auth pages
  if (isLoading && (isAuthPage || isSetupPage)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render auth pages if authenticated (redirect is happening)
  if (isAuthenticated && (isAuthPage || isSetupPage)) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header variant={isAuthPage ? 'auth' : 'landing'} />
      {isAuthPage ? (
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          {children}
        </main>
      ) : (
        <>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </>
      )}
    </div>
  )
}