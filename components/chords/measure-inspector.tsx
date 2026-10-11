'use client'

import React, { useState } from 'react'
import { Measure, ChordBeat, SubBeatSlot, BeatAccent, SubdivisionType } from '@/types/measure'
import { HarmonicProgression, CadenceDefinition, PRESET_CADENCES } from '@/lib/harmonic-theory'
import { createSubSlotsForSubdivision, SUBDIVISION_OPTIONS } from '@/lib/rhythm-utils'
import { ProgressionPicker } from './ProgressionPicker'
import { CadencePicker } from './CadencePicker'
import { Copy, Split, Sparkles, Tag, Layers, Music, X, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MeasureInspectorProps {
  selectedMeasure: Measure
  measures: Measure[]
  currentKey?: string
  timeSignature?: string
  diatonicChords?: string[]
  onUpdateMeasure: (updated: Measure) => void
  onDuplicate: (measureId: string) => void
  onSplitMeasure: (measureId: string, c1: string, c2: string) => void
  onApplyProgression: (measureId: string, prog: HarmonicProgression) => void
  onToggleRepeat: (measureId: string, type: 'start' | 'end') => void
  onToggleVolta: (measureId: string, volta: number) => void
}

const ACCENT_OPTIONS: { value: BeatAccent; label: string; symbol: string }[] = [
  { value: 'normal', label: 'Normal', symbol: '—' },
  { value: 'accent', label: 'Acento', symbol: '>' },
  { value: 'cut', label: 'Corte / Stop', symbol: '•' },
  { value: 'syncopated', label: 'Síncopa', symbol: '^' },
]

export function MeasureInspector({
  selectedMeasure,
  measures,
  currentKey = 'C',
  timeSignature = '4/4',
  diatonicChords = [],
  onUpdateMeasure,
  onDuplicate,
  onSplitMeasure,
  onApplyProgression,
  onToggleRepeat,
  onToggleVolta,
}: MeasureInspectorProps) {
  const beatsCount = parseInt(timeSignature.split('/')[0], 10) || 4

  // Asignar o actualizar el acorde principal de un pulso
  const handleUpdateBeatChord = (beatNum: number, newChord: string) => {
    const trimmed = newChord.trim()
    const updatedBeats = [...selectedMeasure.beats]
    const existingIndex = updatedBeats.findIndex((b) => b.beat === beatNum)

    if (trimmed === '') {
      if (existingIndex !== -1) {
        updatedBeats.splice(existingIndex, 1)
      }
    } else {
      if (existingIndex !== -1) {
        updatedBeats[existingIndex] = {
          ...updatedBeats[existingIndex],
          chord: trimmed,
        }
      } else {
        updatedBeats.push({
          id: `beat-${Date.now()}-${beatNum}`,
          beat: beatNum,
          chord: trimmed,
          accent: 'normal',
          subdivision: '1/4',
        })
      }
    }

    updatedBeats.sort((a, b) => a.beat - b.beat)
    onUpdateMeasure({
      ...selectedMeasure,
      beats: updatedBeats,
    })
  }

  // Cambiar la subdivisión rítmica de un pulso individual (ej. 1/8, triplet, 1/16)
  const handleChangeBeatSubdivision = (beatNum: number, newSubdivision: SubdivisionType) => {
    const updatedBeats = [...selectedMeasure.beats]
    const existingIndex = updatedBeats.findIndex((b) => b.beat === beatNum)

    const baseChord = existingIndex !== -1 ? updatedBeats[existingIndex].chord : ''
    const generatedSlots = createSubSlotsForSubdivision(newSubdivision, beatNum, baseChord)

    if (existingIndex !== -1) {
      updatedBeats[existingIndex] = {
        ...updatedBeats[existingIndex],
        subdivision: newSubdivision,
        subSlots: generatedSlots,
      }
    } else {
      updatedBeats.push({
        id: `beat-${Date.now()}-${beatNum}`,
        beat: beatNum,
        chord: baseChord || 'C',
        accent: 'normal',
        subdivision: newSubdivision,
        subSlots: generatedSlots,
      })
    }

    onUpdateMeasure({
      ...selectedMeasure,
      beats: updatedBeats,
    })
  }

  // Actualizar un slot específico de micro-timing dentro de un pulso
  const handleUpdateSubSlotChord = (beatNum: number, slotIndex: number, newChord: string) => {
    const updatedBeats = [...selectedMeasure.beats]
    const beatIndex = updatedBeats.findIndex((b) => b.beat === beatNum)
    if (beatIndex === -1 || !updatedBeats[beatIndex].subSlots) return

    const slots = [...updatedBeats[beatIndex].subSlots!]
    if (slots[slotIndex]) {
      slots[slotIndex] = {
        ...slots[slotIndex],
        chord: newChord.trim(),
      }
    }

    updatedBeats[beatIndex] = {
      ...updatedBeats[beatIndex],
      subSlots: slots,
    }

    onUpdateMeasure({
      ...selectedMeasure,
      beats: updatedBeats,
    })
  }

  // Cambiar acento rítmico de un pulso
  const handleChangeBeatAccent = (beatNum: number, accent: BeatAccent) => {
    const updatedBeats = [...selectedMeasure.beats]
    const beatIndex = updatedBeats.findIndex((b) => b.beat === beatNum)
    if (beatIndex === -1) return

    updatedBeats[beatIndex] = {
      ...updatedBeats[beatIndex],
      accent,
    }

    onUpdateMeasure({
      ...selectedMeasure,
      beats: updatedBeats,
    })
  }

  // Asignar o desasignar cadencia
  const handleSelectCadence = (cad: CadenceDefinition | null) => {
    if (!cad) {
      onUpdateMeasure({
        ...selectedMeasure,
        cadence: undefined,
        cadenceLabel: undefined,
        cadenceColor: undefined,
      })
    } else {
      onUpdateMeasure({
        ...selectedMeasure,
        cadence: cad.id || cad.type,
        cadenceLabel: `${cad.name} (${cad.degrees})`,
        cadenceColor: cad.colorBadge,
      })
    }
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-md animate-in fade-in space-y-4">
      {/* Barra Superior del Inspector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-primary-600 text-white shadow-sm">
            Compás #{selectedMeasure.measureNumber}
          </span>
          <span className="text-xs text-slate-500">
            Ajuste de acordes por pulso, micro-timing, cadencias y amalgamas
          </span>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Progresión Modular */}
          <ProgressionPicker
            currentKey={currentKey}
            buttonLabel="✦ Progresión desde aquí"
            buttonVariant="subtle"
            onSelectProgression={(prog) => onApplyProgression(selectedMeasure.id, prog)}
          />

          {/* Cadencia Modular */}
          <CadencePicker
            currentCadenceId={selectedMeasure.cadence}
            buttonLabel="✦ Marcar Cadencia"
            buttonVariant="subtle"
            onSelectCadence={handleSelectCadence}
          />

          {/* Duplicar Compás */}
          <button
            type="button"
            onClick={() => onDuplicate(selectedMeasure.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm"
            title="Clonar este compás"
          >
            <Copy className="w-3.5 h-3.5" /> Duplicar
          </button>

          {/* Dividir en 2 Acordes (Beat 1 y Beat 3) */}
          <button
            type="button"
            onClick={() => {
              const c1 = selectedMeasure.beats[0]?.chord || (diatonicChords[0] || 'C')
              const c2 = diatonicChords[4] || 'G'
              onSplitMeasure(selectedMeasure.id, c1, c2)
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-950/50 transition-colors shadow-sm"
            title="Dividir en 2 acordes de 2 tiempos"
          >
            <Split className="w-3.5 h-3.5" /> 2 Acordes / Compás
          </button>

          {/* Repeticiones */}
          <button
            type="button"
            onClick={() => onToggleRepeat(selectedMeasure.id, 'start')}
            className={cn(
              'px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-colors shadow-sm',
              selectedMeasure.repeatStart
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            )}
          >
            |: Inicio
          </button>
          <button
            type="button"
            onClick={() => onToggleRepeat(selectedMeasure.id, 'end')}
            className={cn(
              'px-2 py-1 rounded-lg text-xs font-mono font-bold border transition-colors shadow-sm',
              selectedMeasure.repeatEnd
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            )}
          >
            :| Fin
          </button>

          {/* Casillas Volta (1ª / 2ª) */}
          <button
            type="button"
            onClick={() => onToggleVolta(selectedMeasure.id, 1)}
            className={cn(
              'px-2 py-1 rounded-lg text-xs font-bold border transition-colors shadow-sm',
              selectedMeasure.volta === 1
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            )}
          >
            1ª Casilla
          </button>
          <button
            type="button"
            onClick={() => onToggleVolta(selectedMeasure.id, 2)}
            className={cn(
              'px-2 py-1 rounded-lg text-xs font-bold border transition-colors shadow-sm',
              selectedMeasure.volta === 2
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            )}
          >
            2ª Casilla
          </button>
        </div>
      </div>

      {/* Editor de Pulsos y Subdivisiones Rítmicas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-primary-500" />
            <span>Pulsos y Subdivisiones Rítmicas ({timeSignature})</span>
          </label>

          {/* Subdivisión Global / Amalgamas */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-slate-400">Métrica especial / Amalgama:</span>
            <select
              value={selectedMeasure.subdivisionGrouping || ''}
              onChange={(e) => {
                const val = e.target.value
                onUpdateMeasure({
                  ...selectedMeasure,
                  subdivisionGrouping: val || undefined,
                  subdivision: (val as SubdivisionType) || undefined,
                })
              }}
              className="px-2 py-1 text-[11px] font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            >
              <option value="">Estándar ({timeSignature})</option>
              <option value="3+2">Amalgama 3+2 (5/8)</option>
              <option value="2+3">Amalgama 2+3 (5/8)</option>
              <option value="3+3+2">Amalgama 3+3+2 (8/8)</option>
            </select>
          </div>
        </div>

        {/* Tarjetas de cada pulso con slots de micro-timing */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: beatsCount }).map((_, idx) => {
            const bNum = idx + 1
            const currentBeat = selectedMeasure.beats.find((b) => b.beat === bNum)
            const hasSubSlots = currentBeat?.subSlots && currentBeat.subSlots.length > 1
            const currentSubdivision = currentBeat?.subdivision || '1/4'

            return (
              <div
                key={bNum}
                className="flex flex-col gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
              >
                {/* Cabecera del Pulso */}
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span className="text-slate-800 dark:text-slate-200 font-black">
                    Pulso {bNum}
                  </span>

                  {/* Selector de Acento */}
                  <div className="flex items-center gap-1">
                    {ACCENT_OPTIONS.map((acc) => (
                      <button
                        key={acc.value}
                        type="button"
                        onClick={() => handleChangeBeatAccent(bNum, acc.value)}
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-black transition-colors',
                          currentBeat?.accent === acc.value
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        )}
                        title={acc.label}
                      >
                        {acc.symbol}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Acorde Principal del Pulso */}
                <div className="space-y-1">
                  <input
                    type="text"
                    defaultValue={currentBeat?.chord || ''}
                    placeholder={`Acorde ${bNum}`}
                    onBlur={(e) => handleUpdateBeatChord(bNum, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateBeatChord(bNum, (e.target as HTMLInputElement).value)
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-sm font-mono font-extrabold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase text-slate-900 dark:text-white"
                  />
                </div>

                {/* Selector de Subdivisión Rítmica de este pulso */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">
                    Subdivisión:
                  </label>
                  <select
                    value={currentSubdivision}
                    onChange={(e) => handleChangeBeatSubdivision(bNum, e.target.value as SubdivisionType)}
                    className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="1/4">Negra (1 pulso)</option>
                    <option value="1/8">Corcheas (1 & - Contratiempo)</option>
                    <option value="1/16">Semicorcheas (1 e & a)</option>
                    <option value="triplet">Tresillo [ 3 ]</option>
                    <option value="quintuplet">Cincillo [ 5 ]</option>
                    <option value="sextuplet">Seisillo [ 6 ]</option>
                  </select>
                </div>

                {/* Micro-slots de tiempo si el pulso está subdividido */}
                {hasSubSlots && (
                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-primary-500 block">
                      Micro-Slots de Acorde:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {currentBeat!.subSlots!.map((slot, sIdx) => (
                        <div key={slot.id || sIdx} className="flex flex-col gap-0.5">
                          <span className="text-[9px] font-mono text-slate-400 font-bold">
                            Slot {slot.label}:
                          </span>
                          <input
                            type="text"
                            defaultValue={slot.chord || ''}
                            placeholder={sIdx === 0 ? currentBeat?.chord || '' : 'Acorde &'}
                            onBlur={(e) => handleUpdateSubSlotChord(bNum, sIdx, e.target.value)}
                            className="w-full px-1.5 py-1 text-xs font-mono font-bold rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white uppercase"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Paleta rápida de Acordes Diatónicos en la tonalidad activa */}
      {diatonicChords.length > 0 && (
        <div className="pt-1 flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-primary-500" /> Acordes en {currentKey}:
          </span>
          {diatonicChords.map((chord) => (
            <button
              key={chord}
              type="button"
              onClick={() => {
                handleUpdateBeatChord(1, chord)
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-primary-50 dark:hover:bg-primary-950/60 hover:text-primary-600 transition-colors shadow-sm"
            >
              {chord}
            </button>
          ))}
        </div>
      )}

      {/* Letra Guía del Compás y Atajos de Cadencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
        {/* Letra rítmica guía */}
        <div>
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
            Letra rítmica de guía para este compás:
          </label>
          <input
            type="text"
            defaultValue={selectedMeasure.guideLyric || ''}
            placeholder="Ej: Cuando la noche cae..."
            onBlur={(e) => {
              onUpdateMeasure({
                ...selectedMeasure,
                guideLyric: e.target.value,
              })
            }}
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Insignia / Atajos Rápidos de Cadencia */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-purple-500" /> Insignia de Cadencia en este compás:
            </label>
            {selectedMeasure.cadence && (
              <button
                type="button"
                onClick={() => handleSelectCadence(null)}
                className="text-[11px] text-red-500 hover:underline font-semibold"
              >
                Quitar Cadencia
              </button>
            )}
          </div>

          {/* Botones de 1 clic para cadencias frecuentes */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_CADENCES.slice(0, 6).map((cad) => {
              const isActive = selectedMeasure.cadence === cad.type || selectedMeasure.cadence === cad.id
              return (
                <button
                  key={cad.id}
                  type="button"
                  onClick={() => handleSelectCadence(cad)}
                  className={cn(
                    'px-2 py-1 rounded-md text-[10px] font-bold border transition-all truncate',
                    isActive
                      ? cn(cad.colorBadge, 'ring-2 ring-purple-500/50')
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-300'
                  )}
                  title={cad.description}
                >
                  {cad.name.split('(')[0].replace('Cadencia ', '')} ({cad.degrees})
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
