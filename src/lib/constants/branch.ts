// Single Branch Configuration for J.A's Food Trading
// Since the client operates as a single location, we centralize all operations to the main branch

import { supabase } from '@/lib/supabase/auth'

export const MAIN_BRANCH_NAME = "J.A's Food Trading - Main Branch"

// Cache for branch ID to avoid repeated database calls
let cachedMainBranchId: string | null = null

// Helper functions for single-branch operations - now with dynamic resolution
export async function getMainBranchId(): Promise<string> {
  // Return cached value if available
  if (cachedMainBranchId) {
    return cachedMainBranchId
  }

  // Query database for the main branch (first active branch, or by name pattern)
  const { data: branches, error } = await supabase
    .from('branches')
    .select('id, name')
    .eq('is_active', true)
    .limit(1)

  if (error || !branches || branches.length === 0) {
    throw new Error('No active branch found in database')
  }

  // In single-branch mode, the first (and only) active branch is the main branch
  cachedMainBranchId = branches[0].id
  return cachedMainBranchId
}

export async function isMainBranch(branchId: string): Promise<boolean> {
  const mainBranchId = await getMainBranchId()
  return branchId === mainBranchId
}

// Since we operate as single branch, all admin operations default to main branch
export async function getDefaultBranchForAdmin(): Promise<string> {
  return await getMainBranchId()
}

// For super admins, they still get access to main branch (not empty array)
export async function getAdminBranches(role: 'admin' | 'super_admin'): Promise<string[]> {
  // Both admin and super_admin work with the main branch in single-branch mode
  const mainBranchId = await getMainBranchId()
  return [mainBranchId]
}

export async function validateBranchAccess(userBranches: string[], targetBranchId?: string): Promise<boolean> {
  const mainBranchId = await getMainBranchId()

  // In single-branch mode, if no targetBranchId provided, default to main branch
  const branchToCheck = targetBranchId || mainBranchId

  // Super admins have empty array but should access main branch
  if (userBranches.length === 0) {
    return branchToCheck === mainBranchId
  }

  // Regular admins must have main branch in their access list
  return userBranches.includes(branchToCheck) && branchToCheck === mainBranchId
}

// Synchronous version for cases where we already have the ID cached
export function getMainBranchIdSync(): string {
  if (!cachedMainBranchId) {
    throw new Error('Main branch ID not cached. Call getMainBranchId() first.')
  }
  return cachedMainBranchId
}

// Initialize cache - call this on app startup
export async function initializeBranchCache(): Promise<void> {
  await getMainBranchId()
}