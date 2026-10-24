'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Sparkles, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CadenceDefinition } from '@/lib/harmonic-theory'
import { saveCustomCadence } from '@/lib/custom-harmonics'
import { cn } from '@/lib/utils'

interface CreateCadenceModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: (cadence: CadenceDefinition) => void
}

const BADGE_COLOR_PALETTES = [
  {
    id: 'emerald',
    name: 'Esmeralda (Auténtica / PAC)',
    classes: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    swatch: 'bg-emerald-500',
  },
  {
    id: 'cyan',
    name: 'Cian (Plagal / Dulce)',
    classes: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
    swatch: 'bg-cyan-500',
  },
  {
    id: 'amber',
    name: 'Ámbar (Rota / Deceptiva)',
    classes: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    swatch: 'bg-amber-500',
  },
  {
    id: 'indigo',
    name: 'Índigo (Semicadencia / Abierta)',
    classes: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    swatch: 'bg-indigo-500',
  },
  {
    id: 'rose',
    name: 'Rosa / Carmesí (Frigia / Modal)',
    classes: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    swatch: 'bg-rose-500',
  },
  {
    id: 'fuchsia',
    name: 'Fucsia (Picardía / Luminosa)',
    classes: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/80 dark:text-fuchsia-300 border-fuchsia-300 dark:border-fuchsia-800',
    swatch: 'bg-fuchsia-500',
  },
  {
    id: 'violet',
    name: 'Violeta (Backdoor / Jazz)',
    classes: 'bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300 border-violet-300 dark:border-violet-800',
    swatch: 'bg-violet-500',
  },
]

export function CreateCadenceModal({
  isOpen,
  onClose,
  onCreated,
}: CreateCadenceModalProps) {
  const [name, setName] = useState('')
  const [degrees, setDegrees] = useState('')
  const [cadenceType, setCadenceType] = useState('personalizada')
  const [selectedColor, setSelectedColor] = useState(BADGE_COLOR_PALETTES[0])
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen || !mounted || typeof document === 'undefined') return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Por favor escribe un nombre para la cadencia.')
      return
    }
    if (!degrees.trim()) {
      setError('Indica los grados armónicos de resolución (ej. V -> I o ♭VII -> I).')
      return
    }

    setError(null)
    const newCad = saveCustomCadence({
      name: name.trim(),
      degrees: degrees.trim(),
      type: cadenceType,
      colorBadge: selectedColor.classes,
      description: description.trim() || `Resolución armónica ${degrees.trim()}`,
    })

    if (onCreated) {
      onCreated(newCad)
    }

    // Reset y cerrar
    setName('')
    setDegrees('')
    setDescription('')
    onClose()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) e.stopPropagation()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Nueva Cadencia Personalizada"
    >
      <div 
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div
          className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Nueva Cadencia Personalizada
              </h2>
              <p className="text-xs text-slate-500">
                Registra un reposo o articulación armónica con insignia visual para compases.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre de la Cadencia */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Nombre de la Cadencia *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Cadencia Backdoor Soul, Cadencia Napolitana..."
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Grados Armónicos / Enlace */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Grados Armónicos (Resolución) *
            </label>
            <input
              type="text"
              value={degrees}
              onChange={(e) => setDegrees(e.target.value)}
              placeholder="Ej: ♭VII7 → Imaj7  o  iv → V  o  ♭II → I"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-sm font-extrabold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Tipo de Articulación Armónica */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Familia o Carácter
            </label>
            <select
              value={cadenceType}
              onChange={(e) => setCadenceType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="autentica">Auténtica / Conclusiva</option>
              <option value="plagal">Plagal / Suave</option>
              <option value="rota">Rota / Deceptiva</option>
              <option value="semicadencia">Semicadencia / Abierta</option>
              <option value="frigia">Frigia / Modal</option>
              <option value="backdoor">Backdoor / Jazz</option>
              <option value="personalizada">Personalizada</option>
            </select>
          </div>

          {/* Selector de Color del Badge */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Color Distintivo del Badge
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BADGE_COLOR_PALETTES.map((color) => {
                const isSelected = selectedColor.id === color.id
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedColor(color)
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-xl border text-left text-xs transition-all cursor-pointer',
                      isSelected
                        ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 ring-1 ring-primary-500'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    )}
                  >
                    <span className={cn('w-3.5 h-3.5 rounded-full shrink-0', color.swatch)} />
                    <span className="truncate text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {color.name.split(' ')[0]}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Vista Previa del Badge en Compás */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Vista previa del Badge en el compás:
            </span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-block px-2.5 py-1 rounded text-xs font-black border tracking-tight shadow-sm',
                  selectedColor.classes
                )}
              >
                {name || 'Nombre de la Cadencia'} {degrees ? `(${degrees})` : ''}
              </span>
            </div>
          </div>

          {/* Descripción opcional */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Descripción o Contexto (Opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Resolución sorpresa utilizada al cierre del coro"
              className="w-full px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Botones de Acción */}
          <div
            className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="gradient"
              size="sm"
              className="gap-1.5 font-bold cursor-pointer"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <Check className="w-4 h-4" />
              <span>Guardar Cadencia</span>
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
