'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Minus, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SectionTempoControlProps {
  sectionId: string
  tempoOverride?: number | null
  globalTempo?: number
  isEditing?: boolean
  onUpdateSectionTempo?: (sectionId: string, tempo: number | null) => void
  className?: string
}

/**
 * Retorna el descriptor cualitativo del tempo musical según el estándar en español
 */
export function getTempoDescriptor(bpm: number): string {
  if (bpm < 76) return 'Lento'
  if (bpm <= 108) return 'Tranquilo'
  if (bpm <= 125) return 'Moderado'
  if (bpm <= 168) return 'Animado'
  return 'Rápido'
}

export function SectionTempoControl({
  sectionId,
  tempoOverride,
  globalTempo = 120,
  isEditing = false,
  onUpdateSectionTempo,
  className,
}: SectionTempoControlProps) {
  const hasOverride = tempoOverride !== null && tempoOverride !== undefined && Number(tempoOverride) > 0
  const effectiveTempo = hasOverride ? Number(tempoOverride) : (Number(globalTempo) || 120)
  const tempoDescriptor = getTempoDescriptor(effectiveTempo)

  // Estado local como string para permitir borrar y tipear cualquier número sin bloqueos por validación prematura
  const [localTempo, setLocalTempo] = useState<string>(
    hasOverride ? String(tempoOverride) : String(globalTempo || 120)
  )

  // Sincronizar estado local si cambia desde props
  useEffect(() => {
    if (tempoOverride !== null && tempoOverride !== undefined) {
      setLocalTempo(String(tempoOverride))
    } else if (globalTempo) {
      setLocalTempo(String(globalTempo))
    }
  }, [tempoOverride, globalTempo])

  // Aplicar validación y persistencia SOLO al salir del input o pulsar Enter
  const commitTempo = () => {
    let parsed = parseInt(localTempo, 10)
    if (isNaN(parsed) || parsed < 30) parsed = 30
    if (parsed > 300) parsed = 300

    setLocalTempo(parsed.toString())
    onUpdateSectionTempo?.(sectionId, parsed)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commitTempo()
      e.currentTarget.blur()
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value
    // Permitir dejar el campo vacío mientras escribe o poner dígitos numéricos
    if (text === '' || /^\d+$/.test(text)) {
      setLocalTempo(text)
      const parsed = parseInt(text, 10)
      // Actualizar en vivo SOLO si ya es un número completo válido dentro del rango
      if (!isNaN(parsed) && parsed >= 30 && parsed <= 300) {
        onUpdateSectionTempo?.(sectionId, parsed)
      }
    }
  }

  // Desplazar BPM (+/- delta) con botones - y +
  const handleShiftTempo = (delta: number) => {
    if (!onUpdateSectionTempo) return
    const current = hasOverride ? Number(tempoOverride) : (Number(globalTempo) || 120)
    const next = Math.max(30, Math.min(300, current + delta))
    setLocalTempo(next.toString())
    onUpdateSectionTempo(sectionId, next)
  }

  // Activar BPM propio
  const handleEnableCustomBpm = () => {
    if (!onUpdateSectionTempo) return
    const initialBpm = Math.max(30, Math.min(300, Number(globalTempo) || 120))
    setLocalTempo(initialBpm.toString())
    onUpdateSectionTempo(sectionId, initialBpm)
  }

  // Desactivar y volver a heredar global
  const handleInheritGlobal = () => {
    if (!onUpdateSectionTempo) return
    setLocalTempo((globalTempo || 120).toString())
    onUpdateSectionTempo(sectionId, null)
  }

  // Modo lectura / No edición
  if (!isEditing) {
    if (hasOverride) {
      return (
        <div
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-black shadow-2xs border select-none transition-all',
            'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
            className
          )}
          title={`Tempo específico de esta sección: ${tempoOverride} BPM (${tempoDescriptor}). El tempo global es ${globalTempo} BPM.`}
        >
          <span className="text-[11px]">⏱️</span>
          <span>{tempoOverride} BPM</span>
          <span className="text-[10px] font-bold opacity-80 font-mono">({tempoDescriptor})</span>
        </div>
      )
    }
    return null
  }

  // Modo edición: Botonera limpia y compacta sin duplicidades
  return (
    <div className={cn('inline-flex items-center gap-1.5 flex-wrap select-none', className)}>
      {hasOverride ? (
        /* Estado: BPM propio activo con botones - / +, Input numérico centrado y Revertir a Heredar */
        <div className="flex items-center gap-1 bg-amber-50/80 dark:bg-amber-950/40 p-1 rounded-xl border border-amber-300/80 dark:border-amber-800/80 shadow-2xs animate-in fade-in">
          {/* Botón Decrementar (-) */}
          <button
            type="button"
            onClick={() => handleShiftTempo(-1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors active:scale-95 shadow-2xs font-extrabold cursor-pointer"
            title="Bajar 1 BPM a esta sección"
            aria-label="Disminuir tempo de sección"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          {/* Input numérico centrado con manejo de estado local fluido */}
          <div className="relative flex items-center">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={localTempo}
              onChange={handleChange}
              onBlur={commitTempo}
              onKeyDown={handleKeyDown}
              className="w-14 text-center font-bold px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono shadow-inner"
              title="BPM de esta sección (30-300). Presiona Enter o haz clic fuera para confirmar."
            />
          </div>

          {/* Botón Incrementar (+) */}
          <button
            type="button"
            onClick={() => handleShiftTempo(1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors active:scale-95 shadow-2xs font-extrabold cursor-pointer"
            title="Subir 1 BPM a esta sección"
            aria-label="Aumentar tempo de sección"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider select-none px-1">
            BPM
          </span>

          {/* Botón Revertir a Heredar Global */}
          <button
            type="button"
            onClick={handleInheritGlobal}
            className="flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-lg text-slate-500 dark:text-slate-400 hover:text-amber-900 dark:hover:text-amber-200 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
            title={`Quitar tempo propio y heredar el tempo global (${globalTempo} BPM)`}
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Heredar</span>
          </button>
        </div>
      ) : (
        /* Estado por defecto: Heredar ({globalTempo} BPM) con botón para activar BPM propio */
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleEnableCustomBpm}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
            title={`Hereda el tempo global de la canción (${globalTempo} BPM). Haz clic para asignar un BPM propio a esta sección.`}
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Heredar ({globalTempo} BPM)</span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-100/60 dark:bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-900">
              + BPM propio
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
