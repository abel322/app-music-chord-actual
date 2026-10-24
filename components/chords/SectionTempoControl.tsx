'use client'

import React, { useState } from 'react'
import { Clock, Minus, Plus, RotateCcw, X } from 'lucide-react'
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

  // Desplazar BPM (+/- delta)
  const handleShiftTempo = (delta: number) => {
    if (!onUpdateSectionTempo) return
    const current = effectiveTempo
    const next = Math.max(30, Math.min(300, current + delta))
    onUpdateSectionTempo(sectionId, next)
  }

  // Activar BPM propio
  const handleEnableCustomBpm = () => {
    if (!onUpdateSectionTempo) return
    onUpdateSectionTempo(sectionId, effectiveTempo)
  }

  // Desactivar y volver a heredar global
  const handleInheritGlobal = () => {
    if (!onUpdateSectionTempo) return
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

  // Modo edición
  return (
    <div className={cn('inline-flex items-center gap-1.5 flex-wrap', className)}>
      {hasOverride ? (
        /* Estado: BPM propio activo con Badge visible, Input y botones - / + */
        <div className="flex items-center gap-1 bg-amber-50/80 dark:bg-amber-950/40 p-1 rounded-xl border border-amber-300/80 dark:border-amber-800/80 shadow-2xs animate-in fade-in">
          {/* Badge de tempo propio */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-black text-amber-800 dark:text-amber-300"
            title={`Tempo asignado a esta sección: ${tempoOverride} BPM (${tempoDescriptor})`}
          >
            <span className="text-[11px]">⏱️</span>
            <span className="font-mono">{tempoOverride}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">BPM</span>
          </div>

          {/* Botón Decrementar (-) */}
          <button
            type="button"
            onClick={() => handleShiftTempo(-1)}
            className="w-6 h-6 flex items-center justify-center rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors active:scale-95 shadow-2xs font-extrabold"
            title="Bajar 1 BPM a esta sección"
            aria-label="Disminuir tempo de sección"
          >
            <Minus className="w-3 h-3" />
          </button>

          {/* Input numérico directo */}
          <input
            type="number"
            min={30}
            max={300}
            value={tempoOverride ?? ''}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val)) {
                onUpdateSectionTempo?.(sectionId, Math.max(30, Math.min(300, val)))
              }
            }}
            className="w-12 text-center text-xs font-bold font-mono py-0.5 px-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-950 dark:text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            title="Valor en BPM para esta sección (30-300)"
          />

          {/* Botón Incrementar (+) */}
          <button
            type="button"
            onClick={() => handleShiftTempo(1)}
            className="w-6 h-6 flex items-center justify-center rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors active:scale-95 shadow-2xs font-extrabold"
            title="Subir 1 BPM a esta sección"
            aria-label="Aumentar tempo de sección"
          >
            <Plus className="w-3 h-3" />
          </button>

          {/* Botón Revertir a Heredar Global */}
          <button
            type="button"
            onClick={handleInheritGlobal}
            className="flex items-center gap-1 px-1.5 py-1 text-[11px] font-bold rounded-lg text-slate-500 dark:text-slate-400 hover:text-amber-800 dark:hover:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors"
            title={`Quitar tempo propio y heredar el tempo global (${globalTempo} BPM)`}
          >
            <X className="w-3 h-3" />
            <span className="hidden sm:inline">Heredar</span>
          </button>
        </div>
      ) : (
        /* Estado por defecto: Heredar ({song.tempo} BPM) con botón para activar BPM propio */
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleEnableCustomBpm}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50/60 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
            title={`Hereda el tempo global de la canción (${globalTempo} BPM). Haz clic para asignar un BPM propio a esta sección.`}
          >
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Heredar ({globalTempo} BPM)</span>
            <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold bg-amber-100/60 dark:bg-amber-950/80 px-1 py-0.2 rounded border border-amber-200 dark:border-amber-900">
              + BPM propio
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
