'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Logo } from '@/components/ui'
import { createInitialSuperAdmin, type InitialSuperAdminData } from '@/lib/supabase/auth'

const superAdminSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SuperAdminFormData = z.infer<typeof superAdminSchema>

export default function SuperAdminSetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SuperAdminFormData>({
    resolver: zodResolver(superAdminSchema),
  })

  const onSubmit = async (data: SuperAdminFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      // Create initial super admin using the bootstrap function
      const adminData: InitialSuperAdminData = {
        fullName: data.fullName,
        email: data.email,
        password: data.password
      }

      const result = await createInitialSuperAdmin(adminData)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(result.error || 'Super admin creation failed')
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
        <div className="w-full max-w-lg">
          <Card variant="elevated" className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <Logo size="2xl" showText={false} />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Super Admin Setup</CardTitle>
              <CardDescription className="text-lg text-gray-800">
                Create the initial super administrator account for InCloud
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm font-medium">
                    Super admin account created successfully! Redirecting to login...
                  </p>
                </div>
              )}

              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm font-medium">
                  ⚠️ This is a one-time setup for creating the initial super administrator account.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="Full Name"
                  placeholder="Super Administrator"
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="admin@jasfoodtrading.com"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Role:</strong> Super Administrator (full system access)
                  </p>
                </div>

                <Input
                  label="Password"
                  type="password"
                  placeholder="Create a strong password"
                  error={errors.password?.message}
                  helperText="Minimum 8 characters"
                  showPasswordToggle={true}
                  {...register('password')}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  error={errors.confirmPassword?.message}
                  showPasswordToggle={true}
                  {...register('confirmPassword')}
                />

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    className="h-5 w-5 rounded border-gray-300 text-primary-500 focus:ring-primary-200 focus:ring-2 flex-shrink-0"
                    {...register('agreeToTerms')}
                  />
                  <label htmlFor="agreeToTerms" className="text-sm text-gray-800">
                    I understand the responsibilities of super administrator access and agree to the{' '}
                    <Link href="/terms" className="text-primary-600 hover:text-primary-700 transition-colors font-semibold">
                      Terms of Service
                    </Link>
                  </label>
                </div>
                {errors.agreeToTerms && (
                  <p className="text-sm text-error font-medium">{errors.agreeToTerms.message}</p>
                )}

                <Button
                  type="submit"
                  className="w-full font-semibold shadow-lg hover:shadow-xl"
                  size="lg"
                  isLoading={isLoading}
                  disabled={isLoading || success}
                >
                  {isLoading ? 'Creating Super Admin...' : success ? 'Account Created!' : 'Create Super Admin Account'}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-base text-gray-800">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="text-primary-600 hover:text-primary-700 transition-colors font-semibold"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center">
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 shadow-sm">
              <p className="text-yellow-800 font-bold text-base mb-2">🔒 Security Notice</p>
              <p className="text-yellow-700 leading-relaxed">
                This setup page should be removed after creating the initial super admin account.
                Super admin accounts have full system access and should be used responsibly.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-800 font-medium">
              © 2024 J.A&apos;s Food Trading. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}