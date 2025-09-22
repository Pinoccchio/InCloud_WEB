'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { getCurrentSession, signOut } from '@/lib/supabase/auth'

interface AdminData {
  id: string
  user_id: string
  email: string
  fullName: string
  role: 'admin' | 'super_admin'
  branches: string[]
  last_login: string | null
}

interface User {
  id: string
  email?: string
}

interface Session {
  access_token: string
  user: { id: string }
}

interface AuthState {
  user: User | null
  session: Session | null
  admin: AdminData | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (user: User, session: Session, admin: AdminData) => void
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    admin: null,
    isAuthenticated: false,
    isLoading: true,
  })

  const login = (user: User, session: Session, admin: AdminData) => {
    setAuthState({
      user,
      session,
      admin,
      isAuthenticated: true,
      isLoading: false,
    })
  }

  const logout = async () => {
    try {
      await signOut()
    } finally {
      // Clear auth state regardless of signOut result
      setAuthState({
        user: null,
        session: null,
        admin: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }

  const refreshAuth = async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }))

    try {
      const result = await getCurrentSession()

      if (result.success && result.data?.admin) {
        const { user, session, admin } = result.data
        setAuthState({
          user,
          session,
          admin: admin as AdminData,
          isAuthenticated: true,
          isLoading: false,
        })
      } else {
        setAuthState({
          user: null,
          session: null,
          admin: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } catch (error) {
      console.error('Auth refresh error:', error)
      setAuthState({
        user: null,
        session: null,
        admin: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }

  // Check authentication status on mount
  useEffect(() => {
    refreshAuth()
  }, [])

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshAuth,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}