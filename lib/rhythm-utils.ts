/**
 * Utilidades de Teoría y Notación Rítmica para MusicChord
 * Gestión integral de Subdivisiones del Compás Completo (Global Bar Division),
 * Figuras Regulares, Irregulares / Polirritmias y Amalgamas Asimétricas.
 */

import { MeasureDivision, MeasureSlot, ChordBeat, Measure, BeatAccent } from '@/types/measure'

export interface MeasureDivisionOption {
  id: MeasureDivision
  name: string
  category: 'regular' | 'irregular' | 'amalgam'
  slotsCount: number
  bracketLabel?: string
  description: string
}

export const MEASURE_DIVISIONS: MeasureDivisionOption[] = [
  // --- 1. REGULARES / BINARIAS / ESTÁNDAR ---
  {
    id: 'whole',
    name: 'Redonda (1 Acorde / Todo el compás)',
    category: 'regular',
    slotsCount: 1,
    description: '1 solo slot que abarca los 4 tiempos (/ / / /)',
  },
  {
    id: 'half',
    name: 'Blancas (2 Mitades / 2 tiempos c/u)',
    category: 'regular',
    slotsCount: 2,
    description: '2 slots distribuidos equitativamente (tiempos 1 y 3)',
  },
  {
    id: 'quarter',
    name: 'Negras (4 Tiempos estándar)',
    category: 'regular',
    slotsCount: 4,
    description: '4 slots individuales (tiempos 1, 2, 3, 4)',
  },
  {
    id: 'eighth',
    name: 'Corcheas (8 Subdivisiones: 1 & 2 & 3 & 4 &)',
    category: 'regular',
    slotsCount: 8,
    description: '8 subdivisiones para marcar tiempos a tierra y contratiempos (&)',
  },
  {
    id: 'sixteenth',
    name: 'Semicorcheas (16 Subdivisiones: 1 e & a...)',
    category: 'regular',
    slotsCount: 16,
    description: '16 subdivisiones para cortes de funk, pop rítmico y síncopas avanzadas',
  },
  {
    id: 'thirty_second',
    name: 'Fusas (32 Subdivisiones)',
    category: 'regular',
    slotsCount: 32,
    description: '32 micro-fracciones para cortes y redobles técnicos específicos',
  },

  // --- 2. IRREGULARES / POLIRRITMIAS EN EL COMPÁS ---
  {
    id: 'triplet_half',
    name: 'Tresillo de Blancas [ 3 ] (3 en el compás)',
    category: 'irregular',
    slotsCount: 3,
    bracketLabel: '[ 3 ]',
    description: '3 pulsos/acordes distribuidos uniformemente en el compás (3 contra 4)',
  },
  {
    id: 'triplet_quarter',
    name: 'Seisillo / Tresillos de Negras [ 6 ] (6 en el compás)',
    category: 'irregular',
    slotsCount: 6,
    bracketLabel: '[ 6 ]',
    description: '6 divisiones en el compás (ritmo ternario / swing / shuffle)',
  },
  {
    id: 'triplet_eighth',
    name: 'Tresillos de Corcheas [ 12 ] (12 en el compás)',
    category: 'irregular',
    slotsCount: 12,
    bracketLabel: '[ 12 ]',
    description: '12 subdivisiones ternarias para baladas 12/8 o shuffle lento',
  },
  {
    id: 'quintuplet',
    name: 'Cincillo [ 5 ] (5 partes iguales)',
    category: 'irregular',
    slotsCount: 5,
    bracketLabel: '[ 5 ]',
    description: '5 partes iguales en el compás (polirritmia 5 contra 4)',
  },
  {
    id: 'sextuplet',
    name: 'Seisillo [ 6 ] (6 partes iguales)',
    category: 'irregular',
    slotsCount: 6,
    bracketLabel: '[ 6 ]',
    description: '6 partes iguales en el compás',
  },
  {
    id: 'septuplet',
    name: 'Septillo [ 7 ] (7 partes iguales)',
    category: 'irregular',
    slotsCount: 7,
    bracketLabel: '[ 7 ]',
    description: '7 divisiones uniformes en el compás',
  },
  {
    id: 'nonuplet',
    name: 'Novenillo [ 9 ] (9 partes iguales)',
    category: 'irregular',
    slotsCount: 9,
    bracketLabel: '[ 9 ]',
    description: '9 divisiones uniformes en el compás',
  },

  // --- 3. COMPASES COMPUESTOS Y AMALGAMAS RÍTMICAS ---
  {
    id: 'amalgam_3_3_2',
    name: 'Agrupación 3 + 3 + 2 [ 3+3+2 ] (Clave / Funk / 8/8)',
    category: 'amalgam',
    slotsCount: 3,
    bracketLabel: '[ 3+3+2 ]',
    description: 'Clave rítmica clásica sincopada (3 corcheas + 3 corcheas + 2 corcheas)',
  },
  {
    id: 'amalgam_3_2',
    name: 'Agrupación 3 + 2 [ 3+2 ] (Métrica 5/8)',
    category: 'amalgam',
    slotsCount: 2,
    bracketLabel: '[ 3+2 ]',
    description: 'Amalgama asimétrica de 3 corcheas seguidas de 2 corcheas',
  },
  {
    id: 'amalgam_2_3',
    name: 'Agrupación 2 + 3 [ 2+3 ] (Métrica 5/8)',
    category: 'amalgam',
    slotsCount: 2,
    bracketLabel: '[ 2+3 ]',
    description: 'Amalgama asimétrica de 2 corcheas seguidas de 3 corcheas',
  },
  {
    id: 'amalgam_2_2_3',
    name: 'Agrupación 2 + 2 + 3 [ 2+2+3 ] (Métrica 7/8)',
    category: 'amalgam',
    slotsCount: 3,
    bracketLabel: '[ 2+2+3 ]',
    description: 'Métrica irregular de 7 corcheas (2 + 2 + 3)',
  },
  {
    id: 'amalgam_3_2_2',
    name: 'Agrupación 3 + 2 + 2 [ 3+2+2 ] (Métrica 7/8)',
    category: 'amalgam',
    slotsCount: 3,
    bracketLabel: '[ 3+2+2 ]',
    description: 'Métrica irregular de 7 corcheas (3 + 2 + 2)',
  },
]

/**
 * Devuelve el bracket de la figura irregular o amalgama
 */
export function getDivisionBracket(division?: MeasureDivision): string | null {
  if (!division) return null
  const found = MEASURE_DIVISIONS.find((d) => d.id === division)
  return found?.bracketLabel || null
}

/**
 * Genera la lista de slots correspondientes a una división global del compás
 */
export function generateSlotsForDivision(
  division: MeasureDivision,
  existingChords: (string | null)[] = []
): MeasureSlot[] {
  switch (division) {
    case 'whole':
      return [
        {
          index: 0,
          label: 'Todo el Compás',
          chord: existingChords[0] || null,
        },
      ]

    case 'half':
      return [
        { index: 0, label: 'Mitad 1 (T. 1)', chord: existingChords[0] || null },
        { index: 1, label: 'Mitad 2 (T. 3)', chord: existingChords[1] || null },
      ]

    case 'quarter':
      return [
        { index: 0, label: '1', chord: existingChords[0] || null },
        { index: 1, label: '2', chord: existingChords[1] || null },
        { index: 2, label: '3', chord: existingChords[2] || null },
        { index: 3, label: '4', chord: existingChords[3] || null },
      ]

    case 'eighth': {
      const labels = ['1', '&', '2', '&', '3', '&', '4', '&']
      return labels.map((label, idx) => ({
        index: idx,
        label,
        chord: existingChords[idx] || null,
      }))
    }

    case 'sixteenth': {
      const beats = ['1', '2', '3', '4']
      const subs = ['t', 'e', '&', 'a']
      const slots: MeasureSlot[] = []
      let counter = 0
      beats.forEach((b) => {
        subs.forEach((s) => {
          slots.push({
            index: counter,
            label: s === 't' ? b : s,
            chord: existingChords[counter] || null,
          })
          counter++
        })
      })
      return slots
    }

    case 'thirty_second':
      return Array.from({ length: 32 }, (_, i) => ({
        index: i,
        label: `${i + 1}`,
        chord: existingChords[i] || null,
      }))

    case 'triplet_half':
      return [
        { index: 0, label: '1 (3:4)', chord: existingChords[0] || null },
        { index: 1, label: '2 (3:4)', chord: existingChords[1] || null },
        { index: 2, label: '3 (3:4)', chord: existingChords[2] || null },
      ]

    case 'triplet_quarter':
      return Array.from({ length: 6 }, (_, i) => ({
        index: i,
        label: `t${i + 1}`,
        chord: existingChords[i] || null,
      }))

    case 'triplet_eighth':
      return Array.from({ length: 12 }, (_, i) => ({
        index: i,
        label: `${i + 1}`,
        chord: existingChords[i] || null,
      }))

    case 'quintuplet':
      return Array.from({ length: 5 }, (_, i) => ({
        index: i,
        label: `${i + 1}`,
        chord: existingChords[i] || null,
      }))

    case 'sextuplet':
      return Array.from({ length: 6 }, (_, i) => ({
        index: i,
        label: `${i + 1}`,
        chord: existingChords[i] || null,
      }))

    case 'septuplet':
      return Array.from({ length: 7 }, (_, i) => ({
        index: i,
        label: `${i + 1}`,
        chord: existingChords[i] || null,
      }))

    case 'nonuplet':
      return Array.from({ length: 9 }, (_, i) => ({
        index: i,
        label: `${i + 1}`,
        chord: existingChords[i] || null,
      }))

    case 'amalgam_3_3_2':
      return [
        { index: 0, label: 'Grupo 3', chord: existingChords[0] || null },
        { index: 1, label: 'Grupo 3', chord: existingChords[1] || null },
        { index: 2, label: 'Grupo 2', chord: existingChords[2] || null },
      ]

    case 'amalgam_3_2':
      return [
        { index: 0, label: 'Grupo 3 (T. 1-3)', chord: existingChords[0] || null },
        { index: 1, label: 'Grupo 2 (T. 4-5)', chord: existingChords[1] || null },
      ]

    case 'amalgam_2_3':
      return [
        { index: 0, label: 'Grupo 2 (T. 1-2)', chord: existingChords[0] || null },
        { index: 1, label: 'Grupo 3 (T. 3-5)', chord: existingChords[1] || null },
      ]

    case 'amalgam_2_2_3':
      return [
        { index: 0, label: 'Grupo 2', chord: existingChords[0] || null },
        { index: 1, label: 'Grupo 2', chord: existingChords[1] || null },
        { index: 2, label: 'Grupo 3', chord: existingChords[2] || null },
      ]

    case 'amalgam_3_2_2':
      return [
        { index: 0, label: 'Grupo 3', chord: existingChords[0] || null },
        { index: 1, label: 'Grupo 2', chord: existingChords[1] || null },
        { index: 2, label: 'Grupo 2', chord: existingChords[2] || null },
      ]

    default:
      return [
        { index: 0, label: '1', chord: existingChords[0] || null },
        { index: 1, label: '2', chord: existingChords[1] || null },
        { index: 2, label: '3', chord: existingChords[2] || null },
        { index: 3, label: '4', chord: existingChords[3] || null },
      ]
  }
}

/**
 * Sincroniza y deriva los pulsos (ChordBeat[]) a partir de los slots configurados
 */
export function syncBeatsFromSlots(
  slots: MeasureSlot[],
  division: MeasureDivision,
  timeSignature: string = '4/4'
): ChordBeat[] {
  const beatsCount = parseInt(timeSignature.split('/')[0], 10) || 4

  if (division === 'whole') {
    const chord = slots[0]?.chord || ''
    return [
      {
        id: `beat-whole-${Date.now()}`,
        beat: 1,
        chord,
        accent: slots[0]?.accent ? 'accent' : 'normal',
        duration: beatsCount,
      },
    ]
  }

  if (division === 'half') {
    const chord1 = slots[0]?.chord || ''
    const chord2 = slots[1]?.chord || ''
    const midBeat = Math.ceil(beatsCount / 2) + 1
    const result: ChordBeat[] = []
    if (chord1) {
      result.push({
        id: `beat-half-1-${Date.now()}`,
        beat: 1,
        chord: chord1,
        accent: slots[0]?.accent ? 'accent' : 'normal',
        duration: Math.floor(beatsCount / 2),
      })
    }
    if (chord2) {
      result.push({
        id: `beat-half-2-${Date.now()}`,
        beat: midBeat,
        chord: chord2,
        accent: slots[1]?.accent ? 'accent' : 'normal',
        duration: Math.floor(beatsCount / 2),
      })
    }
    return result
  }

  // Para quarter y otras divisiones, mapear los slots con acorde
  const beats: ChordBeat[] = []
  slots.forEach((s) => {
    if (s.chord) {
      const beatNum = Math.min(beatsCount, Math.floor((s.index / slots.length) * beatsCount) + 1)
      beats.push({
        id: `beat-slot-${s.index}-${Date.now()}`,
        beat: beatNum,
        chord: s.chord,
        accent: s.accent ? 'accent' : 'normal',
      })
    }
  })

  return beats
}

/**
 * Asegura que un compás tenga sus slots rítmicos correctamente inicializados
 */
export function ensureMeasureSlots(measure: Measure, timeSignature: string = '4/4'): MeasureSlot[] {
  if (Array.isArray(measure.slots) && measure.slots.length > 0) {
    return measure.slots
  }

  // Deducir división inicial según los acordes existentes
  const beats = measure.beats || []
  if (beats.length <= 1) {
    const chord = beats[0]?.chord || null
    return generateSlotsForDivision('whole', [chord])
  }

  if (beats.length === 2) {
    const chords = [beats[0]?.chord || null, beats[1]?.chord || null]
    return generateSlotsForDivision('half', chords)
  }

  const chords = beats.map((b) => b.chord || null)
  return generateSlotsForDivision('quarter', chords)
}

/**
 * Deducir la división de un compás si no está explícita
 */
export function inferMeasureDivision(measure: Measure): MeasureDivision {
  if (measure.division) return measure.division
  const beats = measure.beats || []
  if (beats.length <= 1) return 'whole'
  if (beats.length === 2) return 'half'
  return 'quarter'
}
