'use client'

import React from 'react'
import { SessionProvider } from 'next-auth/react'
import { AuthProvider as CustomAuthProvider, useAuth, AuthContext } from '@/lib/context/auth-context'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CustomAuthProvider>{children}</CustomAuthProvider>
    </SessionProvider>
  )
}

export { useAuth, AuthContext }
