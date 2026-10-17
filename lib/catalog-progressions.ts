import { ProgressionDef, chordProgressions } from './data/chordProgressions'

export const CATALOG_STORAGE_KEY = 'musicchord_custom_progressions'
export const DELETED_STORAGE_KEY = 'musicchord_deleted_progressions'

/**
 * Obtiene las progresiones personalizadas y editadas guardadas en localStorage
 */
export function getStoredCustomProgressions(): ProgressionDef[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Filtrar elementos con estructura ProgressionDef (chords array con nombre/notas)
    return parsed.filter(
      (p: any) => p && typeof p === 'object' && Array.isArray(p.chords)
    )
  } catch (err) {
    console.error('Error al leer progresiones personalizadas del catálogo:', err)
    return []
  }
}

/**
 * Obtiene los IDs de progresiones eliminadas
 */
export function getDeletedProgressionIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(DELETED_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch (err) {
    return []
  }
}

/**
 * Combina las progresiones predefinidas con las personalizadas y eliminadas
 */
export function getAllMergedProgressions(): ProgressionDef[] {
  const custom = getStoredCustomProgressions()
  const deletedIds = new Set(getDeletedProgressionIds())

  // Mapear presets reemplazando los que hayan sido editados
  const customMap = new Map<string, ProgressionDef>()
  const purelyCustom: ProgressionDef[] = []

  custom.forEach((item) => {
    const isPreset = chordProgressions.some((cp) => cp.id === item.id)
    if (isPreset) {
      customMap.set(item.id, item)
    } else {
      purelyCustom.push(item)
    }
  })

  const mergedPresets = chordProgressions
    .filter((cp) => !deletedIds.has(cp.id))
    .map((cp) => customMap.get(cp.id) || cp)

  const activePurelyCustom = purelyCustom.filter((cp) => !deletedIds.has(cp.id))

  // Las progresiones personalizadas nuevas se colocan primero para mayor visibilidad
  return [...activePurelyCustom, ...mergedPresets]
}

/**
 * Guarda o actualiza una progresión en localStorage
 */
export function saveCatalogProgression(prog: ProgressionDef): void {
  if (typeof window === 'undefined') return

  const custom = getStoredCustomProgressions()
  const existingIndex = custom.findIndex((p) => p.id === prog.id)

  let updated: ProgressionDef[]
  if (existingIndex !== -1) {
    updated = [...custom]
    updated[existingIndex] = prog
  } else {
    updated = [prog, ...custom]
  }

  // Si estaba en la lista de eliminados, lo removemos
  const deletedIds = getDeletedProgressionIds().filter((id) => id !== prog.id)

  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(updated))
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deletedIds))
  } catch (err) {
    console.error('Error al guardar progresión en localStorage:', err)
  }
}

/**
 * Elimina una progresión (personalizada o predefinida)
 */
export function deleteCatalogProgression(id: string): void {
  if (typeof window === 'undefined') return

  const custom = getStoredCustomProgressions()
  const filtered = custom.filter((p) => p.id !== id)

  const deletedIds = Array.from(new Set([...getDeletedProgressionIds(), id]))

  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(filtered))
    localStorage.setItem(DELETED_STORAGE_KEY, JSON.stringify(deletedIds))
  } catch (err) {
    console.error('Error al eliminar progresión en localStorage:', err)
  }
}
