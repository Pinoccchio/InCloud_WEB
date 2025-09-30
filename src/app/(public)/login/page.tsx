'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Logo } from '@/components/ui'
import { loginAdmin, type LoginCredentials } from '@/lib/supabase/auth'
import { useAuth } from '@/contexts/AuthContext'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { login } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })


  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await loginAdmin(data as LoginCredentials)

      if (result.success && result.data) {
        // Update auth context with login data
        login(result.data.user, result.data.session, {
          ...result.data.admin,
          role: result.data.admin.role as 'admin' | 'super_admin'
        })
        // Redirect based on role
        if (result.data.admin.role === 'super_admin') {
          router.push('/super-admin/dashboard')
        } else {
          router.push('/admin/dashboard')
        }
      } else {
        setError(result.error || 'Login failed')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-primary-500 opacity-5 transform skew-x-12 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-2/3 bg-secondary-500 opacity-5 transform -skew-x-12 -translate-x-1/4"></div>

      <div className="flex items-center justify-center min-h-screen p-6 relative z-10">
        <div className="w-full max-w-md">
          <Card variant="elevated" className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <Logo size="2xl" showText={false} />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</CardTitle>
              <CardDescription className="text-lg text-gray-800">
                Sign in to your admin account to manage inventory
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="admin@jasfoodtrading.com"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  showPasswordToggle={true}
                  {...register('password')}
                />

                <div className="flex items-center justify-between">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full font-semibold shadow-lg hover:shadow-xl"
                  size="lg"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Button>
              </form>
            </CardContent>
          </Card>


          <div className="mt-8 text-center">
            <p className="text-sm text-gray-800 font-medium">
              © 2024 J.A&apos;s Food Trading. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}