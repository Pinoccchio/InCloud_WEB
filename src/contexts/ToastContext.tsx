'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAllToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (toastData: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const duration = toastData.duration || 5000 // Default 5 seconds

    const newToast: Toast = {
      ...toastData,
      id,
      duration
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove toast after duration
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const clearAllToasts = () => {
    setToasts([])
  }

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAllToasts }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Convenience hooks for different toast types
export function useToastActions() {
  const { addToast } = useToast()

  return {
    success: (title: string, message?: string, options?: Partial<Toast>) =>
      addToast({ type: 'success', title, message, ...options }),

    error: (title: string, message?: string, options?: Partial<Toast>) =>
      addToast({ type: 'error', title, message, duration: 0, ...options }), // Don't auto-hide errors

    warning: (title: string, message?: string, options?: Partial<Toast>) =>
      addToast({ type: 'warning', title, message, ...options }),

    info: (title: string, message?: string, options?: Partial<Toast>) =>
      addToast({ type: 'info', title, message, ...options })
  }
}