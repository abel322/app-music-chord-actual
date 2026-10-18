'use client'

import Link from 'next/link'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Music, Lock, ShieldCheck, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('utreraabel91@gmail.com')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const effectiveEmail = email.trim() || 'utreraabel91@gmail.com'
    const effectivePassword = password.trim()

    try {
      // 1. Iniciar sesión mediante el endpoint administrativo que genera la cookie HTTP-only segura
      const adminRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: effectiveEmail,
          password: effectivePassword,
        }),
      })

      const adminData = await adminRes.json()

      if (adminRes.ok && adminData.success) {
        // Sincronizar también con NextAuth en segundo plano si aplica
        try {
          await signIn('credentials', {
            email: effectiveEmail,
            password: effectivePassword,
            redirect: false,
          })
        } catch {
          // Ignorar error de NextAuth si el token HTTP-only ya está establecido
        }

        router.push('/dashboard/songs/chords')
        router.refresh()
        return
      }

      // 2. Si no validó por el endpoint administrativo, intentar con credenciales de NextAuth
      const result = await signIn('credentials', {
        email: effectiveEmail,
        password: effectivePassword,
        redirect: false,
      })

      if (result?.error) {
        setError('Contraseña o credenciales de administrador incorrectas')
      } else {
        router.push('/dashboard/songs/chords')
        router.refresh()
      }
    } catch {
      setError('Ocurrió un error al procesar el inicio de sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-primary-50/20 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-primary-900/30 group-hover:scale-105 transition-transform">
            <Music className="w-6 h-6" />
          </div>
          <span className="text-3xl font-black tracking-tight bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            MusicChord
          </span>
        </Link>

        {/* Card de Inicio de Sesión */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
              <span>Acceso Administrador</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Iniciar Sesión
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
              Ingresa tus credenciales para habilitar la edición, creación y administración total de canciones.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 rounded-xl text-red-600 dark:text-red-300 text-xs font-semibold text-center animate-in fade-in">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                label="Correo de Administrador"
                placeholder="utreraabel91@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Introduce tu clave..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded transition-colors"
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
              className="w-full py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary-900/20 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  <span>Verificando Credenciales...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  <span>Entrar como Administrador</span>
                </>
              )}
            </Button>
          </form>

          {/* Banner de Acceso Libre para Visitantes */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              ¿Solo deseas consultar acordes, canciones y letras?
            </p>
            <Link
              href="/dashboard/songs/chords"
              className="inline-flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl text-xs font-bold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/60 hover:bg-primary-100 dark:hover:bg-primary-900/60 border border-primary-200 dark:border-primary-800/80 transition-colors"
            >
              <span>Explorar Canciones sin Iniciar Sesión</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Volver al Inicio */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            ← Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  )
}
