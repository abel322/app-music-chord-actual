'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  HarmonicProgression,
  POPULAR_PROGRESSIONS,
  CadenceDefinition,
  PRESET_CADENCES,
} from './harmonic-theory'

const PROGRESSIONS_STORAGE_KEY = 'musicchord_custom_progressions'
const CADENCES_STORAGE_KEY = 'musicchord_custom_cadences'
const HARMONICS_CHANGE_EVENT = 'musicchord:harmonics-updated'

/**
 * Obtiene las progresiones personalizadas guardadas en el almacenamiento local
 */
export function getCustomProgressions(): HarmonicProgression[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PROGRESSIONS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Error al cargar progresiones personalizadas:', err)
    return []
  }
}

/**
 * Guarda una nueva progresión personalizada
 */
export function saveCustomProgression(
  prog: Omit<HarmonicProgression, 'id' | 'isCustom' | 'createdAt'> & { id?: string }
): HarmonicProgression {
  const current = getCustomProgressions()
  const id = prog.id || `custom-prog-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const newProg: HarmonicProgression = {
    ...prog,
    id,
    isCustom: true,
    createdAt: new Date().toISOString(),
  }

  const existingIndex = current.findIndex((p) => p.id === id)
  let updated: HarmonicProgression[]
  if (existingIndex !== -1) {
    updated = [...current]
    updated[existingIndex] = newProg
  } else {
    updated = [newProg, ...current]
  }

  try {
    localStorage.setItem(PROGRESSIONS_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent(HARMONICS_CHANGE_EVENT))
  } catch (err) {
    console.error('Error al guardar progresión:', err)
  }

  return newProg
}

/**
 * Elimina una progresión personalizada
 */
export function deleteCustomProgression(id: string): void {
  const current = getCustomProgressions()
  const filtered = current.filter((p) => p.id !== id)
  try {
    localStorage.setItem(PROGRESSIONS_STORAGE_KEY, JSON.stringify(filtered))
    window.dispatchEvent(new CustomEvent(HARMONICS_CHANGE_EVENT))
  } catch (err) {
    console.error('Error al eliminar progresión:', err)
  }
}

/**
 * Obtiene las cadencias personalizadas guardadas
 */
export function getCustomCadences(): CadenceDefinition[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CADENCES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    console.error('Error al cargar cadencias personalizadas:', err)
    return []
  }
}

/**
 * Guarda una nueva cadencia personalizada
 */
export function saveCustomCadence(
  cad: Omit<CadenceDefinition, 'id' | 'isCustom' | 'createdAt'> & { id?: string }
): CadenceDefinition {
  const current = getCustomCadences()
  const id = cad.id || `custom-cad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const newCad: CadenceDefinition = {
    ...cad,
    id,
    isCustom: true,
    createdAt: new Date().toISOString(),
  }

  const existingIndex = current.findIndex((c) => c.id === id)
  let updated: CadenceDefinition[]
  if (existingIndex !== -1) {
    updated = [...current]
    updated[existingIndex] = newCad
  } else {
    updated = [newCad, ...current]
  }

  try {
    localStorage.setItem(CADENCES_STORAGE_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent(HARMONICS_CHANGE_EVENT))
  } catch (err) {
    console.error('Error al guardar cadencia:', err)
  }

  return newCad
}

/**
 * Elimina una cadencia personalizada
 */
export function deleteCustomCadence(id: string): void {
  const current = getCustomCadences()
  const filtered = current.filter((c) => c.id !== id)
  try {
    localStorage.setItem(CADENCES_STORAGE_KEY, JSON.stringify(filtered))
    window.dispatchEvent(new CustomEvent(HARMONICS_CHANGE_EVENT))
  } catch (err) {
    console.error('Error al eliminar cadencia:', err)
  }
}

/**
 * Hook reactivo para consumir y gestionar progresiones y cadencias (Predefinidas + Personalizadas)
 */
export function useHarmonicsLibrary() {
  const [customProgressions, setCustomProgressions] = useState<HarmonicProgression[]>([])
  const [customCadences, setCustomCadences] = useState<CadenceDefinition[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  const reload = useCallback(() => {
    setCustomProgressions(getCustomProgressions())
    setCustomCadences(getCustomCadences())
    setIsLoaded(true)
  }, [])

  useEffect(() => {
    reload()

    const handleHarmonicsUpdate = () => {
      reload()
    }

    window.addEventListener(HARMONICS_CHANGE_EVENT, handleHarmonicsUpdate)
    window.addEventListener('storage', handleHarmonicsUpdate)

    return () => {
      window.removeEventListener(HARMONICS_CHANGE_EVENT, handleHarmonicsUpdate)
      window.removeEventListener('storage', handleHarmonicsUpdate)
    }
  }, [reload])

  const allProgressions: HarmonicProgression[] = [
    ...customProgressions,
    ...POPULAR_PROGRESSIONS,
  ]

  const allCadences: CadenceDefinition[] = [
    ...customCadences,
    ...PRESET_CADENCES,
  ]

  return {
    isLoaded,
    allProgressions,
    customProgressions,
    allCadences,
    customCadences,
    saveProgression: saveCustomProgression,
    deleteProgression: deleteCustomProgression,
    saveCadence: saveCustomCadence,
    deleteCadence: deleteCustomCadence,
    reload,
  }
}
