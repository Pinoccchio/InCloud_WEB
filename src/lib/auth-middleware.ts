import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// For now, use a simpler approach with service role for admin operations
// This bypasses RLS for authenticated admin operations
export async function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Create regular client for non-privileged operations
export async function createRegularClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Get current admin context from request body (passed from authenticated frontend)
export async function getCurrentAdminContext(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentAdminId, currentAdminRole } = body

    if (!currentAdminId || !currentAdminRole) {
      throw new Error('Missing current admin context')
    }

    if (!['admin', 'super_admin'].includes(currentAdminRole)) {
      throw new Error('Invalid admin role')
    }

    const client = await createAdminClient()

    return {
      client,
      currentAdminId,
      currentAdminRole: currentAdminRole as 'admin' | 'super_admin',
      requestBody: body
    }
  } catch {
    throw new Error('Authentication required - invalid admin context')
  }
}

// Validate super admin permissions with context
export async function validateSuperAdminWithContext(request: NextRequest) {
  const context = await getCurrentAdminContext(request)

  if (context.currentAdminRole !== 'super_admin') {
    throw new Error('Super admin access required')
  }

  return context
}

// Create IP and User Agent metadata for audit logs
export function getRequestMetadata(request: NextRequest) {
  return {
    ip_address: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
    user_agent: request.headers.get('user-agent') || 'unknown',
    timestamp: new Date().toISOString()
  }
}