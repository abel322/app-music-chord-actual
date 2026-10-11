'use client'

import React, { useState, useEffect } from 'react'
import {
  CHORD_ROOTS,
  CHORD_QUALITIES,
  BASS_NOTES,
  COMMON_SLASH_CHORDS,
  ChordCategory,
  normalizeChordInput,
} from '@/lib/chord-catalog'
import { X, Music, Sparkles, Check, Search, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChordSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectChord: (chord: string) => void
  initialChord?: string | null
  currentKey?: string
  slotLabel?: string
  measureNumber?: number
}

export function ChordSelectorModal({
  isOpen,
  onClose,
  onSelectChord,
  initialChord = '',
  currentKey = 'C',
  slotLabel = '1',
  measureNumber = 1,
}: ChordSelectorModalProps) {
  // Parsing inicial del acorde si existe
  const [selectedRoot, setSelectedRoot] = useState<string>(() => {
    if (initialChord && initialChord !== '%') {
      const match = initialChord.match(/^[A-G][#b]?/)
      if (match) return match[0]
    }
    return currentKey || 'C'
  })

  const [selectedSuffix, setSelectedSuffix] = useState<string>(() => {
    if (initialChord && initialChord !== '%') {
      const slashSplit = initialChord.split('/')
      const match = slashSplit[0].match(/^[A-G][#b]?(.*)$/)
      if (match && match[1]) return match[1]
    }
    return ''
  })

  const [selectedBass, setSelectedBass] = useState<string>(() => {
    if (initialChord && initialChord.includes('/')) {
      return initialChord.split('/')[1] || ''
    }
    return ''
  })

  const [activeCategory, setActiveCategory] = useState<ChordCategory>('triads')
  const [freeInput, setFreeInput] = useState<string>('')

  // Sincronizar cuando se abre con initialChord
  useEffect(() => {
    if (isOpen && initialChord && initialChord !== '%') {
      const slashParts = initialChord.split('/')
      const mainChord = slashParts[0]
      const bassPart = slashParts[1] || ''

      const rootMatch = mainChord.match(/^[A-G][#b]?/)
      if (rootMatch) {
        setSelectedRoot(rootMatch[0])
        setSelectedSuffix(mainChord.slice(rootMatch[0].length))
      }
      setSelectedBass(bassPart)
    }
  }, [isOpen, initialChord])

  if (!isOpen) return null

  // Acorde compuesto en tiempo real
  const currentConstructedChord = `${selectedRoot}${selectedSuffix}${selectedBass ? `/${selectedBass}` : ''}`

  // Confirmar y aplicar acorde
  const handleApply = (chordToApply?: string) => {
    const finalChord = chordToApply || currentConstructedChord
    const normalized = normalizeChordInput(finalChord)
    if (normalized) {
      onSelectChord(normalized)
      onClose()
    }
  }

  // Aplicar desde input libre
  const handleFreeInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (freeInput.trim()) {
      handleApply(freeInput.trim())
    }
  }

  // Filtrar calidades de acordes según la categoría activa
  const filteredQualities = CHORD_QUALITIES.filter((q) => q.category === activeCategory)

  return (
    <div
      className="chord-picker-modal fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Header del Modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-900/20">
              <Music className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                Selector y Constructor de Acordes
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                  Compás #{measureNumber} • Slot {slotLabel}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Tríadas, Séptimas, Tensiones Jazz, Acordes Alterados y Slash Chords
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Barra de Entrada Libre Rápida */}
        <div className="p-4 pb-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/40 dark:bg-slate-950/20 shrink-0">
          <form onSubmit={handleFreeInputSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={freeInput}
                onChange={(e) => setFreeInput(e.target.value)}
                placeholder="Escribe libremente cualquier cifrado (ej: F#m7b5, Ebmaj9, Asus4/C#)..."
                className="w-full pl-9 pr-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              type="submit"
              disabled={!freeInput.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-600 text-white disabled:opacity-50 hover:bg-primary-500 transition-colors shadow-sm"
            >
              Aplicar
            </button>
          </form>
        </div>

        {/* 3. Contenido Principal Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Tónica Fundamental (Root Note) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                1. Nota Fundamental (Tónica):
              </span>
              <span className="text-[11px] font-mono font-black text-primary-600 dark:text-primary-400">
                Seleccionada: {selectedRoot}
              </span>
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
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-900/30'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50/50'
                    )}
                  >
                    {root.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Selector de Categorías de Cualidades */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                2. Tipo de Acorde / Extensión:
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
                      'px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border',
                      isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                    )}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Rejilla de Cualidades según la pestaña activa */}
            {activeCategory !== 'slash_inversion' ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {filteredQualities.map((qual) => {
                  const isSelected = selectedSuffix === qual.suffix
                  const chordPreview = `${selectedRoot}${qual.suffix}`
                  return (
                    <button
                      key={qual.id}
                      type="button"
                      onClick={() => setSelectedSuffix(qual.suffix)}
                      onDoubleClick={() => handleApply(chordPreview)}
                      className={cn(
                        'flex flex-col items-start p-2.5 rounded-xl border text-left transition-all',
                        isSelected
                          ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 ring-2 ring-primary-500/40 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                          {chordPreview}
                        </span>
                        <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">
                          {qual.symbol}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-0.5">
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
              /* Pestaña Especial de Slash Chords y Poliacordes */
              <div className="space-y-3 pt-1">
                {/* Selector de Bajo Alternado */}
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">
                    Nota de Bajo Alternado (/Bajo):
                  </label>
                  <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-18 gap-1">
                    {BASS_NOTES.map((bass) => {
                      const isSelected = selectedBass === bass
                      return (
                        <button
                          key={bass || 'none'}
                          type="button"
                          onClick={() => setSelectedBass(bass)}
                          className={cn(
                            'py-1.5 px-1 rounded-lg text-xs font-mono font-bold border transition-all text-center',
                            isSelected
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                          )}
                        >
                          {bass ? `/${bass}` : 'Sin /'}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Poliacordes Frecuentes de 1 Clic */}
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 block">
                    Inversiones y Poliacordes Típicos (1 Clic):
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {COMMON_SLASH_CHORDS.map((item) => (
                      <button
                        key={item.chord}
                        type="button"
                        onClick={() => handleApply(item.chord)}
                        className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-primary-400 hover:bg-primary-50/40 dark:hover:bg-primary-950/40 transition-all text-left"
                      >
                        <span className="font-mono text-xs font-black text-slate-900 dark:text-white">
                          {item.chord}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {item.type}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Barra Inferior de Acción y Vista Previa */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Resultado:</span>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-inner">
              <span className="font-mono text-lg font-black text-primary-600 dark:text-primary-400">
                {currentConstructedChord}
              </span>
              {selectedBass && (
                <span className="text-[11px] font-mono font-bold text-amber-500">
                  (Bajo: /{selectedBass})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => handleApply()}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-extrabold bg-primary-600 text-white hover:bg-primary-500 shadow-md shadow-primary-900/30 transition-all"
            >
              <Check className="w-4 h-4" /> Insertar en Slot {slotLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
