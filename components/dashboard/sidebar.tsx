'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
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
  ChevronDown, 
  FileText 
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarItem } from '@/components/dashboard/sidebar-item'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: {
    name?: string | null
    email?: string
    image?: string | null
  }
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

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

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
    { href: '/dashboard/routines', label: 'Rutinas de Práctica', icon: Calendar },
    { href: '/dashboard/practice', label: 'Metrónomo', icon: Activity },
    { href: '/dashboard/search', label: 'Buscar', icon: Search },
    { href: '/dashboard/settings', label: 'Ajustes', icon: Settings },
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

        {/* User Profile & Actions */}
        <div className="mt-auto border-t border-slate-800 p-4 bg-slate-950/50">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tema</span>
            <ThemeToggle />
          </div>
          
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-white hover:bg-slate-800 shrink-0"
              onClick={() => signOut({ callbackUrl: '/' })}
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
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
            <Link href="/dashboard/routines">
                <Button variant="ghost" size="icon"><Calendar className="w-5 h-5" /></Button>
            </Link>
            <ThemeToggle />
        </div>
      </div>
    </>
  )
}
