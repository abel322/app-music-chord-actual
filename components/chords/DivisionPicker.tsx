'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Sliders, X, Check } from 'lucide-react'
import { MeasureDivision } from '@/types/measure'
import { MeasureDivisionOption, MEASURE_DIVISIONS, getDivisionOptionsForTimeSignature } from '@/lib/rhythm-utils'
import { cn } from '@/lib/utils'

interface DivisionPickerProps {
  currentDivision: MeasureDivision
  timeSignature?: string
  divisionOptions?: MeasureDivisionOption[]
  onSelectDivision: (division: MeasureDivision) => void
  className?: string
}

export function DivisionPicker({
  currentDivision,
  timeSignature = '4/4',
  divisionOptions: propOptions,
  onSelectDivision,
  className,
}: DivisionPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Cerrar al hacer clic fuera en desktop o presionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  // Opciones adaptadas a la cifra de compás
  const options = useMemo(() => {
    return propOptions || getDivisionOptionsForTimeSignature(timeSignature)
  }, [propOptions, timeSignature])

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.id === currentDivision) ||
      MEASURE_DIVISIONS.find((d) => d.id === currentDivision)
  }, [options, currentDivision])

  const regularOptions = useMemo(() => options.filter((o) => o.category === 'regular'), [options])
  const irregularOptions = useMemo(() => options.filter((o) => o.category === 'irregular'), [options])
  const amalgamOptions = useMemo(() => options.filter((o) => o.category === 'amalgam'), [options])

  const handleSelect = (id: MeasureDivision) => {
    onSelectDivision(id)
    setIsOpen(false)
  }

  const renderOptionRow = (opt: MeasureDivisionOption) => {
    const isSelected = opt.id === currentDivision
    return (
      <button
        key={opt.id}
        type="button"
        onClick={() => handleSelect(opt.id)}
        className={cn(
          'w-full whitespace-nowrap flex items-center justify-between py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 cursor-pointer group',
          isSelected && 'bg-primary-50/60 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 font-bold'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn(
            'text-sm truncate',
            isSelected
              ? 'font-bold text-primary-700 dark:text-primary-300'
              : 'font-medium text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
          )}>
            {opt.name}
          </span>
          {opt.bracketLabel && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              {opt.bracketLabel}
            </span>
          )}
        </div>

        {/* Radio button / Indicador alineado a la derecha */}
        <div
          className={cn(
            'w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ml-3',
            isSelected
              ? 'border-primary-600 bg-primary-600 text-white shadow-xs'
              : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 group-hover:border-slate-400'
          )}
        >
          {isSelected && <div className="w-2 h-2 rounded-full bg-white shrink-0" />}
        </div>
      </button>
    )
  }

  const renderListContent = () => (
    <div className="flex-1 overflow-y-auto">
      {/* 1. Categoría Regulares */}
      {regularOptions.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider py-1.5 px-4 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
            Regulares
          </div>
          <div>
            {regularOptions.map(renderOptionRow)}
          </div>
        </div>
      )}

      {/* 2. Categoría Irregulares */}
      {irregularOptions.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider py-1.5 px-4 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
            Irregulares
          </div>
          <div>
            {irregularOptions.map(renderOptionRow)}
          </div>
        </div>
      )}

      {/* 3. Categoría Amalgamas / Compuestos si existen */}
      {amalgamOptions.length > 0 && (
        <div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider py-1.5 px-4 bg-slate-50 dark:bg-slate-800/50 sticky top-0 z-10">
            Amalgamas y Compuestos
          </div>
          <div>
            {amalgamOptions.map(renderOptionRow)}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className={cn('relative w-full text-left', className)} ref={containerRef}>
      {/* Botón Disparador del Selector */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 font-bold text-xs sm:text-sm text-slate-900 dark:text-white hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs transition-all group"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Sliders className="w-4 h-4 text-primary-500 shrink-0" />
          <span className="truncate">
            {selectedOption?.name || 'Seleccionar subdivisión'}
          </span>
          {selectedOption?.bracketLabel && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              {selectedOption.bracketLabel}
            </span>
          )}
        </div>

        <ChevronDown
          className={cn(
            'w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2 group-hover:text-slate-600 dark:group-hover:text-slate-200',
            isOpen && 'rotate-180 text-primary-500'
          )}
        />
      </button>

      {/* Contenido Desplegable */}
      {isOpen && (
        <>
          {/* 1. MÓVIL (< md): Bottom Sheet Modal con Backdrop Completo vía Portal */}
          <div className="md:hidden">
            {mounted && typeof document !== 'undefined' &&
              createPortal(
                <div
                  className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200"
                  onClick={(e) => {
                    if (e.target === e.currentTarget) setIsOpen(false)
                  }}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Subdivisión del Compás"
                >
                  <div
                    className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0 max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Barra de arrastre visual superior en mobile */}
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 shrink-0 sm:hidden" />

                    {/* Encabezado */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">
                          Subdivisión del Compás
                        </h3>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Métrica {timeSignature} • Selecciona la figura rítmica
                        </p>
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

                    {/* Lista de Opciones de Subdivisión */}
                    {renderListContent()}
                  </div>
                </div>,
                document.body
              )}
          </div>

          {/* 2. ESCRITORIO (>= md): Popover Flotante Alineado Debajo del Botón */}
          <div className="hidden md:block absolute left-0 top-full z-50 mt-1.5 w-full min-w-[320px] max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 max-h-[420px] flex flex-col">
            {renderListContent()}
          </div>
        </>
      )}
    </div>
  )
}
