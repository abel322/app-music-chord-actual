'use client'

import React, { useState } from 'react'
import { Lock, Eye, EyeOff, X, KeyRound, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/context/auth-context'

interface AdminLoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminLoginModal({ isOpen, onClose }: AdminLoginModalProps) {
  const { login } = useAuth()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setErrorMessage('Por favor ingresa la contraseña')
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const ok = await login(password.trim())
      if (ok) {
        setSuccess(true)
        setTimeout(() => {
          setSuccess(false)
          setPassword('')
          onClose()
        }, 800)
      } else {
        setErrorMessage('Contraseña de administrador incorrecta')
      }
    } catch {
      setErrorMessage('Ocurrió un error al verificar credenciales')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white relative animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={() => {
            setErrorMessage(null)
            setPassword('')
            onClose()
          }}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado con Ícono */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-primary-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/30 mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            Acceso Administrador
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
            Ingresa tu contraseña para habilitar la creación, edición y administración de canciones y progresiones.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-red-300 text-xs font-semibold text-center">
            {errorMessage}
          </div>
        )}

        {success ? (
          <div className="py-6 flex flex-col items-center justify-center text-emerald-400 text-center animate-in zoom-in-95">
            <CheckCircle2 className="w-10 h-10 mb-2 animate-bounce" />
            <p className="text-sm font-bold">¡Bienvenido Abel!</p>
            <p className="text-xs text-slate-400 mt-0.5">Acceso administrativo desbloqueado</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label 
                htmlFor="admin-password-input"
                className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                <span>Contraseña de Administrador</span>
              </label>

              <div className="relative">
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce la clave maestra..."
                  autoFocus
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Ingresar como Administrador</span>
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
