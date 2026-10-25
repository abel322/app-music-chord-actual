'use client'

import React from 'react'
import { SectionMeasures } from '@/types/measure'
import { getSectionBadge } from '@/lib/measure-utils'
import { Layers, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SectionQuickNavProps {
  sections?: SectionMeasures[]
  song?: { sections: SectionMeasures[] }
  activeSectionId?: string | null
  collapsedSections?: Record<string, boolean>
  isAllCollapsed?: boolean
  onToggleCollapseAll?: () => void
  toggleCollapseAll?: () => void
  onSelectSection?: (sectionId: string) => void
  scrollToSection?: (sectionId: string) => void
  className?: string
}

export function SectionQuickNav({
  sections,
  song,
  activeSectionId,
  collapsedSections = {},
  isAllCollapsed,
  onToggleCollapseAll,
  toggleCollapseAll,
  onSelectSection,
  scrollToSection,
  className,
}: SectionQuickNavProps) {
  const sectionsList = sections || song?.sections || []

  if (!sectionsList || sectionsList.length === 0) return null

  const handleSelect = scrollToSection || onSelectSection || (() => {})
  const handleToggleCollapse = toggleCollapseAll || onToggleCollapseAll || (() => {})

  const allCollapsed =
    isAllCollapsed !== undefined
      ? isAllCollapsed
      : sectionsList.length > 0 && sectionsList.every((s) => collapsedSections[s.id])

  return (
    <div className={cn('w-full my-3 px-1 sm:px-0 select-none', className)}>
      <div className="flex items-center justify-between gap-2 bg-slate-100/80 dark:bg-slate-900/60 backdrop-blur-sm p-1.5 sm:p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        {/* Título o Ícono sutil a la izquierda */}
        <div className="hidden sm:flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider pl-2 shrink-0">
          <Layers className="w-3.5 h-3.5 text-purple-500" />
          <span>Secciones:</span>
        </div>

        {/* Carrusel Deslizable de Secciones (Scroll Horizontal Táctil en Móvil) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-1 flex-1 min-w-0">
          {sectionsList.map((section) => {
            const isActive = activeSectionId === section.id
            const sectionDisplayName = (section as any).name || section.label
            const typePrefix =
              (section.type ? section.type.slice(0, 3) : null) ||
              getSectionBadge(section.type, sectionDisplayName) ||
              'SEC'

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => handleSelect(section.id)}
                className={cn(
                  'shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer',
                  isActive
                    ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-400/50'
                    : 'bg-white dark:bg-slate-800/90 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/70 shadow-sm'
                )}
                title={`Ir a ${sectionDisplayName}`}
              >
                {/* Prefijo tipo badge (INT, EST, COR) */}
                <span
                  className={cn(
                    'text-[10px] font-mono px-1 py-0.2 rounded font-bold uppercase',
                    isActive
                      ? 'bg-purple-800 text-purple-200'
                      : 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300'
                  )}
                >
                  {typePrefix.toUpperCase()}
                </span>

                {/* Nombre de la sección */}
                <span className="truncate max-w-[90px] sm:max-w-none">{sectionDisplayName}</span>

                {/* Multiplicador si tiene repetición */}
                {section.repeatCount && section.repeatCount > 1 ? (
                  <span className={cn('text-[10px] font-bold', isActive ? 'text-purple-200' : 'text-purple-500')}>
                    {section.repeatCount}x
                  </span>
                ) : null}

                {/* Indicador de modulación si tiene tonalidad propia */}
                {section.keySignature && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400 shrink-0"
                    title={`Modulada: ${section.keySignature}`}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Botón Colapsar / Expandir todo a la derecha */}
        <button
          type="button"
          onClick={handleToggleCollapse}
          className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer"
          title={allCollapsed ? 'Expandir todas las secciones' : 'Colapsar todas las secciones'}
        >
          <ChevronsUpDown className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{allCollapsed ? 'Expandir' : 'Colapsar'}</span>
        </button>
      </div>
    </div>
  )
}

// Alias de compatibilidad
export const SectionNavigationStickyBar = SectionQuickNav
export const SectionQuickJump = SectionQuickNav
