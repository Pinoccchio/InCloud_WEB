'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle, Logo } from '@/components/ui'
import { sendPasswordResetEmail } from '@/lib/supabase/auth'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await sendPasswordResetEmail(data.email)

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Failed to send reset email')
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
                {success ? 'Check Your Email' : 'Forgot Password?'}
              </CardTitle>
              <CardDescription className="text-lg text-gray-800">
                {success
                  ? 'We sent a password reset link to your email'
                  : 'Enter your email to receive a password reset link'}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {success ? (
                <div className="space-y-6">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm font-medium text-center">
                      Password reset instructions have been sent to your email. Please check your inbox and spam folder.
                    </p>
                  </div>

                  <div className="text-center text-sm text-gray-600">
                    <p className="mb-4">Didn&apos;t receive the email?</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSuccess(false)
                        setError(null)
                      }}
                    >
                      Try again
                    </Button>
                  </div>

                  <Link href="/login">
                    <Button variant="outline" className="w-full font-semibold" size="lg">
                      <ArrowLeftIcon className="w-4 h-4 mr-2" />
                      Back to Login
                    </Button>
                  </Link>
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
                      label="Email Address"
                      type="email"
                      placeholder="admin@jasfoodtrading.com"
                      error={errors.email?.message}
                      {...register('email')}
                    />

                    <Button
                      type="submit"
                      className="w-full font-semibold shadow-lg hover:shadow-xl"
                      size="lg"
                      isLoading={isLoading}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>

                    <Link href="/login">
                      <Button variant="ghost" className="w-full font-semibold" size="lg">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        Back to Login
                      </Button>
                    </Link>
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