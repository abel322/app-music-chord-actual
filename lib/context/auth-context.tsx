'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export interface AuthUser {
  email?: string
  name?: string
}

export interface AuthContextType {
  isAdmin: boolean
  isLoading: boolean
  user: AuthUser | null
  login: (password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  isAdmin: false,
  isLoading: true,
  user: null,
  login: async () => false,
  logout: async () => {},
  refreshSession: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Consulta el endpoint de sesión para determinar si es Administrador o Invitado
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setIsAdmin(Boolean(data.isAdmin))
        setUser(data.user || null)
      } else {
        setIsAdmin(false)
        setUser(null)
      }
    } catch (err) {
      console.error('Error al verificar sesión:', err)
      setIsAdmin(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  // Iniciar sesión con contraseña de administrador
  const login = useCallback(
    async (password: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        })

        const data = await res.json()
        if (res.ok && data.success) {
          setIsAdmin(true)
          setUser(data.user || { email: 'utreraabel91@gmail.com', name: 'Abel' })
          router.refresh()
          return true
        }
        return false
      } catch (err) {
        console.error('Error en login:', err)
        return false
      }
    },
    [router]
  )

  // Cerrar sesión de administrador y regresar a modo lectura público
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch (err) {
      console.error('Error en logout:', err)
    } finally {
      setIsAdmin(false)
      setUser(null)
      router.refresh()
    }
  }, [router])

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        isLoading,
        user,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook para consumir el estado de autenticación de Administrador
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider')
  }
  return context
}

export { AuthContext }
