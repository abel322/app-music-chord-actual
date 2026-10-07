'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Plus, Check, X, Music2 } from 'lucide-react'
import {
  DEFAULT_PRESET_INSTRUMENTS,
  sanitizeInstrumentName,
  isInstrumentDuplicate,
} from '@/lib/validations/song'

export interface SectionInstrumentPickerProps {
  /**
   * Instrumentos actualmente seleccionados para esta sección en particular.
   */
  selectedInstruments: string[]
  /**
   * Lista global de instrumentos disponibles en la canción (predeterminados + personalizados).
   */
  availableInstruments?: string[]
  /**
   * Callback invocado cuando cambian los instrumentos de esta sección.
   */
  onChange: (instruments: string[]) => void
  /**
   * Callback opcional para propagar la adición de un nuevo instrumento al pool global.
   */
  onAddCustomInstrument?: (newInstrument: string) => void
  /**
   * Modo solo lectura (ej. vista previa estática de la canción).
   */
  readOnly?: boolean
  /**
   * Clases CSS opcionales para el contenedor raíz.
   */
  className?: string
  /**
   * Título u orientación opcional sobre el picker.
   */
  label?: string
}

export function SectionInstrumentPicker({
  selectedInstruments = [],
  availableInstruments,
  onChange,
  onAddCustomInstrument,
  readOnly = false,
  className = '',
  label = 'Instrumentos en esta sección',
}: SectionInstrumentPickerProps) {
  // Estado local del pool en caso de no recibir availableInstruments desde el padre
  const [localAvailable, setLocalAvailable] = useState<string[]>([
    ...DEFAULT_PRESET_INSTRUMENTS,
  ])

  // Pool activo a renderizar (prioriza el suministrado por props para compartirlo entre secciones)
  const pool = availableInstruments && availableInstruments.length > 0
    ? availableInstruments
    : localAvailable

  // Asegurar que si una sección trae instrumentos guardados que no están en el pool, se muestren
  const allDisplayInstruments = Array.from(
    new Set([
      ...pool,
      ...selectedInstruments,
    ])
  )

  // Estado para el input inline de nuevo instrumento
  const [isAdding, setIsAdding] = useState(false)
  const [newInstrumentName, setNewInstrumentName] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-foco cuando se activa el formulario inline
  useEffect(() => {
    if (isAdding) {
      inputRef.current?.focus()
      setErrorMessage(null)
    }
  }, [isAdding])

  /**
   * Alterna (toggle) la selección de un instrumento para esta sección.
   */
  const handleToggle = (instrument: string) => {
    if (readOnly) return

    const normalized = instrument.trim()
    const isSelected = selectedInstruments.some(
      (item) => item.toLowerCase() === normalized.toLowerCase()
    )

    if (isSelected) {
      // Desmarcar
      const updated = selectedInstruments.filter(
        (item) => item.toLowerCase() !== normalized.toLowerCase()
      )
      onChange(updated)
    } else {
      // Marcar
      onChange([...selectedInstruments, normalized])
    }
  }

  /**
   * Confirma la creación del nuevo instrumento al vuelo.
   */
  const handleConfirmNewInstrument = () => {
    const sanitized = sanitizeInstrumentName(newInstrumentName)

    if (!sanitized) {
      setErrorMessage('Ingresa un nombre')
      return
    }

    // Buscar si ya existe en el pool (case-insensitive)
    const existingMatch = allDisplayInstruments.find(
      (item) => item.toLowerCase() === sanitized.toLowerCase()
    )

    const finalName = existingMatch || sanitized

    // 1. Agregar al pool global o local si es nuevo
    if (!existingMatch) {
      if (onAddCustomInstrument) {
        onAddCustomInstrument(finalName)
      } else {
        setLocalAvailable((prev) => [...prev, finalName])
      }
    }

    // 2. Seleccionarlo automáticamente para esta sección si no estaba ya seleccionado
    const alreadySelected = selectedInstruments.some(
      (item) => item.toLowerCase() === finalName.toLowerCase()
    )
    if (!alreadySelected) {
      onChange([...selectedInstruments, finalName])
    }

    // 3. Limpiar estado
    setNewInstrumentName('')
    setErrorMessage(null)
    setIsAdding(false)
  }

  /**
   * Cancela la creación inline.
   */
  const handleCancelNew = () => {
    setNewInstrumentName('')
    setErrorMessage(null)
    setIsAdding(false)
  }

  /**
   * Manejo de teclado en el input inline.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleConfirmNewInstrument()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleCancelNew()
    }
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Cabecera / Label con indicador */}
      <div className="flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-400">
        <span className="flex items-center gap-1.5">
          <Music2 className="w-3.5 h-3.5 text-primary-500" />
          <span>{label}</span>
          {selectedInstruments.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 font-bold text-[10px]">
              {selectedInstruments.length}
            </span>
          )}
        </span>
        {readOnly && selectedInstruments.length === 0 && (
          <span className="italic text-gray-400 text-[11px]">Sin instrumentos definidos</span>
        )}
      </div>

      {/* Contenedor de chips / etiquetas */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        {allDisplayInstruments.map((instrument) => {
          const isActive = selectedInstruments.some(
            (item) => item.toLowerCase() === instrument.toLowerCase()
          )

          // Si estamos en modo de solo lectura, omitir los inactivos
          if (readOnly && !isActive) return null

          return (
            <button
              key={instrument}
              type="button"
              disabled={readOnly}
              onClick={() => handleToggle(instrument)}
              className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150 select-none ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm ring-1 ring-primary-500/50 hover:bg-primary-700 active:scale-95'
                  : 'bg-gray-50/90 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-primary-50/40 dark:hover:bg-primary-950/30 hover:text-primary-700 dark:hover:text-primary-300 active:scale-95'
              } ${readOnly ? 'cursor-default pointer-events-none' : 'cursor-pointer'}`}
              title={
                readOnly
                  ? instrument
                  : isActive
                  ? `Quitar ${instrument} de esta sección`
                  : `Asignar ${instrument} a esta sección`
              }
              aria-pressed={isActive}
            >
              {/* Icono de estado sutil */}
              {isActive && (
                <Check className="w-3 h-3 text-primary-100 stroke-[2.5]" />
              )}

              <span>{instrument}</span>

              {/* Botón visual de desmarcar en chip activo al pasar el mouse (solo interactivo) */}
              {isActive && !readOnly && (
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`Desmarcar ${instrument}`}
                  className="opacity-60 group-hover:opacity-100 hover:text-white transition-opacity ml-0.5"
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
          )
        })}

        {/* Input Inline o Botón para Agregar Nuevo Instrumento */}
        {!readOnly && (
          <>
            {isAdding ? (
              <div className="inline-flex items-center gap-1 bg-white dark:bg-gray-800 border-2 border-primary-500 dark:border-primary-400 rounded-lg p-0.5 shadow-sm animate-fade-in">
                <input
                  ref={inputRef}
                  type="text"
                  value={newInstrumentName}
                  onChange={(e) => {
                    setNewInstrumentName(e.target.value)
                    if (errorMessage) setErrorMessage(null)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Ej. Flauta, Moog..."
                  className="px-2 py-0.5 text-xs bg-transparent text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 w-28 sm:w-32"
                  maxLength={40}
                  aria-label="Nombre del nuevo instrumento"
                />

                {/* Botón confirmar */}
                <button
                  type="button"
                  onClick={handleConfirmNewInstrument}
                  className="p-1 rounded hover:bg-primary-50 dark:hover:bg-primary-950 text-primary-600 dark:text-primary-400 transition-colors"
                  title="Confirmar instrumento (Enter)"
                  aria-label="Confirmar instrumento"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>

                {/* Botón cancelar */}
                <button
                  type="button"
                  onClick={handleCancelNew}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  title="Cancelar (Escape)"
                  aria-label="Cancelar creación"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border border-dashed border-gray-300 dark:border-gray-600 bg-transparent text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-950/20 transition-all duration-150 active:scale-95"
                title="Añadir instrumento nuevo a la lista"
              >
                <Plus className="w-3 h-3 stroke-[2.5]" />
                <span>Agregar instrumento</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Mensaje de error / validación en caso necesario */}
      {errorMessage && (
        <p className="text-[11px] text-red-600 dark:text-red-400 animate-fade-in pl-1">
          {errorMessage}
        </p>
      )}
    </div>
  )
}
