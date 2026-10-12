'use client'

import React from 'react'
import { SectionMeasures } from '@/types/measure'
import { getSectionBadge } from '@/lib/measure-utils'
import { ChevronsDown, ChevronsUp, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionNavigationStickyBarProps {
  sections: SectionMeasures[]
  collapsedSections: Record<string, boolean>
  onToggleCollapseAll: () => void
  onSelectSection: (sectionId: string) => void
  className?: string
}

export function SectionNavigationStickyBar({
  sections,
  collapsedSections,
  onToggleCollapseAll,
  onSelectSection,
  className,
}: SectionNavigationStickyBarProps) {
  if (!sections || sections.length === 0) return null

  const allCollapsed = sections.length > 0 && sections.every((s) => collapsedSections[s.id])

  return (
    <div
      className={cn(
        'sticky top-14 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 py-2 px-3 flex items-center justify-between gap-2 shadow-xs transition-all',
        className
      )}
    >
      {/* Contenedor con scroll horizontal táctil y barra de desplazamiento oculta */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth flex-1 min-w-0 py-0.5">
        <span className="text-[11px] uppercase font-mono font-black text-slate-400 dark:text-slate-500 shrink-0 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-purple-500" />
          <span className="hidden xs:inline">Secciones:</span>
        </span>

        {sections.map((sec) => {
          const isCollapsed = !!collapsedSections[sec.id]
          const badge = getSectionBadge(sec.type, sec.label)

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec.id)}
              className={cn(
                'px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap active:scale-95 transition-all shrink-0 flex items-center gap-1.5 border shadow-2xs cursor-pointer',
                isCollapsed
                  ? 'bg-slate-100 hover:bg-purple-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-purple-950/40 border-slate-200 dark:border-slate-700/80'
                  : 'bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 dark:hover:bg-purple-900/60 border-purple-200 dark:border-purple-800/80 font-bold'
              )}
              title={`Ir a ${sec.label}`}
            >
              <span className="text-[10px] font-mono font-black opacity-80">
                {badge}
              </span>
              <span>{sec.label}</span>
              {sec.keySignature && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400"
                  title={`Modulada: ${sec.keySignature}`}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Botón Toggle Global: Colapsar todo / Expandir todo */}
      <button
        type="button"
        onClick={onToggleCollapseAll}
        className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/50 dark:hover:text-purple-300 whitespace-nowrap transition-colors active:scale-95 shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer"
        title={allCollapsed ? 'Expandir todas las secciones' : 'Colapsar todas las secciones'}
      >
        {allCollapsed ? (
          <>
            <ChevronsDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Expandir todo</span>
          </>
        ) : (
          <>
            <ChevronsUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Colapsar todo</span>
          </>
        )}
      </button>
    </div>
  )
}
