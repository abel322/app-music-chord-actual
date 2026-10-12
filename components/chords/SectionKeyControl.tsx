'use client'

import React, { useState } from 'react'
import { Sparkles, Music, X, ArrowRight } from 'lucide-react'
import { SectionMeasures } from '@/types/measure'
import { CHROMATIC_KEYS, getSemitoneDiff, shiftKey } from '@/lib/transpose'
import { sectionHasChords } from '@/lib/measure-utils'
import { cn } from '@/lib/utils'

interface SectionKeyControlProps {
  section: SectionMeasures
  globalKey: string
  isEditing?: boolean
  onUpdateSectionKey: (sectionId: string, newKey: string | null, transposeChords: boolean) => void
}

interface PendingTranspose {
  sectionId: string
  sectionLabel: string
  fromKey: string
  toKey: string
  targetKeySignature: string | null
  semitones: number
}

export function SectionKeyControl({
  section,
  globalKey,
  isEditing = false,
  onUpdateSectionKey,
}: SectionKeyControlProps) {
  const [pendingModal, setPendingModal] = useState<PendingTranspose | null>(null)

  const effectiveKey = section.keySignature || globalKey
  const isModulated = Boolean(section.keySignature && section.keySignature !== globalKey)
  const semitoneDiff = isModulated ? getSemitoneDiff(globalKey, effectiveKey) : 0
  const diffLabel = semitoneDiff > 0 ? `+${semitoneDiff}` : `${semitoneDiff}`

  // Solicitar cambio de tonalidad
  const requestKeyChange = (targetKey: string | null) => {
    const targetEffectiveKey = targetKey || globalKey

    // Si no hay cambio respecto al estado actual
    if (targetKey === (section.keySignature || null)) {
      return
    }

    // Si las tonalidades efectivas son iguales (ej: heredar cuando ya tenía la misma)
    if (effectiveKey === targetEffectiveKey) {
      onUpdateSectionKey(section.id, targetKey, false)
      return
    }

    // Si la sección no contiene ningún acorde, aplicar directamente sin confirmar
    const hasExistingChords = sectionHasChords(section)
    if (!hasExistingChords) {
      onUpdateSectionKey(section.id, targetKey, false)
      return
    }

    // Si tiene acordes, calcular semitonos y abrir modal de confirmación
    const semitones = getSemitoneDiff(effectiveKey, targetEffectiveKey)
    if (semitones === 0) {
      onUpdateSectionKey(section.id, targetKey, false)
      return
    }

    setPendingModal({
      sectionId: section.id,
      sectionLabel: section.label || 'Sección',
      fromKey: effectiveKey,
      toKey: targetEffectiveKey,
      targetKeySignature: targetKey,
      semitones,
    })
  }

  // Desplazar 1 semitono (+1 o -1)
  const handleShift = (delta: number) => {
    const nextKey = shiftKey(effectiveKey, delta)
    requestKeyChange(nextKey)
  }

  // Confirmar desde el modal
  const handleConfirm = (transposeChords: boolean) => {
    if (!pendingModal) return
    onUpdateSectionKey(pendingModal.sectionId, pendingModal.targetKeySignature, transposeChords)
    setPendingModal(null)
  }

  return (
    <>
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Badge Visual de Modulación (Visible siempre si hay modulación) */}
        {isModulated && (
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 shadow-2xs animate-in fade-in"
            title={`Sección modulada ${diffLabel} semitonos respecto al tono global (${globalKey})`}
          >
            <span className="text-[11px]">🎵</span>
            <span>Modulación: {diffLabel} st</span>
            <span className="font-mono bg-purple-200/80 dark:bg-purple-900/80 px-1 py-0.2 rounded text-[10px]">
              {effectiveKey}
            </span>
          </div>
        )}

        {/* Controles de Edición de Tonalidad (Solo en modo edición) */}
        {isEditing && (
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-950/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            {/* Selector de Tono */}
            <select
              value={section.keySignature || ''}
              onChange={(e) => requestKeyChange(e.target.value ? e.target.value : null)}
              className={cn(
                'text-xs font-bold py-1 px-2 rounded-lg border bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer transition-colors',
                isModulated
                  ? 'border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-extrabold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              )}
              title={`Tonalidad activa de esta sección: ${effectiveKey}`}
            >
              <option value="">Heredar global ({globalKey})</option>
              {CHROMATIC_KEYS.map((k) => (
                <option key={k} value={k}>
                  {k} {k === globalKey ? '(Global)' : ''}
                </option>
              ))}
            </select>

            {/* Botón ♭ -1 */}
            <button
              type="button"
              onClick={() => handleShift(-1)}
              className="px-2 py-1 text-xs font-extrabold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-950/50 dark:hover:text-purple-300 transition-colors active:scale-95 shadow-2xs"
              title="Bajar 1 semitono a esta sección (♭ -1)"
            >
              ♭ -1
            </button>

            {/* Botón ♯ +1 */}
            <button
              type="button"
              onClick={() => handleShift(1)}
              className="px-2 py-1 text-xs font-extrabold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-700 dark:hover:bg-purple-950/50 dark:hover:text-purple-300 transition-colors active:scale-95 shadow-2xs"
              title="Subir 1 semitono a esta sección (♯ +1)"
            >
              ♯ +1
            </button>
          </div>
        )}
      </div>

      {/* Modal Flotante de Confirmación de Transposición */}
      {pendingModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPendingModal(null)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shadow-xs shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    Modulación de Tonalidad
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {pendingModal.sectionLabel}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPendingModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comparativa de Tonalidades */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50">
              <div className="text-center flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Tono Anterior
                </span>
                <span className="text-lg font-black font-mono text-slate-800 dark:text-slate-200">
                  {pendingModal.fromKey}
                </span>
              </div>

              <div className="flex flex-col items-center px-2">
                <ArrowRight className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                  {pendingModal.semitones > 0 ? `+${pendingModal.semitones}` : pendingModal.semitones} st
                </span>
              </div>

              <div className="text-center flex-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nuevo Tono
                </span>
                <span className="text-lg font-black font-mono text-purple-700 dark:text-purple-300">
                  {pendingModal.toKey}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Esta sección ya contiene compases con acordes asignados. Selecciona cómo deseas aplicar el cambio:
            </p>

            {/* Opciones Explícitas */}
            <div className="space-y-2 pt-1">
              {/* Opción 1: Transponer acordes existentes */}
              <button
                type="button"
                onClick={() => handleConfirm(true)}
                className="w-full flex items-start gap-3 p-3.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/80 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-left transition-all group active:scale-[0.99] shadow-2xs"
              >
                <div className="p-2 rounded-lg bg-purple-600 text-white shrink-0 mt-0.5 shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-extrabold text-purple-950 dark:text-purple-200 group-hover:text-purple-700 dark:group-hover:text-purple-100">
                    Transponer acordes existentes
                  </div>
                  <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80 mt-0.5 leading-snug">
                    Transporta automáticamente todos los acordes de la sección {pendingModal.semitones > 0 ? `+${pendingModal.semitones}` : pendingModal.semitones} semitonos (ej. {pendingModal.fromKey} ➔ {pendingModal.toKey}, afectando fundamentales y bajos slash).
                  </p>
                </div>
              </button>

              {/* Opción 2: Solo cambiar referencia de tono */}
              <button
                type="button"
                onClick={() => handleConfirm(false)}
                className="w-full flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-all group active:scale-[0.99] shadow-2xs"
              >
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 mt-0.5">
                  <Music className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    Solo cambiar referencia de tono
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    Deja los acordes y slots exactamente como están y solo actualiza la tonalidad y los grados diatónicos de la sección.
                  </p>
                </div>
              </button>
            </div>

            {/* Botón Cancelar */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPendingModal(null)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
