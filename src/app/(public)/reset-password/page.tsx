'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Logo } from '@/components/ui'
import { updatePassword } from '@/lib/supabase/auth'
import { supabase } from '@/lib/supabase/auth'

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  useEffect(() => {
    // Check if user has a valid password recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setIsValidSession(true)
      } else {
        setError('Invalid or expired reset link. Please request a new password reset.')
      }
    }

    checkSession()
  }, [])

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await updatePassword(data.password)

      if (result.success) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(result.error || 'Failed to update password')
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
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                {success ? 'Password Updated!' : 'Reset Your Password'}
              </CardTitle>
              <CardDescription className="text-lg text-gray-800">
                {success
                  ? 'Redirecting you to login...'
                  : 'Enter your new password below'}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {success ? (
                <div className="space-y-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm font-medium text-center">
                      Your password has been successfully updated. You can now login with your new password.
                    </p>
                  </div>
                </div>
              ) : !isValidSession ? (
                <div className="space-y-6">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                  </div>

                  <Button
                    onClick={() => router.push('/forgot-password')}
                    className="w-full font-semibold shadow-lg hover:shadow-xl"
                    size="lg"
                  >
                    Request New Reset Link
                  </Button>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-800 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input
                      label="New Password"
                      type="password"
                      placeholder="Enter your new password"
                      error={errors.password?.message}
                      showPasswordToggle={true}
                      {...register('password')}
                    />

                    <Input
                      label="Confirm Password"
                      type="password"
                      placeholder="Confirm your new password"
                      error={errors.confirmPassword?.message}
                      showPasswordToggle={true}
                      {...register('confirmPassword')}
                    />

                    <Button
                      type="submit"
                      className="w-full font-semibold shadow-lg hover:shadow-xl"
                      size="lg"
                      isLoading={isLoading}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Updating Password...' : 'Update Password'}
                    </Button>
                  </form>
                </>
              )}
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