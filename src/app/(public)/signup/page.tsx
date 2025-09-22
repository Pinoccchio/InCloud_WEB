'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Logo } from '@/components/ui'
import { ChevronDownIcon } from '@heroicons/react/24/outline'
import { signupAdmin, getBranches, type SignupData } from '@/lib/supabase/auth'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.literal('admin'),
  branches: z.array(z.string()).optional(),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([])
  const [selectedBranches, setSelectedBranches] = useState<string[]>([])
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  useEffect(() => {
    const fetchBranches = async () => {
      const result = await getBranches()
      if (result.success && result.data) {
        setBranches(result.data)
      }
    }
    fetchBranches()
  }, [])

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const signupData: SignupData = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
        branches: selectedBranches.length > 0 ? selectedBranches : undefined
      }

      const result = await signupAdmin(signupData)

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(result.error || 'Account creation failed')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-secondary-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-secondary-500 opacity-5 transform skew-x-12 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-1/4 h-2/3 bg-primary-500 opacity-5 transform -skew-x-12 -translate-x-1/4"></div>

      <div className="flex items-center justify-center min-h-screen p-6 relative z-10">
        <div className="w-full max-w-lg">
          <Card variant="elevated" className="shadow-xl border-0">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-6">
                <Logo size="2xl" showText={false} />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">Request Admin Access</CardTitle>
              <CardDescription className="text-lg text-gray-800">
                Create an admin account for J.A&apos;s Food Trading inventory system
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
                    Account created successfully! Redirecting to login...
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
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

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-12 text-sm text-gray-900 ring-offset-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all appearance-none"
                      {...register('role')}
                    >
                      <option value="" className="text-gray-500">Select a role</option>
                      <option value="admin" className="text-gray-900">Admin</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  {errors.role && (
                    <p className="mt-1 text-sm text-error font-medium">{errors.role.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-800">
                    Branch Access (Optional)
                  </label>
                  <div className="relative">
                    <select
                      disabled={branches.length === 0}
                      className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-12 text-sm text-gray-900 ring-offset-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50 transition-all appearance-none"
                      value={selectedBranches[0] || ''}
                      onChange={(e) => {
                        setSelectedBranches(e.target.value ? [e.target.value] : [])
                      }}
                    >
                      {branches.length === 0 ? (
                        <option value="" className="text-gray-400">No branches configured yet</option>
                      ) : (
                        <>
                          <option value="" className="text-gray-500">All branches (default)</option>
                          {branches.map((branch) => (
                            <option key={branch.id} value={branch.id} className="text-gray-900">
                              {branch.name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <ChevronDownIcon className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    {branches.length === 0
                      ? "Branches must be created by Super Admin first"
                      : "Select a specific branch or leave as default for all access"
                    }
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
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary-600 hover:text-primary-700 transition-colors font-semibold">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary-600 hover:text-primary-700 transition-colors font-semibold">
                      Privacy Policy
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
                  {isLoading ? 'Creating Account...' : success ? 'Account Created!' : 'Create Admin Account'}
                </Button>

                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-800 font-medium">or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full font-semibold shadow-sm hover:shadow-md"
                  size="lg"
                  onClick={() => {
                    // TODO: Implement Gmail OAuth
                    console.log('Gmail OAuth not implemented yet')
                  }}
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign up with Google
                </Button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-base text-gray-800">
                  Already have an admin account?{' '}
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