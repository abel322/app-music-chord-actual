/**
 * Tipos de TypeScript para la estructura de Compases (Measures / Bars Grid),
 * Subdivisiones Rítmicas (Regulares e Irregulares) y Lead Sheet musical en MusicChord.
 */

export type BeatAccent = 'normal' | 'accent' | 'cut' | 'syncopated'

// Tipos de subdivisión rítmica
export type RegularSubdivision = '1/1' | '1/2' | '1/4' | '1/8' | '1/16'
export type IrregularSubdivision = 'triplet' | 'quintuplet' | 'sextuplet' | 'septuplet'
export type AmalgamSubdivision = '3+2' | '2+3' | '3+3+2' | '2+2+3'
export type SubdivisionType = RegularSubdivision | IrregularSubdivision | AmalgamSubdivision

/**
 * Slot de micro-timing dentro de un pulso o compás
 * Permite posicionar acordes en contratiempos (&), síncopas, figuras irregulares o cortes
 */
export interface SubBeatSlot {
  id: string
  slotIndex: number // 0, 1, 2... posición relativa dentro del pulso
  label: string // ej: "1", "&", "e", "a", "t1", "t2", "t3"
  chord?: string // Acorde asignado a esta fracción de tiempo
  accent?: BeatAccent // Normal, Acento (>), Corte (.), Síncopa (^)
  tied?: boolean // Si el acorde viene ligado desde el slot previo
}

/**
 * Pulso individual de un compás
 */
export interface ChordBeat {
  id: string
  beat: number // 1, 2, 3, 4 (número de pulso en el compás)
  chord: string // Acorde principal o base en el pulso (ej: "G", "D/F#")
  accent?: BeatAccent // Normal, Acento (>), Corte/Stop (.), Síncopa (^)
  duration?: number // Duración en pulsos (ej. 1, 2, 4)
  subdivision?: SubdivisionType // '1/4' (por defecto), '1/8', '1/16', 'triplet', etc.
  subSlots?: SubBeatSlot[] // Micro-slots dentro del pulso para síncopas / contratiempos
}

/**
 * Estructura de un Compás individual (Bar / Measure)
 */
export interface Measure {
  id: string
  measureNumber: number // 1, 2, 3, 4, ...
  timeSignature?: string // Compás específico si cambia (ej. "4/4", "3/4", "6/8", "5/8")
  subdivision?: SubdivisionType // Subdivisión rítmica global del compás si aplica
  subdivisionGrouping?: string // ej: "3+2", "2+3", "3+3+2" para amalgamas
  beats: ChordBeat[] // Acordes distribuidos en sus respectivos pulsos y micro-slots
  repeatStart?: boolean // Apertura de repetición (|:)
  repeatEnd?: boolean // Cierre de repetición (:|)
  repeatCount?: number // Número de repeticiones (ej. 2x, 4x)
  volta?: number // Casilla de repetición (1ª o 2ª casilla)
  cadence?: string // Tipo o ID de cadencia (ej. 'autentica-pac', 'plagal', 'rota', 'semicadencia')
  cadenceLabel?: string // Etiqueta descriptiva (ej. 'Cadencia Auténtica (V → I)')
  cadenceColor?: string // Clases de color para el badge
  guideLyric?: string // Letra guía rítmica sutil debajo del compás
}

/**
 * Sección completa compuesta por compases ordenados
 */
export interface SectionMeasures {
  id: string
  type: string // 'intro' | 'verse' | 'prechorus' | 'chorus' | 'bridge' | 'instrumental' | 'solo' | 'outro'
  label: string // "Intro", "Estrofa 1", "Coro"
  timeSignature?: string // Compás base de la sección (ej. "4/4")
  instruments?: string[] // Instrumentos asignados
  measures: Measure[] // Lista ordenada de compases
  guideLyrics?: string // Texto completo lírico de referencia
  lines?: any[] // Compatibilidad con el formato anterior
}
