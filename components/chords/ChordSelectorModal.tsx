'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  CHORD_ROOTS,
  CHORD_QUALITIES,
  BASS_NOTES,
  COMMON_SLASH_CHORDS,
  ChordCategory,
  normalizeChordInput,
} from '@/lib/chord-catalog'
import { getDiatonicChords } from '@/lib/music-theory'
import { X, Music, Search, Check, Sparkles, VolumeX, Eraser, CornerDownLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChordSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectChord: (chord: string) => void
  initialChord?: string | null
  currentKey?: string
  diatonicChords?: string[]
  slotLabel?: string
  measureNumber?: number
}

// Inversiones armónicas típicas por tónica (3ª mayor, 5ª justa, 7ª menor y 3ª menor)
const ROOT_INVERSIONS: Record<string, { third: string; fifth: string; seventh: string; minorThird: string }> = {
  C: { third: 'E', fifth: 'G', seventh: 'Bb', minorThird: 'Eb' },
  'C#': { third: 'F', fifth: 'G#', seventh: 'B', minorThird: 'E' },
  Db: { third: 'F', fifth: 'Ab', seventh: 'B', minorThird: 'E' },
  D: { third: 'F#', fifth: 'A', seventh: 'C', minorThird: 'F' },
  'D#': { third: 'G', fifth: 'A#', seventh: 'C#', minorThird: 'F#' },
  Eb: { third: 'G', fifth: 'Bb', seventh: 'Db', minorThird: 'Gb' },
  E: { third: 'G#', fifth: 'B', seventh: 'D', minorThird: 'G' },
  F: { third: 'A', fifth: 'C', seventh: 'Eb', minorThird: 'Ab' },
  'F#': { third: 'A#', fifth: 'C#', seventh: 'E', minorThird: 'A' },
  Gb: { third: 'Bb', fifth: 'Db', seventh: 'E', minorThird: 'A' },
  G: { third: 'B', fifth: 'D', seventh: 'F', minorThird: 'Bb' },
  'G#': { third: 'C', fifth: 'D#', seventh: 'F#', minorThird: 'B' },
  Ab: { third: 'C', fifth: 'Eb', seventh: 'Gb', minorThird: 'B' },
  A: { third: 'C#', fifth: 'E', seventh: 'G', minorThird: 'C' },
  'A#': { third: 'D', fifth: 'F', seventh: 'G#', minorThird: 'C#' },
  Bb: { third: 'D', fifth: 'F', seventh: 'Ab', minorThird: 'Db' },
  B: { third: 'D#', fifth: 'F#', seventh: 'A', minorThird: 'D' },
}

export function ChordSelectorModal({
  isOpen,
  onClose,
  onSelectChord,
  initialChord = '',
  currentKey = 'C',
  diatonicChords = [],
  slotLabel = '1',
  measureNumber = 1,
}: ChordSelectorModalProps) {
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Extraer la fundamental de inicio si existe
  const [selectedRoot, setSelectedRoot] = useState<string>(() => {
    if (initialChord && initialChord !== '%') {
      const match = initialChord.match(/^[A-G][#b]?/)
      if (match) return match[0]
    }
    return currentKey || 'C'
  })

  const [activeCategory, setActiveCategory] = useState<ChordCategory>('triads')
  const [freeInput, setFreeInput] = useState<string>('')
  const [selectedCustomBass, setSelectedCustomBass] = useState<string>('')

  // Sincronizar al abrir
  useEffect(() => {
    if (isOpen) {
      if (initialChord && initialChord !== '%') {
        const rootMatch = initialChord.match(/^[A-G][#b]?/)
        if (rootMatch) {
          setSelectedRoot(rootMatch[0])
        }
        if (initialChord.includes('/')) {
          setSelectedCustomBass(initialChord.split('/')[1] || '')
        } else {
          setSelectedCustomBass('')
        }
      } else {
        setSelectedRoot(currentKey || 'C')
        setSelectedCustomBass('')
      }
      setFreeInput('')
    }
  }, [isOpen, initialChord, currentKey])

  // Escuchar tecla Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Obtener acordes diatónicos con grados para la tonalidad
  const diatonicChordsList = useMemo(() => {
    if (diatonicChords && diatonicChords.length > 0) {
      return diatonicChords.map((chord, idx) => {
        const degrees = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
        return {
          chord,
          degree: degrees[idx] || `${idx + 1}`,
        }
      })
    }
    try {
      const res = getDiatonicChords(currentKey)
      return res.inKey.map((item) => ({
        chord: `${item.root}${item.type}`,
        degree: item.degree,
      }))
    } catch {
      return [
        { chord: 'C', degree: 'I' },
        { chord: 'Dm', degree: 'ii' },
        { chord: 'Em', degree: 'iii' },
        { chord: 'F', degree: 'IV' },
        { chord: 'G', degree: 'V' },
        { chord: 'Am', degree: 'vi' },
        { chord: 'Bdim', degree: 'vii°' },
      ]
    }
  }, [diatonicChords, currentKey])

  if (!isOpen) return null

  // 1-CLIC: Asignar acorde inmediatamente y cerrar modal
  const handleSelectChord = (chord: string) => {
    const normalized = normalizeChordInput(chord)
    if (normalized !== undefined) {
      onSelectChord(normalized)
      onClose()
    }
  }

  // Enviar desde input libre
  const handleFreeInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (freeInput.trim()) {
      handleSelectChord(freeInput.trim())
    }
  }

  const filteredQualities = CHORD_QUALITIES.filter((q) => q.category === activeCategory)
  const currentInversion = ROOT_INVERSIONS[selectedRoot] || ROOT_INVERSIONS['C']

  return (
    <div
      className="chord-picker-modal fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Encabezado del Modal */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-900/20 shrink-0">
              <Music className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  Seleccionar Acorde
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 shrink-0">
                  Compás #{measureNumber} • {slotLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Toca cualquier acorde para asignarlo en 1 solo clic
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0 ml-2"
            title="Cerrar modal (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Barra de Búsqueda / Entrada Libre Rápida (1 Clic o Enter) */}
        <div className="p-3 sm:p-4 pb-2.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 shrink-0">
          <form onSubmit={handleFreeInputSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={freeInput}
                onChange={(e) => setFreeInput(e.target.value)}
                placeholder="Escribe libremente (ej: F#m7, Ebmaj9, B/D#, Gsus4)..."
                autoFocus={false}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-2xs"
              />
            </div>
            <button
              type="submit"
              disabled={!freeInput.trim()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary-600 text-white disabled:opacity-40 hover:bg-primary-500 transition-all shadow-sm shrink-0"
              title="Asignar acorde escrito"
            >
              <span>Aplicar</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* 3. Contenedor Principal con Scroll */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-4">
          {/* Bloque A: Acordes Diatónicos en la Tonalidad Actual (1 Clic) */}
          {diatonicChordsList.length > 0 && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Grados Diatónicos en {currentKey}:</span>
                </span>
                <span className="text-[10px] font-semibold text-primary-600 dark:text-primary-400">
                  Inserción inmediata (1 Clic)
                </span>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {diatonicChordsList.map((item) => (
                  <button
                    key={`${item.degree}-${item.chord}`}
                    type="button"
                    onClick={() => handleSelectChord(item.chord)}
                    className="flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50/60 dark:hover:bg-primary-950/50 hover:scale-[1.02] active:scale-95 transition-all text-center shadow-2xs group"
                    title={`Insertar ${item.chord} (${item.degree})`}
                  >
                    <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 whitespace-nowrap">
                      {item.chord}
                    </span>
                    <span className="text-[9px] font-mono font-bold text-slate-400 group-hover:text-primary-500 mt-0.5">
                      {item.degree}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bloque B: Selector de Nota Fundamental (Tónica) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                1. Nota Fundamental (Tónica):
              </span>
              <button
                type="button"
                onClick={() => handleSelectChord(selectedRoot)}
                className="text-[11px] font-mono font-black text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                title={`Insertar ${selectedRoot} Mayor directamente`}
              >
                Insertar {selectedRoot} Mayor &rarr;
              </button>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-17 gap-1">
              {CHORD_ROOTS.map((root) => {
                const isSelected = selectedRoot === root.value
                return (
                  <button
                    key={root.value}
                    type="button"
                    onClick={() => setSelectedRoot(root.value)}
                    className={cn(
                      'py-1.5 px-1 rounded-lg text-xs font-mono font-black border transition-all text-center',
                      isSelected
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-900/30 ring-2 ring-primary-500/30'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/40'
                    )}
                  >
                    {root.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bloque C: Selector de Categorías de Acordes */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                2. Calidad Armónica / Extensión (Toca para asignar en 1 Clic):
              </span>
            </div>

            {/* Pestañas de Categoría */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { id: 'triads' as ChordCategory, label: 'Tríadas' },
                { id: 'sevenths' as ChordCategory, label: 'Séptimas' },
                { id: 'extensions' as ChordCategory, label: 'Extensiones (9, 11, 13)' },
                { id: 'altered' as ChordCategory, label: 'Alterados & Gospel' },
                { id: 'slash_inversion' as ChordCategory, label: 'Slash & Inversiones' },
              ].map((tab) => {
                const isActive = activeCategory === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCategory(tab.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                      isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Grilla de Acordes en 1 Clic (Tríadas, Séptimas, Extensiones, Alterados) */}
            {activeCategory !== 'slash_inversion' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {filteredQualities.map((qual) => {
                  const chordToInsert = `${selectedRoot}${qual.suffix}`
                  return (
                    <button
                      key={qual.id}
                      type="button"
                      onClick={() => handleSelectChord(chordToInsert)}
                      className="flex flex-col items-start p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50/40 dark:hover:bg-primary-950/40 hover:scale-[1.01] active:scale-95 transition-all text-left shadow-2xs group"
                      title={`Asignar ${chordToInsert} en 1 clic`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 whitespace-nowrap">
                          {chordToInsert}
                        </span>
                        <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 px-1.5 py-0.5 rounded border border-primary-200/50 dark:border-primary-800/50">
                          {qual.symbol}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-1">
                        {qual.name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                        {qual.description}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : (
              /* Pestaña de Slash Chords & Inversiones (1 Clic) */
              <div className="space-y-4 pt-1">
                {/* Inversiones Armónicas con la Fundamental Actual */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Inversiones Armónicas sobre {selectedRoot} (1 Clic):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectChord(`${selectedRoot}/${currentInversion.third}`)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/40 text-left transition-all shadow-2xs"
                    >
                      <div className="font-mono text-sm font-black text-slate-900 dark:text-white">
                        {selectedRoot}/{currentInversion.third}
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                        1ª Inversión (3ª Mayor)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectChord(`${selectedRoot}/${currentInversion.fifth}`)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/40 text-left transition-all shadow-2xs"
                    >
                      <div className="font-mono text-sm font-black text-slate-900 dark:text-white">
                        {selectedRoot}/{currentInversion.fifth}
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                        2ª Inversión (5ª Justa)
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectChord(`${selectedRoot}/${currentInversion.seventh}`)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/40 text-left transition-all shadow-2xs"
                    >
                      <div className="font-mono text-sm font-black text-slate-900 dark:text-white">
                        {selectedRoot}/{currentInversion.seventh}
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                        Bajo en 7ª Dominante
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSelectChord(`${selectedRoot}m/${currentInversion.minorThird}`)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-400 hover:bg-amber-50/40 dark:hover:bg-amber-950/40 text-left transition-all shadow-2xs"
                    >
                      <div className="font-mono text-sm font-black text-slate-900 dark:text-white">
                        {selectedRoot}m/{currentInversion.minorThird}
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                        Menor con bajo en 3ª
                      </span>
                    </button>
                  </div>
                </div>

                {/* Slash Chords Populares Globales */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Poliacordes y Slash Chords Populares (1 Clic):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COMMON_SLASH_CHORDS.map((item) => (
                      <button
                        key={item.chord}
                        type="button"
                        onClick={() => handleSelectChord(item.chord)}
                        className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-400 hover:bg-primary-50/40 dark:hover:bg-primary-950/40 transition-all text-left shadow-2xs group"
                      >
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-white group-hover:text-primary-600">
                          {item.chord}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {item.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Constructor Rápido de Bajo Alternado (/Bajo) */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Bajo Alternado Libre: {selectedRoot}/{selectedCustomBass || 'Bajo'}
                    </span>
                    {selectedCustomBass && (
                      <button
                        type="button"
                        onClick={() => setSelectedCustomBass('')}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Quitar bajo
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-18 gap-1">
                    {BASS_NOTES.filter(Boolean).map((bass) => {
                      const isSelected = selectedCustomBass === bass
                      return (
                        <button
                          key={bass}
                          type="button"
                          onClick={() => setSelectedCustomBass(bass)}
                          className={cn(
                            'py-1.5 px-1 rounded-lg text-xs font-mono font-bold border transition-all text-center',
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          )}
                        >
                          /{bass}
                        </button>
                      )
                    })}
                  </div>

                  {selectedCustomBass && (
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-[11px] font-semibold text-slate-500">
                        Asignar con /{selectedCustomBass}:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectChord(`${selectedRoot}/${selectedCustomBass}`)}
                        className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-600 text-white hover:bg-amber-500 shadow-2xs"
                      >
                        {selectedRoot}/{selectedCustomBass}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectChord(`${selectedRoot}m/${selectedCustomBass}`)}
                        className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 shadow-2xs"
                      >
                        {selectedRoot}m/{selectedCustomBass}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectChord(`${selectedRoot}7/${selectedCustomBass}`)}
                        className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 shadow-2xs"
                      >
                        {selectedRoot}7/{selectedCustomBass}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Barra Inferior de Utilidades Rápidas */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Silencio / Corte */}
            <button
              type="button"
              onClick={() => handleSelectChord('%')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 transition-colors"
              title="Marcar silencio o corte rítmico (%)"
            >
              <VolumeX className="w-3.5 h-3.5" /> Silencio (%)
            </button>

            {/* Limpiar / Vaciar Slot */}
            <button
              type="button"
              onClick={() => handleSelectChord('')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
              title="Limpiar este slot (dejar vacío)"
            >
              <Eraser className="w-3.5 h-3.5" /> Vaciar Slot
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
