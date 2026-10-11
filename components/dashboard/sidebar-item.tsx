'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SidebarSubItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

export interface SidebarItemProps {
  href?: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  isAccordion?: boolean
  basePath?: string
  subItems?: SidebarSubItem[]
  pathname: string
  onNavigate?: () => void
}

export function SidebarItem({
  href,
  label,
  icon: Icon,
  isAccordion = false,
  basePath,
  subItems = [],
  pathname,
  onNavigate,
}: SidebarItemProps) {
  const isParentActive = basePath
    ? pathname.startsWith(basePath)
    : href
    ? pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    : false

  const [isExpanded, setIsExpanded] = useState(isParentActive)

  // Auto-expandir si la ruta actual coincide con el grupo
  useEffect(() => {
    if (basePath && pathname.startsWith(basePath)) {
      setIsExpanded(true)
    }
  }, [basePath, pathname])

  if (isAccordion) {
    return (
      <div className="space-y-1">
        {/* Botón Cabecera del Acordeón */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'group flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200',
            isParentActive
              ? 'bg-primary-900/40 text-primary-300 border border-primary-800/60 shadow-sm'
              : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
          )}
        >
          <div className="flex items-center gap-3">
            <Icon
              className={cn(
                'h-5 w-5 transition-colors',
                isParentActive ? 'text-primary-400' : 'text-slate-400 group-hover:text-white'
              )}
            />
            <span>{label}</span>
          </div>

          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform duration-200 text-slate-400 group-hover:text-white',
              isExpanded && 'rotate-180 text-primary-400'
            )}
          />
        </button>

        {/* Submenú Desplegable con Animación */}
        {isExpanded && subItems.length > 0 && (
          <div className="ml-4 pl-3 space-y-1 border-l border-slate-800 animate-in slide-in-from-top-1 fade-in duration-150">
            {subItems.map((subItem) => {
              const SubIcon = subItem.icon
              const isSubActive =
                pathname === subItem.href || pathname.startsWith(subItem.href + '/')

              return (
                <Link
                  key={subItem.href}
                  href={subItem.href}
                  onClick={onNavigate}
                  className={cn(
                    'group flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors',
                    isSubActive
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-900/30'
                      : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                  )}
                >
                  <SubIcon
                    className={cn(
                      'h-4 w-4 transition-colors',
                      isSubActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                    )}
                  />
                  <span>{subItem.label}</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Elemento de navegación simple
  const isActive = href
    ? pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    : false

  return (
    <Link
      href={href || '#'}
      onClick={onNavigate}
      className={cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-200',
        isActive
          ? 'bg-primary-600 text-white shadow-md shadow-primary-900/20'
          : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
      )}
    >
      <Icon
        className={cn(
          'h-5 w-5 transition-colors',
          isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
        )}
      />
      <span>{label}</span>
    </Link>
  )
}
