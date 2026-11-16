'use client'

import React from 'react'
import { SectionMeasures } from '@/types/measure'
import { getSectionBadge } from '@/lib/measure-utils'
import { Layers, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
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
  onPrevSection?: () => void
  onNextSection?: () => void
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
  onPrevSection,
  onNextSection,
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

  const activeIdx = sectionsList.findIndex((s) => s.id === activeSectionId)
  const canGoPrev = activeIdx > 0
  const canGoNext = activeIdx !== -1 && activeIdx < sectionsList.length - 1

  const handlePrev = () => {
    if (onPrevSection) {
      onPrevSection()
    } else if (canGoPrev) {
      handleSelect(sectionsList[activeIdx - 1].id)
    }
  }

  const handleNext = () => {
    if (onNextSection) {
      onNextSection()
    } else if (canGoNext) {
      handleSelect(sectionsList[activeIdx + 1].id)
    }
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 sm:py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl select-none',
        className
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
        {/* Lado Izquierdo: Botón Anterior ◀ + Colapsar */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            disabled={!canGoPrev && !onPrevSection}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-black bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-cyan-400 border border-slate-800 shadow-sm transition-all flex items-center gap-1 cursor-pointer"
            title="Sección anterior (← o PageUp)"
            aria-label="Sección anterior"
          >
            <ChevronLeft className="w-4 h-4 sm:hidden" />
            <span className="hidden sm:inline">◀ Ant</span>
          </button>

          <button
            type="button"
            onClick={handleToggleCollapse}
            className="inline-flex items-center gap-1 p-1.5 sm:px-2 sm:py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800 cursor-pointer"
            title={allCollapsed ? 'Expandir todas las secciones' : 'Colapsar todas las secciones'}
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Carrusel Deslizable de Secciones (Scroll Horizontal Táctil en Móvil) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5 flex-1 min-w-0">
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
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md ring-2 ring-cyan-300'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 shadow-sm'
                )}
                title={`Ir a ${sectionDisplayName}`}
              >
                {/* Prefijo tipo badge (INT, EST, COR) */}
                <span
                  className={cn(
                    'text-[10px] font-mono px-1 py-0.2 rounded font-bold uppercase',
                    isActive
                      ? 'bg-slate-950 text-cyan-300'
                      : 'bg-slate-800 text-cyan-400'
                  )}
                >
                  {typePrefix.toUpperCase()}
                </span>

                {/* Nombre de la sección */}
                <span className="truncate max-w-[85px] sm:max-w-none">{sectionDisplayName}</span>

                {/* Multiplicador si tiene repetición */}
                {section.repeatCount && section.repeatCount > 1 ? (
                  <span className={cn('text-[10px] font-bold', isActive ? 'text-slate-900' : 'text-cyan-400')}>
                    {section.repeatCount}x
                  </span>
                ) : null}

                {/* Indicador de modulación si tiene tonalidad propia */}
                {section.keySignature && (
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      isActive ? 'bg-slate-950' : 'bg-cyan-400'
                    )}
                    title={`Modulada: ${section.keySignature}`}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Botón Táctil Destacado: Siguiente ➔ */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canGoNext && !onNextSection}
          className="shrink-0 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-30 disabled:pointer-events-none text-slate-950 shadow-lg shadow-cyan-500/30 transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer ring-1 ring-cyan-200"
          title="Avanzar a la siguiente sección (→, PageDown o Espacio)"
          aria-label="Avanzar a la siguiente sección"
        >
          <span>Siguiente</span>
          <span className="font-extrabold text-sm sm:text-base leading-none">➔</span>
        </button>
      </div>
    </div>
  )
}

// Alias de compatibilidad
export const SectionNavigationStickyBar = SectionQuickNav
export const SectionQuickJump = SectionQuickNav
