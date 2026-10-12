'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Search, Plus, Sparkles, ChevronDown, Trash2, Check, Music, X } from 'lucide-react'
import { HarmonicProgression, getProgressionChords } from '@/lib/harmonic-theory'
import { useHarmonicsLibrary } from '@/lib/custom-harmonics'
import { CreateProgressionModal } from './CreateProgressionModal'
import { cn } from '@/lib/utils'

interface ProgressionPickerProps {
  currentKey?: string
  buttonLabel?: string
  buttonVariant?: 'default' | 'outline' | 'subtle'
  onSelectProgression: (progression: HarmonicProgression) => void
  className?: string
}

export function ProgressionPicker({
  currentKey = 'C',
  buttonLabel = 'Aplicar Progresión',
  buttonVariant = 'outline',
  onSelectProgression,
  className,
}: ProgressionPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('Todas')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { allProgressions, deleteProgression } = useHarmonicsLibrary()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Cerrar al presionar Escape o clic fuera en desktop
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // En desktop cerramos si el clic fue fuera del contenedor
        if (window.innerWidth >= 768) {
          setIsOpen(false)
        }
      }
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

  // Filtrado de progresiones
  const filteredProgressions = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allProgressions.filter((prog) => {
      const matchesSearch =
        !q ||
        prog.name.toLowerCase().includes(q) ||
        prog.degrees.join(' ').toLowerCase().includes(q) ||
        prog.genre.toLowerCase().includes(q) ||
        (prog.description && prog.description.toLowerCase().includes(q))

      const matchesGenre =
        selectedGenre === 'Todas' ||
        (selectedGenre === 'Personalizadas' ? !!prog.isCustom : prog.genre === selectedGenre)

      return matchesSearch && matchesGenre
    })
  }, [allProgressions, search, selectedGenre])

  const genres = ['Todas', 'Pop', 'Jazz', 'Rock', 'Gospel', 'Balada', 'Personalizadas']

  // Renderizador del contenido interno (buscador, filtros, lista de progresiones)
  const renderListContent = (isMobile = false) => (
    <>
      {/* Barra de Búsqueda */}
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, género o grados (ej. I-V-vi)..."
          autoFocus={!isMobile}
          className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filtros Rápidos por Género */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0 text-xs">
        {genres.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setSelectedGenre(g)}
            className={cn(
              'px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors border',
              selectedGenre === g
                ? 'bg-primary-600 text-white border-primary-600 shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60'
            )}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Lista de Progresiones Scrolleable */}
      <div className={cn(
        'overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800/60',
        isMobile ? 'flex-1 min-h-[180px] max-h-[50vh]' : 'max-h-64'
      )}>
        {filteredProgressions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            No se encontraron progresiones para esta búsqueda.
          </div>
        ) : (
          filteredProgressions.map((prog) => {
            const chordsInKey = getProgressionChords(prog, currentKey)

            return (
              <div
                key={prog.id}
                onClick={() => {
                  onSelectProgression(prog)
                  setIsOpen(false)
                }}
                className="pt-1.5 first:pt-0 group flex items-start justify-between gap-2 p-2.5 rounded-xl hover:bg-primary-50/70 dark:hover:bg-primary-950/50 cursor-pointer transition-colors active:scale-98"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {prog.name}
                    </span>
                    {prog.isCustom && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                        Custom
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                      • {prog.genre}
                    </span>
                  </div>

                  {/* Grados en Romano */}
                  <p className="font-mono text-[11px] font-bold text-primary-600 dark:text-primary-400 truncate">
                    {prog.degrees.join(' - ')}
                  </p>

                  {/* Acordes Reales calculados para la tonalidad */}
                  <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <span className="font-semibold text-slate-400 text-[10px]">Tono {currentKey}:</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {chordsInKey.join('  •  ')}
                    </span>
                  </p>
                </div>

                {prog.isCustom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`¿Eliminar la progresión "${prog.name}"?`)) {
                        deleteProgression(prog.id)
                      }
                    }}
                    className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-all shrink-0"
                    title="Eliminar progresión personalizada"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pie: Botón "+ Nueva Progresión" */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 shrink-0">
        <button
          type="button"
          onClick={() => {
            setIsOpen(false)
            setIsCreateModalOpen(true)
          }}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/60 hover:bg-primary-100 dark:hover:bg-primary-900/60 transition-colors border border-primary-200 dark:border-primary-800/80 shadow-2xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Crear Nueva Progresión</span>
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
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs',
          buttonVariant === 'default'
            ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-primary-900/30'
            : buttonVariant === 'subtle'
            ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/70'
            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400'
        )}
        title="Seleccionar y aplicar una progresión armónica"
      >
        <Sparkles className="w-3.5 h-3.5 text-primary-500" />
        <span>{buttonLabel}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>

      {/* Renderizado de Progresiones: Responsive (Bottom Sheet en Móvil / Popover en Desktop) */}
      {isOpen && (
        <>
          {/* 1. MÓVIL (< md): Bottom Sheet Modal con Backdrop Completo */}
          <div className="md:hidden">
            {mounted && typeof document !== 'undefined' &&
              createPortal(
                <div
                  className="harmonics-picker-sheet chord-picker-popover fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setIsOpen(false)
                  }}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Seleccionar Progresión"
                >
                  <div
                    className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 p-4 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 space-y-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Barra de arrastre / Handle visual superior */}
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto shrink-0 sm:hidden" />

                    {/* Encabezado con título y botón de cierre */}
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900 dark:text-white">
                            Seleccionar Progresión
                          </h3>
                          <span className="text-[11px] text-slate-500 font-medium">
                            Tonalidad activa: <strong className="text-primary-600 dark:text-primary-400">{currentKey}</strong>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Cerrar (Esc)"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Contenido Completo del Drawer */}
                    {renderListContent(true)}
                  </div>
                </div>,
                document.body
              )}
          </div>

          {/* 2. ESCRITORIO (>= md): Popover Flotante Alineado a la Derecha */}
          <div className="hidden md:block absolute right-0 top-full z-50 mt-2 w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3.5 space-y-2.5 animate-in fade-in-50 zoom-in-95">
            {renderListContent(false)}
          </div>
        </>
      )}

      {/* Modal para crear progresión personalizada */}
      <CreateProgressionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        currentKey={currentKey}
        onCreated={(newProg) => {
          onSelectProgression(newProg)
        }}
      />
    </div>
  )
}
