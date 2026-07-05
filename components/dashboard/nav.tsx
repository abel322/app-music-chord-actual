'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Music, Home, Library, Search, Settings, LogOut, Plus, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

interface NavProps {
  user: {
    name?: string | null
    email?: string
    image?: string | null
  }
}

export function DashboardNav({ user }: NavProps) {
  const pathname = usePathname()

  const links = [
    { href: '/dashboard', label: 'Inicio', icon: Home },
    { href: '/dashboard/songs', label: 'Canciones', icon: Library },
    { href: '/dashboard/practice', label: 'Metrónomo', icon: Activity },
    { href: '/dashboard/search', label: 'Buscar', icon: Search },
    { href: '/dashboard/settings', label: 'Ajustes', icon: Settings },
  ]

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <Music className="w-8 h-8 text-primary-600" />
            <span className="text-xl font-bold text-gradient">MusicChord</span>
          </Link>

          {/* Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard/songs/new">
              <Button variant="gradient" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Canción
              </Button>
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
