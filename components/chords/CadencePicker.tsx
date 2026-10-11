'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Search, Plus, Tag, ChevronDown, Trash2, X, Check } from 'lucide-react'
import { CadenceDefinition } from '@/lib/harmonic-theory'
import { useHarmonicsLibrary } from '@/lib/custom-harmonics'
import { CreateCadenceModal } from './CreateCadenceModal'
import { cn } from '@/lib/utils'

interface CadencePickerProps {
  currentCadenceId?: string
  buttonLabel?: string
  buttonVariant?: 'default' | 'outline' | 'subtle'
  onSelectCadence: (cadence: CadenceDefinition | null) => void
  className?: string
}

export function CadencePicker({
  currentCadenceId,
  buttonLabel = 'Marcar Cadencia',
  buttonVariant = 'outline',
  onSelectCadence,
  className,
}: CadencePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { allCadences, deleteCadence } = useHarmonicsLibrary()

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Filtrado de cadencias
  const filteredCadences = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return allCadences

    return allCadences.filter(
      (cad) =>
        cad.name.toLowerCase().includes(q) ||
        cad.degrees.toLowerCase().includes(q) ||
        cad.type.toLowerCase().includes(q) ||
        (cad.description && cad.description.toLowerCase().includes(q))
    )
  }, [allCadences, search])

  const activeCadence = allCadences.find((c) => c.id === currentCadenceId || c.type === currentCadenceId)

  return (
    <div className={cn('relative inline-block text-left', className)} ref={containerRef}>
      {/* Botón Disparador del Selector */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm',
          buttonVariant === 'default'
            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30'
            : buttonVariant === 'subtle'
            ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/70'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400'
        )}
        title="Etiquetar cadencia armónica en este compás"
      >
        <Tag className="w-3.5 h-3.5 text-purple-500" />
        <span className="truncate max-w-[130px]">
          {activeCadence ? activeCadence.name.split('(')[0].trim() : buttonLabel}
        </span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200 shrink-0', isOpen && 'rotate-180')} />
      </button>

      {/* Menú Desplegable Flotante con Buscador */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 z-50 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 space-y-2.5 animate-in fade-in-50 zoom-in-95">
          {/* Barra de Búsqueda */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cadencia (ej. V -> I, plagal, backdoor)..."
              autoFocus
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          {/* Opción para Desmarcar / Auto-detectar */}
          <button
            type="button"
            onClick={() => {
              onSelectCadence(null)
              setIsOpen(false)
            }}
            className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
          >
            <span>✦ (Auto-detectar o Quitar cadencia)</span>
            {!activeCadence && <Check className="w-4 h-4 text-emerald-500" />}
          </button>

          {/* Lista de Cadencias */}
          <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredCadences.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No se encontraron cadencias con ese término.
              </div>
            ) : (
              filteredCadences.map((cad) => {
                const isSelected = activeCadence?.id === cad.id || activeCadence?.type === cad.type

                return (
                  <div
                    key={cad.id}
                    onClick={() => {
                      onSelectCadence(cad)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'pt-1.5 first:pt-0 group flex items-start justify-between gap-2 p-2 rounded-xl cursor-pointer transition-colors',
                      isSelected
                        ? 'bg-purple-50 dark:bg-purple-950/40'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Badge estilizado */}
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded text-[10px] font-black border tracking-tight',
                            cad.colorBadge
                          )}
                        >
                          {cad.name}
                        </span>

                        {cad.isCustom && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                            Custom
                          </span>
                        )}
                      </div>

                      {/* Grados y resolución */}
                      <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                        {cad.degrees}
                      </p>

                      {/* Descripción breve */}
                      {cad.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {cad.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-1">
                      {isSelected && <Check className="w-4 h-4 text-purple-600 dark:text-purple-400" />}

                      {cad.isCustom && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (confirm(`¿Eliminar la cadencia "${cad.name}"?`)) {
                              deleteCadence(cad.id)
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all"
                          title="Eliminar cadencia personalizada"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Pie del Desplegable: Botón "+ Nueva Cadencia" */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setIsCreateModalOpen(true)
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors border border-purple-200 dark:border-purple-800/80 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Crear Nueva Cadencia</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal para crear cadencia personalizada */}
      <CreateCadenceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(newCad) => {
          onSelectCadence(newCad)
        }}
      />
    </div>
  )
}
