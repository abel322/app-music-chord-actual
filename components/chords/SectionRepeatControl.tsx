'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Repeat, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionRepeatControlProps {
  repeatCount?: number
  measuresCount: number
  isEditing?: boolean
  onUpdateRepeatCount?: (count: number) => void
  className?: string
}

const REPEAT_PRESETS = [
  { value: 1, label: '1x', desc: 'Sin repetir' },
  { value: 2, label: '2x', desc: '2 vueltas' },
  { value: 3, label: '3x', desc: '3 vueltas' },
  { value: 4, label: '4x', desc: '4 vueltas' },
  { value: 8, label: '8x', desc: '8 vueltas' },
]

export function SectionRepeatControl({
  repeatCount = 1,
  measuresCount,
  isEditing = false,
  onUpdateRepeatCount,
  className,
}: SectionRepeatControlProps) {
  const currentRepeats = Math.max(1, Number(repeatCount) || 1)
  const [isOpen, setIsOpen] = useState(false)
  const [customValue, setCustomValue] = useState<string>('')
  const containerRef = useRef<HTMLDivElement>(null)

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

  const handleSelectPreset = (value: number) => {
    onUpdateRepeatCount?.(value)
    setIsOpen(false)
  }

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseInt(customValue, 10)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 32) {
      onUpdateRepeatCount?.(parsed)
      setIsOpen(false)
      setCustomValue('')
    }
  }

  const totalEffectiveMeasures = measuresCount * currentRepeats

  return (
    <div className={cn('relative inline-flex items-center', className)} ref={containerRef}>
      {/* Botón Disparador del Selector */}
      {currentRepeats > 1 ? (
        /* Badge Destacado Morado cuando repeatCount > 1 */
        <button
          type="button"
          onClick={() => {
            if (onUpdateRepeatCount) setIsOpen(!isOpen)
          }}
          disabled={!onUpdateRepeatCount}
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-bold transition-all shadow-2xs border select-none',
            'bg-purple-100 hover:bg-purple-200/80 text-purple-700 dark:bg-purple-950/70 dark:hover:bg-purple-900/60 dark:text-purple-300 border-purple-200 dark:border-purple-800/80',
            onUpdateRepeatCount && 'cursor-pointer active:scale-95'
          )}
          title={`Esta sección se repite ${currentRepeats} veces (${totalEffectiveMeasures} compases reales). Haz clic para modificar.`}
        >
          <Repeat className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>
            {currentRepeats}x ({totalEffectiveMeasures} compases)
          </span>
          {onUpdateRepeatCount && (
            <ChevronDown
              className={cn(
                'w-3 h-3 opacity-70 transition-transform duration-150',
                isOpen && 'rotate-180'
              )}
            />
          )}
        </button>
      ) : isEditing || onUpdateRepeatCount ? (
        /* Selector Compacto [ 🔁 1x ▾ ] cuando repeatCount === 1 */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-all border select-none cursor-pointer active:scale-95 shadow-2xs',
            isOpen
              ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
              : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 border-slate-200 dark:border-slate-800'
          )}
          title="Configurar vueltas / repeticiones de esta sección (1x, 2x, 4x...)"
        >
          <Repeat className="w-3 h-3 text-slate-400 group-hover:text-purple-500" />
          <span>1x</span>
          <ChevronDown
            className={cn(
              'w-3 h-3 text-slate-400 transition-transform duration-150',
              isOpen && 'rotate-180 text-purple-500'
            )}
          />
        </button>
      ) : null}

      {/* Menú Desplegable Flotante */}
      {isOpen && onUpdateRepeatCount && (
        <div className="absolute left-0 top-full mt-1.5 z-40 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800">
            Repetir Sección:
          </div>

          <div className="space-y-0.5">
            {REPEAT_PRESETS.map((preset) => {
              const isSelected = currentRepeats === preset.value
              const totalM = measuresCount * preset.value
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleSelectPreset(preset.value)}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors text-left cursor-pointer',
                    isSelected
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300'
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{preset.label}</span>
                    <span
                      className={cn(
                        'text-[10px] font-normal',
                        isSelected
                          ? 'text-purple-100'
                          : 'text-slate-400 dark:text-slate-500'
                      )}
                    >
                      ({totalM} compases)
                    </span>
                  </div>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </button>
              )
            })}
          </div>

          {/* Opción Personalizada */}
          <form
            onSubmit={handleCustomSubmit}
            className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1 px-1"
          >
            <input
              type="number"
              min={1}
              max={32}
              placeholder="Otro (ej: 6)"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono font-bold"
            />
            <button
              type="submit"
              className="px-2 py-1 text-[11px] font-bold bg-purple-600 text-white rounded hover:bg-purple-500 transition-colors shrink-0 cursor-pointer"
            >
              OK
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
