'use client'

import Link from 'next/link'
import { Plus, Upload, Sparkles, Music } from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      icon: Plus,
      label: 'Nueva Canción',
      description: 'Crea desde cero',
      href: '/dashboard/songs/new',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Sparkles,
      label: 'IA Asistente',
      description: 'Genera con IA',
      href: '/dashboard/ai',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Upload,
      label: 'Importar',
      description: 'Desde archivo',
      href: '/dashboard/import',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: Music,
      label: 'Metrónomo',
      description: 'Entrena tu tempo',
      href: '/dashboard/practice',
      gradient: 'from-green-500 to-emerald-500',
    },
  ]

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
