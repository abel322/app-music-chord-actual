/**
 * Tipos de TypeScript para la estructura de Compases (Measures / Bars Grid)
 * y Lead Sheet musical para MusicChord.
 */

export type BeatAccent = 'normal' | 'accent' | 'cut' | 'syncopated'

export interface ChordBeat {
  id: string
  beat: number // 1, 2, 3, 4 (número de pulso en el compás)
  chord: string // Ej: "G", "D/F#", "Am7", "Cadd9"
  accent?: BeatAccent // Normal, Acento (>), Corte/Stop (.), Síncopa (^)
  duration?: number // Duración en pulsos (ej. 2 tiempos, 4 tiempos)
}

export interface Measure {
  id: string
  measureNumber: number // 1, 2, 3, 4, ...
  timeSignature?: string // Compás específico si cambia (ej. "4/4", "3/4")
  beats: ChordBeat[] // Acordes distribuidos en sus respectivos pulsos
  repeatStart?: boolean // Apertura de repetición (|:)
  repeatEnd?: boolean // Cierre de repetición (:|)
  repeatCount?: number // Número de repeticiones (ej. 2x, 4x)
  volta?: number // Casilla de repetición (1ª o 2ª casilla)
  guideLyric?: string // Letra guía sutil debajo del compás
}

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
