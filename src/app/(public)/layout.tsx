'use client'

import { usePathname } from 'next/navigation'
import { Header, Footer } from '@/components/layout'

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isAuthPage = pathname === '/login' || pathname === '/signup'

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