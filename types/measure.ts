/**
 * Tipos de TypeScript para la estructura de Compases (Measures / Bars Grid),
 * División Rítmica del Compás Completo (Global Bar Division) y Lead Sheet musical en MusicChord.
 */

export type BeatAccent = 'normal' | 'accent' | 'cut' | 'syncopated'

// Catálogo Completo de Subdivisiones a Nivel del Compás Completo
export type MeasureDivision =
  | 'whole'          // 1 acorde / Redonda (todo el compás)
  | 'half'           // 2 acordes (Blancas / 2 tiempos c/u)
  | 'quarter'        // 4 acordes (Negras / 4 tiempos estándar)
  | 'eighth'         // 8 subdivisiones (Corcheas: 1 & 2 & 3 & 4 &)
  | 'sixteenth'      // 16 subdivisiones (Semicorcheas: 1 e & a ...)
  | 'thirty_second'  // 32 subdivisiones (Fusas)
  | 'triplet_half'   // Tresillo de Blancas (3 en el compás / 3 contra 4)
  | 'triplet_quarter'// Tresillos de Negras (6 en el compás / Shuffle / Swing)
  | 'triplet_eighth' // Tresillos de Corcheas (12 en el compás)
  | 'quintuplet'     // Cincillo (5 partes iguales en el compás)
  | 'sextuplet'      // Seisillo (6 partes iguales en el compás)
  | 'septuplet'      // Septillo (7 partes iguales en el compás)
  | 'nonuplet'       // Novenillo (9 partes iguales en el compás)
  | 'amalgam_3_3_2'  // Amalgama 3+3+2 (Clave latina / Funk / 8/8)
  | 'amalgam_3_2'    // Amalgama 3+2 (Métrica 5/8)
  | 'amalgam_2_3'    // Amalgama 2+3 (Métrica 5/8)
  | 'amalgam_2_2_3'  // Amalgama 2+2+3 (Métrica 7/8)
  | 'amalgam_3_2_2'  // Amalgama 3+2+2 (Métrica 7/8)
  | 'blanca_2negras' // Combinación 3 slots (Blanca 2t + 2 Negras 1t c/u)
  | '2negras_blanca' // Combinación 3 slots (2 Negras 1t c/u + Blanca 2t)

/**
 * Slot rítmico dentro del compás para ubicar acordes, silencios y acentos
 */
export interface MeasureSlot {
  index: number
  label: string       // "1", "&", "e", "a", "Mitad 1", etc.
  chord: string | null
  accent?: boolean
  isRest?: boolean
}

// Tipos legados de compatibilidad
export type RegularSubdivision = '1/1' | '1/2' | '1/4' | '1/8' | '1/16'
export type IrregularSubdivision = 'triplet' | 'quintuplet' | 'sextuplet' | 'septuplet'
export type AmalgamSubdivision = '3+2' | '2+3' | '3+3+2' | '2+2+3'
export type SubdivisionType = RegularSubdivision | IrregularSubdivision | AmalgamSubdivision

export interface SubBeatSlot {
  id: string
  slotIndex: number
  label: string
  chord?: string
  accent?: BeatAccent
  tied?: boolean
}

export interface ChordBeat {
  id: string
  beat: number // 1, 2, 3, 4
  chord: string
  accent?: BeatAccent
  duration?: number
  subdivision?: SubdivisionType
  subSlots?: SubBeatSlot[]
}

/**
 * Estructura de un Compás individual (Bar / Measure)
 */
export interface Measure {
  id: string
  measureNumber: number
  timeSignature?: string // ej. "4/4", "3/4", "6/8", "5/8", "7/8"
  division?: MeasureDivision // Subdivisión a nivel del compás completo
  slots?: MeasureSlot[] // Slots calculados según la división global elegida
  subdivision?: SubdivisionType // Compatibilidad
  subdivisionGrouping?: string // Compatibilidad
  beats: ChordBeat[] // Acordes por pulso (sincronizados con los slots)
  repeatStart?: boolean // Apertura de repetición (|:)
  repeatEnd?: boolean // Cierre de repetición (:|)
  repeatCount?: number // Número de repeticiones (ej. 2x, 4x)
  volta?: number // Casilla de repetición (1ª o 2ª casilla)
  cadence?: string // Tipo o ID de cadencia
  cadenceLabel?: string // Etiqueta descriptiva (ej. 'Cadencia Auténtica (V → I)')
  cadenceColor?: string // Clases de color para el badge
  cadenceRole?: 'single' | 'start' | 'end' // Rol en el corchete agrupatorio de cadencia
  guideLyric?: string // Letra guía rítmica sutil debajo del compás
}

/**
 * Sección completa compuesta por compases ordenados
 */
export interface SectionMeasures {
  id: string
  type: string
  label: string
  name?: string
  timeSignature?: string
  keySignature?: string | null // Tonalidad específica de la sección. Si es null o undefined, hereda song.keySignature.
  instruments?: string[]
  measures: Measure[]
  guideLyrics?: string
  lyrics?: string // Texto o estrofas líricas de esta sección específica (Single Source of Truth)
  lines?: any[]
  repeatCount?: number // Cantidad de repeticiones de la sección (por defecto 1, ej. 2, 3, 4, 8)
  tempoOverride?: number | null // BPM específico para esta sección. Si es null/undefined, hereda song.tempo
}
