'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Music, 
  Home, 
  Library, 
  Search, 
  Settings, 
  LogOut, 
  Activity, 
  Calendar, 
  Menu, 
  X, 
  Layers, 
  FileText,
  Lock,
  ShieldCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarItem } from '@/components/dashboard/sidebar-item'
import { AdminLoginModal } from '@/components/auth/AdminLoginModal'
import { useAuth } from '@/lib/context/auth-context'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user?: {
    name?: string | null
    email?: string | null
    image?: string | null
  } | null
  isAdmin?: boolean
}

interface NavItem {
  href?: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isAccordion?: boolean
  basePath?: string
  subItems?: {
    href: string
    label: string
    icon: React.ComponentType<{ className?: string }>
  }[]
}

export function Sidebar({ user: initialUser, isAdmin: initialIsAdmin }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const { isAdmin: authIsAdmin, user: authUser, isLoading: authIsLoading, logout } = useAuth()
  
  // Combina estado del servidor con el del contexto reactivo evitando parpadeos
  const isAdmin = authIsLoading ? Boolean(initialIsAdmin) : authIsAdmin
  const currentUser = authIsLoading ? (initialUser || authUser) : (authUser || initialUser)

  const links: NavItem[] = [
    { href: '/dashboard', label: 'Inicio', icon: Home },
    {
      label: 'Canciones',
      icon: Library,
      isAccordion: true,
      basePath: '/dashboard/songs',
      subItems: [
        { href: '/dashboard/songs/lyrics', label: 'Letras', icon: FileText },
        { href: '/dashboard/songs/chords', label: 'Acordes', icon: Music },
      ],
    },
    { href: '/dashboard/chords', label: 'Progresiones', icon: Layers },
    ...(isAdmin
      ? [{ href: '/dashboard/routines', label: 'Rutinas de Práctica', icon: Calendar }]
      : []),
    { href: '/dashboard/practice', label: 'Metrónomo', icon: Activity },
    { href: '/dashboard/search', label: 'Buscar', icon: Search },
    ...(isAdmin
      ? [{ href: '/dashboard/settings', label: 'Ajustes', icon: Settings }]
      : []),
  ]

  return (
    <>
      {/* Mobile Sidebar Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-all duration-300 animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container (Desktop & Mobile Drawer) */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-slate-900 transition-transform duration-300 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo and Mobile Close Button */}
        <div className="flex h-16 shrink-0 items-center justify-between px-6 bg-slate-950">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <Music className="w-8 h-8 text-primary-500" />
            <span className="text-xl font-bold text-white tracking-tight">MusicChord</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex flex-1 flex-col overflow-y-auto pt-6 px-4 gap-1.5">
          {links.map((link) => (
            <SidebarItem
              key={link.label}
              href={link.href}
              label={link.label}
              icon={link.icon}
              isAccordion={link.isAccordion}
              basePath={link.basePath}
              subItems={link.subItems}
              pathname={pathname}
              onNavigate={() => setIsOpen(false)}
            />
          ))}
        </div>

        {/* User Profile & Actions Footer */}
        <div className="mt-auto border-t border-slate-800 p-4 bg-slate-950/70">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tema</span>
            <ThemeToggle />
          </div>
          
          {isAdmin ? (
            /* Modo Administrador Activo */
            <div className="flex items-center gap-3 px-2 py-2 bg-slate-900/90 rounded-xl border border-slate-800/80">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-bold text-white truncate">
                    {currentUser?.name || 'Abel'}
                  </p>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3" />
                    Admin
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">
                  {currentUser?.email || 'utreraabel91@gmail.com'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-red-400 hover:bg-slate-800 shrink-0"
                onClick={() => logout()}
                title="Cerrar Sesión de Administrador"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            /* Modo Visitante (Read-Only) con Botón «Acceso Administrador» */
            <div className="px-1 py-1">
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs text-purple-200 bg-purple-950/50 hover:bg-purple-900/60 border border-purple-800/60 hover:border-purple-600 transition-all shadow-sm active:scale-98 group cursor-pointer"
              >
                <Lock className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span>Acceso Administrador</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 sticky top-0 z-40 w-full">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsOpen(true)}
            className="text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-6 h-6" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Music className="w-6 h-6 text-primary-600" />
            <span className="text-lg font-bold text-gradient">MusicChord</span>
          </Link>
        </div>
        <div className="flex gap-2 items-center">
          {!isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLoginModalOpen(true)}
              className="text-xs font-semibold gap-1.5 h-8 border-purple-300 dark:border-purple-800 text-purple-600 dark:text-purple-400"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Button>
          )}
          {isAdmin && (
            <Link href="/dashboard/routines">
              <Button variant="ghost" size="icon" title="Rutinas de Práctica"><Calendar className="w-5 h-5" /></Button>
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Modal de Inicio de Sesión de Administrador */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  )
}
