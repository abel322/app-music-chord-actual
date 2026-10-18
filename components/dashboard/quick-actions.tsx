'use client'

import Link from 'next/link'
import { Plus, Upload, Music, Layers, Activity, FileText } from 'lucide-react'
import { useAuth } from '@/lib/context/auth-context'

export function QuickActions() {
  const { isAdmin } = useAuth()

  const adminActions = [
    {
      icon: Plus,
      label: 'Nueva Canción',
      description: 'Crear Lead Sheet',
      href: '/dashboard/songs/new',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Music,
      label: 'Catálogo de Acordes',
      description: 'Partituras y compases',
      href: '/dashboard/songs/chords',
      gradient: 'from-purple-500 to-indigo-500',
    },
    {
      icon: Layers,
      label: 'Progresiones',
      description: 'Catálogo armónico',
      href: '/dashboard/chords',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Activity,
      label: 'Metrónomo',
      description: 'Entrena tu tempo',
      href: '/dashboard/practice',
      gradient: 'from-green-500 to-emerald-500',
    },
  ]

  const guestActions = [
    {
      icon: Music,
      label: 'Repertorio en Acordes',
      description: 'Lead Sheets y Compases',
      href: '/dashboard/songs/chords',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: FileText,
      label: 'Repertorio en Letras',
      description: 'Teleprompter en vivo',
      href: '/dashboard/songs/lyrics',
      gradient: 'from-purple-500 to-indigo-500',
    },
    {
      icon: Layers,
      label: 'Catálogo de Progresiones',
      description: 'Reproductor armónico',
      href: '/dashboard/chords',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      icon: Activity,
      label: 'Metrónomo Interactivo',
      description: 'Entrena tu tempo con Web Audio',
      href: '/dashboard/practice',
      gradient: 'from-emerald-500 to-teal-500',
    },
  ]

  const actions = isAdmin ? adminActions : guestActions

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.label}
            href={action.href}
            className="group relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity`} />
            <Icon className={`w-8 h-8 mb-3 bg-gradient-to-br ${action.gradient} bg-clip-text text-transparent`} />
            <h3 className="font-semibold mb-1">{action.label}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
          </Link>
        )
      })}
    </div>
  )
}
