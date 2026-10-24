/**
 * Utilidades de Teoría y Notación Rítmica para MusicChord
 * Gestión integral de Subdivisiones del Compás Completo (Global Bar Division),
 * Figuras Regulares, Irregulares / Polirritmias y Amalgamas Asimétricas.
 */

import { MeasureDivision, MeasureSlot, ChordBeat, Measure, BeatAccent, SectionMeasures } from '@/types/measure'
import { getBeatsPerMeasure } from '@/lib/measure-utils'

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
    name: 'Redonda',
    category: 'regular',
    slotsCount: 1,
    description: '1 solo slot que abarca los 4 tiempos (/ / / /)',
  },
  {
    id: 'half',
    name: 'Blancas',
    category: 'regular',
    slotsCount: 2,
    description: '2 slots distribuidos equitativamente (tiempos 1 y 3)',
  },
  {
    id: 'quarter',
    name: 'Negras',
    category: 'regular',
    slotsCount: 4,
    description: '4 slots individuales (tiempos 1, 2, 3, 4)',
  },
  {
    id: 'eighth',
    name: 'Corcheas',
    category: 'regular',
    slotsCount: 8,
    description: '8 subdivisiones para marcar tiempos a tierra y contratiempos (&)',
  },
  {
    id: 'blanca_2negras',
    name: 'Blanca + 2N',
    category: 'regular',
    slotsCount: 3,
    description: '3 slots: Blanca en tiempos 1-2 y dos negras en tiempos 3 y 4',
  },
  {
    id: '2negras_blanca',
    name: '2N + Blanca',
    category: 'regular',
    slotsCount: 3,
    description: '3 slots: Dos negras en tiempos 1 y 2, y Blanca en tiempos 3-4',
  },
  {
    id: 'sixteenth',
    name: 'Semicorcheas',
    category: 'regular',
    slotsCount: 16,
    description: '16 subdivisiones para cortes de funk, pop rítmico y síncopas avanzadas',
  },
  {
    id: 'thirty_second',
    name: 'Fusas',
    category: 'regular',
    slotsCount: 32,
    description: '32 micro-fracciones para cortes y redobles técnicos específicos',
  },

  // --- 2. IRREGULARES / POLIRRITMIAS EN EL COMPÁS ---
  {
    id: 'triplet_half',
    name: 'Tresillo de Blancas',
    category: 'irregular',
    slotsCount: 3,
    bracketLabel: '[ 3 ]',
    description: '3 pulsos/acordes distribuidos uniformemente en el compás (3 contra 4)',
  },
  {
    id: 'triplet_quarter',
    name: 'Tresillo de Negras',
    category: 'irregular',
    slotsCount: 6,
    bracketLabel: '[ 6 ]',
    description: '6 divisiones en el compás (ritmo ternario / swing / shuffle)',
  },
  {
    id: 'triplet_eighth',
    name: 'Tresillo de Corcheas',
    category: 'irregular',
    slotsCount: 12,
    bracketLabel: '[ 12 ]',
    description: '12 subdivisiones ternarias para baladas 12/8 o shuffle lento',
  },
  {
    id: 'quintuplet',
    name: 'Cincillo',
    category: 'irregular',
    slotsCount: 5,
    bracketLabel: '[ 5 ]',
    description: '5 partes iguales en el compás (polirritmia 5 contra 4)',
  },
  {
    id: 'sextuplet',
    name: 'Seisillo',
    category: 'irregular',
    slotsCount: 6,
    bracketLabel: '[ 6 ]',
    description: '6 partes iguales en el compás',
  },
  {
    id: 'septuplet',
    name: 'Septillo',
    category: 'irregular',
    slotsCount: 7,
    bracketLabel: '[ 7 ]',
    description: '7 divisiones uniformes en el compás',
  },
  {
    id: 'nonuplet',
    name: 'Novenillo',
    category: 'irregular',
    slotsCount: 9,
    bracketLabel: '[ 9 ]',
    description: '9 divisiones uniformes en el compás',
  },

  // --- 3. COMPASES COMPUESTOS Y AMALGAMAS RÍTMICAS ---
  {
    id: 'amalgam_3_3_2',
    name: 'Agrupación 3+3+2',
    category: 'amalgam',
    slotsCount: 3,
    bracketLabel: '[ 3+3+2 ]',
    description: 'Clave rítmica clásica sincopada (3 corcheas + 3 corcheas + 2 corcheas)',
  },
  {
    id: 'amalgam_3_2',
    name: 'Agrupación 3+2',
    category: 'amalgam',
    slotsCount: 2,
    bracketLabel: '[ 3+2 ]',
    description: 'Amalgama asimétrica de 3 corcheas seguidas de 2 corcheas',
  },
  {
    id: 'amalgam_2_3',
    name: 'Agrupación 2+3',
    category: 'amalgam',
    slotsCount: 2,
    bracketLabel: '[ 2+3 ]',
    description: 'Amalgama asimétrica de 2 corcheas seguidas de 3 corcheas',
  },
  {
    id: 'amalgam_2_2_3',
    name: 'Agrupación 2+2+3',
    category: 'amalgam',
    slotsCount: 3,
    bracketLabel: '[ 2+2+3 ]',
    description: 'Métrica irregular de 7 corcheas (2 + 2 + 3)',
  },
  {
    id: 'amalgam_3_2_2',
    name: 'Agrupación 3+2+2',
    category: 'amalgam',
    slotsCount: 3,
    bracketLabel: '[ 3+2+2 ]',
    description: 'Métrica irregular de 7 corcheas (3 + 2 + 2)',
  },
]

/**
 * Devuelve las opciones de subdivisión relevantes y adaptadas a la cifra de compás activa
 */
export function getDivisionOptionsForTimeSignature(timeSignature: string = '4/4'): MeasureDivisionOption[] {
  if (timeSignature === '3/4') {
    return [
      {
        id: 'whole',
        name: 'Redonda con Puntillo',
        category: 'regular',
        slotsCount: 1,
        description: '1 solo acorde abarca los 3 tiempos del compás (/ / /)',
      },
      {
        id: 'half',
        name: 'Blanca + Negra',
        category: 'regular',
        slotsCount: 2,
        description: '2 slots: acorde en tiempos 1-2 y cambio armónico en el tiempo 3',
      },
      {
        id: 'quarter',
        name: 'Negras',
        category: 'regular',
        slotsCount: 3,
        description: '3 slots individuales para cada pulso de negra (/ / /)',
      },
      {
        id: 'eighth',
        name: 'Corcheas',
        category: 'regular',
        slotsCount: 6,
        description: '6 subdivisiones de corchea en métrica ternaria',
      },
      {
        id: 'sixteenth',
        name: 'Semicorcheas',
        category: 'regular',
        slotsCount: 12,
        description: '12 semicorcheas para arpegios rápidos y cortes',
      },
      {
        id: 'triplet_half',
        name: 'Dosillo',
        category: 'irregular',
        slotsCount: 2,
        bracketLabel: '[ 2 ]',
        description: '2 partes iguales dividiendo el compás de 3/4 (polirritmia 2 contra 3)',
      },
      {
        id: 'triplet_quarter',
        name: 'Tresillos',
        category: 'irregular',
        slotsCount: 3,
        bracketLabel: '[ 3 ]',
        description: '3 partes uniformes en el compás',
      },
      {
        id: 'quintuplet',
        name: 'Cincillo',
        category: 'irregular',
        slotsCount: 5,
        bracketLabel: '[ 5 ]',
        description: '5 partes iguales en compás de 3/4',
      },
      {
        id: 'sextuplet',
        name: 'Seisillo',
        category: 'irregular',
        slotsCount: 6,
        bracketLabel: '[ 6 ]',
        description: '6 divisiones uniformes en compás de 3/4',
      },
    ]
  }

  if (timeSignature === '2/4') {
    return [
      {
        id: 'whole',
        name: 'Blanca',
        category: 'regular',
        slotsCount: 1,
        description: '1 solo acorde abarca los 2 tiempos del compás (/ /)',
      },
      {
        id: 'half',
        name: '2 Pulsos',
        category: 'regular',
        slotsCount: 2,
        description: '2 slots individuales para cada pulso de negra (/ /)',
      },
      {
        id: 'quarter',
        name: 'Negras',
        category: 'regular',
        slotsCount: 2,
        description: '2 slots individuales para cada pulso del compás',
      },
      {
        id: 'eighth',
        name: 'Corcheas',
        category: 'regular',
        slotsCount: 4,
        description: '4 subdivisiones de corchea en compás binario',
      },
      {
        id: 'sixteenth',
        name: 'Semicorcheas',
        category: 'regular',
        slotsCount: 8,
        description: '8 subdivisiones de semicorchea',
      },
      {
        id: 'triplet_quarter',
        name: 'Tresillo',
        category: 'irregular',
        slotsCount: 3,
        bracketLabel: '[ 3 ]',
        description: 'Tresillo de negra abarcando los 2 tiempos (3:2)',
      },
      {
        id: 'quintuplet',
        name: 'Cincillo',
        category: 'irregular',
        slotsCount: 5,
        bracketLabel: '[ 5 ]',
        description: '5 divisiones uniformes en compás de 2/4',
      },
    ]
  }

  if (timeSignature === '6/8') {
    return [
      {
        id: 'whole',
        name: 'Compás Completo',
        category: 'regular',
        slotsCount: 1,
        description: '1 solo acorde que abarca los 2 pulsos con puntillo (6 corcheas)',
      },
      {
        id: 'half',
        name: '2 Pulsos',
        category: 'regular',
        slotsCount: 2,
        description: '2 mitades compuestas (Pulso 1: corcheas 1-3, Pulso 2: corcheas 4-6)',
      },
      {
        id: 'quarter',
        name: 'Negras con Puntillo',
        category: 'regular',
        slotsCount: 2,
        description: '2 slots para los pulsos principales con puntillo (/ /)',
      },
      {
        id: 'eighth',
        name: 'Corcheas',
        category: 'regular',
        slotsCount: 6,
        description: '6 slots individuales de corchea para compás compuesto',
      },
      {
        id: 'sixteenth',
        name: 'Semicorcheas',
        category: 'regular',
        slotsCount: 12,
        description: '12 subdivisiones rápidas en 6/8',
      },
      {
        id: 'triplet_half',
        name: 'Dosillo',
        category: 'irregular',
        slotsCount: 2,
        bracketLabel: '[ 2 ]',
        description: '2 partes binarias contra la métrica ternaria',
      },
    ]
  }

  if (timeSignature === '12/8') {
    return [
      {
        id: 'whole',
        name: 'Compás Completo',
        category: 'regular',
        slotsCount: 1,
        description: '1 solo acorde abarcando las 12 corcheas del compás (/ / / /)',
      },
      {
        id: 'half',
        name: '2 Mitades',
        category: 'regular',
        slotsCount: 2,
        description: '2 slots de 6 corcheas cada uno (T. 1-6 y T. 7-12)',
      },
      {
        id: 'quarter',
        name: '4 Pulsos',
        category: 'regular',
        slotsCount: 4,
        description: '4 slots principales para cada pulso con puntillo (/ / / /)',
      },
      {
        id: 'eighth',
        name: 'Corcheas',
        category: 'regular',
        slotsCount: 12,
        description: '12 slots individuales de corchea para baladas y blues 12/8',
      },
      {
        id: 'sixteenth',
        name: 'Semicorcheas',
        category: 'regular',
        slotsCount: 24,
        description: '24 subdivisiones de semicorchea',
      },
    ]
  }

  // 4/4 y métricas estándar por defecto
  return MEASURE_DIVISIONS
}

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
  existingChords: (string | null)[] = [],
  timeSignature: string = '4/4'
): MeasureSlot[] {
  const beatsCount = getBeatsPerMeasure(timeSignature)

  switch (division) {
    case 'whole':
      return [
        {
          index: 0,
          label: `Todo el Compás (${beatsCount} tiempos)`,
          chord: existingChords[0] || null,
        },
      ]

    case 'half':
      if (timeSignature === '3/4' || beatsCount === 3) {
        return [
          { index: 0, label: 'T. 1-2', chord: existingChords[0] || null },
          { index: 1, label: 'T. 3', chord: existingChords[1] || null },
        ]
      }
      if (timeSignature === '2/4' || beatsCount === 2) {
        return [
          { index: 0, label: 'T. 1', chord: existingChords[0] || null },
          { index: 1, label: 'T. 2', chord: existingChords[1] || null },
        ]
      }
      if (timeSignature === '6/8') {
        return [
          { index: 0, label: 'T. 1-3 (Pulso 1)', chord: existingChords[0] || null },
          { index: 1, label: 'T. 4-6 (Pulso 2)', chord: existingChords[1] || null },
        ]
      }
      if (timeSignature === '12/8') {
        return [
          { index: 0, label: 'T. 1-6 (Pulsos 1-2)', chord: existingChords[0] || null },
          { index: 1, label: 'T. 7-12 (Pulsos 3-4)', chord: existingChords[1] || null },
        ]
      }
      return [
        { index: 0, label: 'T. 1-2', chord: existingChords[0] || null },
        { index: 1, label: 'T. 3-4', chord: existingChords[1] || null },
      ]

    case 'quarter':
      if (timeSignature === '6/8') {
        return [
          { index: 0, label: 'Pulso 1 (T. 1-3)', chord: existingChords[0] || null },
          { index: 1, label: 'Pulso 2 (T. 4-6)', chord: existingChords[1] || null },
        ]
      }
      if (timeSignature === '12/8') {
        return [
          { index: 0, label: 'Pulso 1 (T. 1-3)', chord: existingChords[0] || null },
          { index: 1, label: 'Pulso 2 (T. 4-6)', chord: existingChords[1] || null },
          { index: 2, label: 'Pulso 3 (T. 7-9)', chord: existingChords[2] || null },
          { index: 3, label: 'Pulso 4 (T. 10-12)', chord: existingChords[3] || null },
        ]
      }
      return Array.from({ length: beatsCount }, (_, i) => ({
        index: i,
        label: `${i + 1}`,
        chord: existingChords[i] || null,
      }))

    case 'eighth': {
      if (timeSignature === '6/8') {
        return Array.from({ length: 6 }, (_, i) => ({
          index: i,
          label: `${i + 1}`,
          chord: existingChords[i] || null,
        }))
      }
      if (timeSignature === '12/8') {
        return Array.from({ length: 12 }, (_, i) => ({
          index: i,
          label: `${i + 1}`,
          chord: existingChords[i] || null,
        }))
      }
      const labels: string[] = []
      for (let b = 1; b <= beatsCount; b++) {
        labels.push(`${b}`, '&')
      }
      return labels.map((label, idx) => ({
        index: idx,
        label,
        chord: existingChords[idx] || null,
      }))
    }

    case 'blanca_2negras':
      return [
        { index: 0, label: 'T. 1-2 (2t)', chord: existingChords[0] || null },
        { index: 1, label: 'T. 3 (1t)', chord: existingChords[1] || null },
        { index: 2, label: 'T. 4 (1t)', chord: existingChords[2] || null },
      ]

    case '2negras_blanca':
      return [
        { index: 0, label: 'T. 1 (1t)', chord: existingChords[0] || null },
        { index: 1, label: 'T. 2 (1t)', chord: existingChords[1] || null },
        { index: 2, label: 'T. 3-4 (2t)', chord: existingChords[2] || null },
      ]

    case 'sixteenth': {
      if (timeSignature === '12/8') {
        return Array.from({ length: 24 }, (_, i) => ({
          index: i,
          label: `${i + 1}`,
          chord: existingChords[i] || null,
        }))
      }
      if (timeSignature === '6/8') {
        return Array.from({ length: 12 }, (_, i) => ({
          index: i,
          label: `${i + 1}`,
          chord: existingChords[i] || null,
        }))
      }
      const subs = ['t', 'e', '&', 'a']
      const slots: MeasureSlot[] = []
      let counter = 0
      for (let b = 1; b <= beatsCount; b++) {
        subs.forEach((s) => {
          slots.push({
            index: counter,
            label: s === 't' ? `${b}` : s,
            chord: existingChords[counter] || null,
          })
          counter++
        })
      }
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
        { index: 1, label: 'Grupo 2', chord: existingChords[2] || null },
        { index: 2, label: 'Grupo 2', chord: existingChords[2] || null },
      ]

    default:
      return Array.from({ length: beatsCount }, (_, i) => ({
        index: i,
        label: `${i + 1}`,
        chord: existingChords[i] || null,
      }))
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
  const beatsCount = getBeatsPerMeasure(timeSignature)

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
        duration: Math.floor(beatsCount / 2) || 1,
      })
    }
    if (chord2) {
      result.push({
        id: `beat-half-2-${Date.now()}`,
        beat: midBeat,
        chord: chord2,
        accent: slots[1]?.accent ? 'accent' : 'normal',
        duration: Math.ceil(beatsCount / 2) || 1,
      })
    }
    return result
  }

  if (division === 'blanca_2negras') {
    const result: ChordBeat[] = []
    if (slots[0]?.chord) {
      result.push({
        id: `beat-b2n-1-${Date.now()}`,
        beat: 1,
        chord: slots[0].chord,
        accent: slots[0]?.accent ? 'accent' : 'normal',
        duration: 2,
      })
    }
    if (slots[1]?.chord) {
      result.push({
        id: `beat-b2n-2-${Date.now()}`,
        beat: 3,
        chord: slots[1].chord,
        accent: slots[1]?.accent ? 'accent' : 'normal',
        duration: 1,
      })
    }
    if (slots[2]?.chord) {
      result.push({
        id: `beat-b2n-3-${Date.now()}`,
        beat: 4,
        chord: slots[2].chord,
        accent: slots[2]?.accent ? 'accent' : 'normal',
        duration: 1,
      })
    }
    return result
  }

  if (division === '2negras_blanca') {
    const result: ChordBeat[] = []
    if (slots[0]?.chord) {
      result.push({
        id: `beat-2nb-1-${Date.now()}`,
        beat: 1,
        chord: slots[0].chord,
        accent: slots[0]?.accent ? 'accent' : 'normal',
        duration: 1,
      })
    }
    if (slots[1]?.chord) {
      result.push({
        id: `beat-2nb-2-${Date.now()}`,
        beat: 2,
        chord: slots[1].chord,
        accent: slots[1]?.accent ? 'accent' : 'normal',
        duration: 1,
      })
    }
    if (slots[2]?.chord) {
      result.push({
        id: `beat-2nb-3-${Date.now()}`,
        beat: 3,
        chord: slots[2].chord,
        accent: slots[2]?.accent ? 'accent' : 'normal',
        duration: 2,
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
  const effectiveTimeSig = measure.timeSignature || timeSignature
  if (Array.isArray(measure.slots) && measure.slots.length > 0) {
    return measure.slots
  }

  // Deducir división inicial según los acordes existentes
  const beats = measure.beats || []
  if (beats.length <= 1) {
    const chord = beats[0]?.chord || null
    return generateSlotsForDivision('whole', [chord], effectiveTimeSig)
  }

  if (beats.length === 2) {
    const chords = [beats[0]?.chord || null, beats[1]?.chord || null]
    return generateSlotsForDivision('half', chords, effectiveTimeSig)
  }

  const chords = beats.map((b) => b.chord || null)
  return generateSlotsForDivision('quarter', chords, effectiveTimeSig)
}

/**
 * Deducir la división de un compás si no está explícita
 */
export function inferMeasureDivision(measure: Measure): MeasureDivision {
  if (measure.division) return measure.division
  if (Array.isArray(measure.slots) && measure.slots.length > 0) {
    const len = measure.slots.length
    if (len === 1) return 'whole'
    if (len === 2) return 'half'
    if (len === 4) return 'quarter'
    if (len === 8) return 'eighth'
    if (len === 6) return 'triplet_quarter'
    if (len === 3) return 'triplet_half'
  }
  const beats = measure.beats || []
  if (beats.length <= 1) return 'whole'
  if (beats.length === 2) return 'half'
  return 'quarter'
}

/**
 * Actualiza en cascada todas las secciones y compases al cambiar la cifra de compás (Time Signature)
 * Recalcula slots y pulsos por defecto preservando los acordes existentes.
 */
export function updateSectionsTimeSignature(
  sections: SectionMeasures[],
  newTimeSignature: string
): SectionMeasures[] {
  return sections.map((section) => ({
    ...section,
    timeSignature: newTimeSignature,
    measures: (section.measures || []).map((measure) => {
      // Extraer los acordes que ya estuvieran ingresados respetando el orden
      const existingChords: (string | null)[] = []
      if (Array.isArray(measure.slots) && measure.slots.length > 0) {
        measure.slots.forEach((s) => {
          if (s && s.chord) existingChords.push(s.chord)
        })
      } else if (Array.isArray(measure.beats) && measure.beats.length > 0) {
        measure.beats.forEach((b) => {
          if (b && b.chord) existingChords.push(b.chord)
        })
      }

      const currentDivision = measure.division || 'whole'
      const newSlots = generateSlotsForDivision(currentDivision, existingChords, newTimeSignature)
      const newBeats = syncBeatsFromSlots(newSlots, currentDivision, newTimeSignature)

      return {
        ...measure,
        timeSignature: newTimeSignature,
        division: currentDivision,
        slots: newSlots && newSlots.length > 0 ? newSlots : generateSlotsForDivision('whole', existingChords, newTimeSignature),
        beats: newBeats,
      }
    }),
  }))
}

export interface PulseGroup {
  pulseIndex: number
  slashesCount: number
}

/**
 * Devuelve la estructura de pulsos y marcas de tiempo (slashes) para la métrica activa:
 * - 6/8: 2 grupos de 3 corcheas (/ / /   / / /)
 * - 12/8: 4 grupos de 3 corcheas (/ / /   / / /   / / /   / / /)
 * - 9/8: 3 grupos de 3 corcheas (/ / /   / / /   / / /)
 * - 3/4: 1 grupo de 3 negras (/ / /)
 * - 2/4: 1 grupo de 2 negras (/ /)
 * - 4/4: 1 grupo de 4 negras (/ / / /)
 */
export function getMetricPulseGroups(timeSignature: string = '4/4'): PulseGroup[] {
  if (timeSignature === '6/8') {
    return [
      { pulseIndex: 1, slashesCount: 3 },
      { pulseIndex: 2, slashesCount: 3 },
    ]
  }

  if (timeSignature === '12/8') {
    return [
      { pulseIndex: 1, slashesCount: 3 },
      { pulseIndex: 2, slashesCount: 3 },
      { pulseIndex: 3, slashesCount: 3 },
      { pulseIndex: 4, slashesCount: 3 },
    ]
  }

  if (timeSignature === '9/8') {
    return [
      { pulseIndex: 1, slashesCount: 3 },
      { pulseIndex: 2, slashesCount: 3 },
      { pulseIndex: 3, slashesCount: 3 },
    ]
  }

  if (timeSignature === '3/4') {
    return [{ pulseIndex: 1, slashesCount: 3 }]
  }

  if (timeSignature === '2/4') {
    return [{ pulseIndex: 1, slashesCount: 2 }]
  }

  const beats = getBeatsPerMeasure(timeSignature)
  return [{ pulseIndex: 1, slashesCount: beats > 0 ? beats : 4 }]
}

/**
 * Representación en texto de las marcas de tiempo (slashes) agrupadas
 */
export function formatTimeSignaturePulseMarks(timeSignature: string = '4/4'): string {
  const groups = getMetricPulseGroups(timeSignature)
  return groups
    .map((g) => Array.from({ length: g.slashesCount }).map(() => '/').join(' '))
    .join('   ')
}

/**
 * Devuelve la cantidad de pulsos/clics que componen un compás para el detector de Tap Tempo
 */
export function getCycleBeatsForTimeSignature(timeSignature: string = '4/4'): number {
  if (timeSignature === '6/8') return 2 // 2 pulsos compuestos principales
  if (timeSignature === '12/8') return 4 // 4 pulsos compuestos principales
  if (timeSignature === '9/8') return 3 // 3 pulsos compuestos principales
  if (timeSignature === '3/4') return 3
  if (timeSignature === '2/4') return 2
  return 4 // 4/4 u otros
}

/**
 * Descripción textual del ciclo de pulsos del compás
 */
export function getTimeSignatureCycleDescription(timeSignature: string = '4/4'): string {
  if (timeSignature === '6/8') return '2 pulsos compuestos (/ / /   / / /)'
  if (timeSignature === '12/8') return '4 pulsos compuestos (/ / /   / / /   / / /   / / /)'
  if (timeSignature === '9/8') return '3 pulsos compuestos (/ / /   / / /   / / /)'
  if (timeSignature === '3/4') return '3 pulsos (1 - 2 - 3)'
  if (timeSignature === '2/4') return '2 pulsos (1 - 2)'
  return '4 pulsos (1 - 2 - 3 - 4)'
}
