'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Search, Plus, Tag, ChevronDown, Trash2, X, Check } from 'lucide-react'
import { CadenceDefinition, getCadenceChords } from '@/lib/harmonic-theory'
import { useHarmonicsLibrary } from '@/lib/custom-harmonics'
import { CreateCadenceModal } from './CreateCadenceModal'
import { cn } from '@/lib/utils'

interface CadencePickerProps {
  currentKey?: string
  currentCadenceId?: string
  buttonLabel?: string
  buttonVariant?: 'default' | 'outline' | 'subtle'
  onSelectCadence: (cadence: CadenceDefinition | null) => void
  className?: string
}

export function CadencePicker({
  currentKey = 'C',
  currentCadenceId,
  buttonLabel = 'Marcar Cadencia',
  buttonVariant = 'outline',
  onSelectCadence,
  className,
}: CadencePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  const { allCadences, deleteCadence } = useHarmonicsLibrary()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (!target) return

      // Si el clic fue dentro del botón disparador o dentro del diálogo modal, no cerrar
      if (containerRef.current?.contains(target) || modalRef.current?.contains(target)) {
        return
      }

      // Si el clic es dentro de cualquier portal o elemento del picker o de creación, no cerrar
      if ((target as HTMLElement)?.closest?.('.harmonics-picker-sheet, .chord-picker-popover, [role="dialog"]')) {
        return
      }

      setIsOpen(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
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

  // Seleccionar cadencia asegurando inserción en el estado antes de cerrar
  const handleSelectCadence = (cad: CadenceDefinition | null) => {
    try {
      onSelectCadence(cad)
    } catch (err) {
      console.error('Error aplicando cadencia armónica:', err)
    }
    setIsOpen(false)
  }

  // Renderizador del contenido interno (buscador, auto-detectar, lista de cadencias)
  const renderListContent = () => (
    <>
      {/* Barra de Búsqueda */}
      <div
        className="relative shrink-0"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cadencia (ej. V -> I, plagal, rota)..."
          className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        />
        {search && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setSearch('')
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Opción Destacada: ✕ Ninguna / Quitar Cadencia */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          handleSelectCadence(null)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          'w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all text-left shrink-0 border cursor-pointer',
          activeCadence
            ? 'bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 shadow-2xs'
            : 'bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800'
        )}
      >
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center text-[10px] font-black">
            ✕
          </span>
          <span className={activeCadence ? 'font-bold text-red-600 dark:text-red-400' : 'font-semibold'}>
            ✕ Ninguna / Quitar Cadencia
          </span>
        </span>
        {!activeCadence && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
      </button>

      {/* Lista de Cadencias Scrolleable */}
      <div
        className="overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60 flex-1 min-h-[180px] max-h-[50vh] sm:max-h-[380px]"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {filteredCadences.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No se encontraron cadencias con ese término.
          </div>
        ) : (
          filteredCadences.map((cad) => {
            const isSelected = activeCadence?.id === cad.id || activeCadence?.type === cad.type

            return (
              <div
                key={cad.id}
                onClick={(e) => {
                  e.stopPropagation()
                  handleSelectCadence(cad)
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className={cn(
                  'pt-1.5 first:pt-0 group flex items-start justify-between gap-2 p-2.5 rounded-xl cursor-pointer transition-colors active:scale-98',
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

                  {/* Grados y resolución con acordes calculados */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {cad.degrees}
                    </span>
                    {(() => {
                      const dynamicChords = getCadenceChords(cad, currentKey)
                      if (dynamicChords.length === 0) return null
                      return (
                        <span className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono">
                          ({dynamicChords.join(' → ')})
                        </span>
                      )
                    })()}
                  </div>

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
                      onPointerDown={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all shrink-0"
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

      {/* Pie: Botón "+ Nueva Cadencia" */}
      <div
        className="pt-2.5 border-t border-slate-100 dark:border-slate-800 shrink-0"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(false)
            setIsCreateModalOpen(true)
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors border border-purple-200 dark:border-purple-800/80 shadow-2xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Crear Nueva Cadencia</span>
        </button>
      </div>
    </>
  )

  return (
    <div className={cn('relative inline-block text-left', className)} ref={containerRef}>
      {/* Botón Disparador del Selector */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs w-full sm:w-auto cursor-pointer',
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

      {/* Renderizado de Cadencias: Modal Dialog Responsivo (Bottom Sheet en móvil, Modal centrado en desktop) */}
      {isOpen && mounted && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="harmonics-picker-sheet chord-picker-popover fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsOpen(false)
              }
            }}
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) {
                e.stopPropagation()
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Marcar Cadencia"
          >
            <div
              ref={modalRef}
              className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 space-y-3"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Barra de arrastre / Handle visual superior */}
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto shrink-0 sm:hidden" />

              {/* Encabezado con título y botón de cierre */}
              <div
                className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Tag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Marcar Cadencia
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Etiqueta resoluciones armónicas en este compás
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsOpen(false)
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Cerrar (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Contenido Completo del Drawer */}
              {renderListContent()}
            </div>
          </div>,
          document.body
        )}

      {/* Modal para crear cadencia personalizada */}
      <CreateCadenceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(newCad) => {
          handleSelectCadence(newCad)
        }}
      />
    </div>
  )
}
