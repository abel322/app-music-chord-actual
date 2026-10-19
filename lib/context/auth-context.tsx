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
  login: (emailOrPassword?: string, password?: string) => Promise<boolean>
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

  // Inicialización inmediata desde localStorage para evitar cualquier parpadeo de carga
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('musicchord_admin_active') === 'true'
    }
    return false
  })

  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('musicchord_admin_active') === 'true') {
      return { email: 'utreraabel91@gmail.com', name: 'Abel' }
    }
    return null
  })

  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Consulta el endpoint de sesión para verificar la cookie HTTP-only
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
      })

      if (res.ok) {
        const data = await res.json()
        if (data.isAdmin) {
          setIsAdmin(true)
          setUser(data.user || { email: 'utreraabel91@gmail.com', name: 'Abel' })
          if (typeof window !== 'undefined') {
            localStorage.setItem('musicchord_admin_active', 'true')
          }
        } else {
          setIsAdmin(false)
          setUser(null)
          if (typeof window !== 'undefined') {
            localStorage.removeItem('musicchord_admin_active')
          }
        }
      } else {
        setIsAdmin(false)
        setUser(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('musicchord_admin_active')
        }
      }
    } catch (err) {
      console.error('Error al verificar sesión:', err)
      setIsAdmin(false)
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('musicchord_admin_active')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  // Iniciar sesión con email y contraseña (o contraseña directa)
  const login = useCallback(
    async (emailOrPassword?: string, maybePassword?: string): Promise<boolean> => {
      let email = ''
      let password = ''

      if (maybePassword !== undefined) {
        email = emailOrPassword || ''
        password = maybePassword
      } else {
        email = 'utreraabel91@gmail.com'
        password = emailOrPassword || ''
      }

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password: password.trim() }),
        })

        const data = await res.json()

        if (res.ok && data.success) {
          // Actualizar inmediatamente el estado en memoria
          setIsAdmin(true)
          setUser(data.user || { email: 'utreraabel91@gmail.com', name: 'Abel' })

          // Bandera de soporte en localStorage para evitar parpadeos
          if (typeof window !== 'undefined') {
            localStorage.setItem('musicchord_admin_active', 'true')
          }

          return true
        }

        // Si la respuesta no es exitosa, no permitir la sesión
        if (typeof window !== 'undefined') {
          localStorage.removeItem('musicchord_admin_active')
        }
        return false
      } catch (err) {
        console.error('Error en login:', err)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('musicchord_admin_active')
        }
        return false
      }
    },
    []
  )

  // Cerrar sesión de administrador limpiamente
  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })

      // Cerrar sesión NextAuth en cliente si estuviese montada
      try {
        const { signOut } = await import('next-auth/react')
        await signOut({ redirect: false })
      } catch {
        // Silencioso si no aplica
      }
    } catch (err) {
      console.error('Error en logout:', err)
    } finally {
      setIsAdmin(false)
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('musicchord_admin_active')
      }
      window.location.href = '/dashboard/songs/chords'
    }
  }, [])

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
