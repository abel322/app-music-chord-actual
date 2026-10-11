/**
 * Utilidades de Teoría y Notación Rítmica para MusicChord
 * Gestión de subdivisiones regulares, figuras irregulares (tresillos, cincillos) y amalgamas
 */

import { SubdivisionType, SubBeatSlot, BeatAccent } from '@/types/measure'

export interface SubdivisionOption {
  type: SubdivisionType
  label: string
  category: 'regular' | 'irregular' | 'amalgam'
  slotsCount: number
  bracketLabel?: string
  description: string
}

export const SUBDIVISION_OPTIONS: SubdivisionOption[] = [
  // --- REGULARES ---
  {
    type: '1/4',
    label: 'Negra (1 pulso)',
    category: 'regular',
    slotsCount: 1,
    description: 'División estándar por defecto (1 acorde por pulso)',
  },
  {
    type: '1/8',
    label: 'Corcheas (2 partes: 1 &)',
    category: 'regular',
    slotsCount: 2,
    description: 'Tiempo y contratiempo (&) para síncopas y cambios rápidos',
  },
  {
    type: '1/16',
    label: 'Semicorcheas (4 partes: 1 e & a)',
    category: 'regular',
    slotsCount: 4,
    description: 'Subdivisión de 4 semicorcheas para funk, pop rítmico y cortes precisos',
  },
  {
    type: '1/2',
    label: 'Blanca (2 pulsos)',
    category: 'regular',
    slotsCount: 1,
    description: 'Figura de 2 tiempos de duración',
  },
  {
    type: '1/1',
    label: 'Redonda (Compás completo)',
    category: 'regular',
    slotsCount: 1,
    description: 'Un acorde sostenido a lo largo de todo el compás',
  },

  // --- IRREGULARES / POLIRRÍTMICAS ---
  {
    type: 'triplet',
    label: 'Tresillo [ 3 ]',
    category: 'irregular',
    slotsCount: 3,
    bracketLabel: '[ 3 ]',
    description: '3 figuras en el espacio de 2 (Blues, Jazz swing, Baladas 6/8)',
  },
  {
    type: 'quintuplet',
    label: 'Cincillo [ 5 ]',
    category: 'irregular',
    slotsCount: 5,
    bracketLabel: '[ 5 ]',
    description: '5 figuras en el espacio de 4 (Música contemporánea, R&B, Funk)',
  },
  {
    type: 'sextuplet',
    label: 'Seisillo [ 6 ]',
    category: 'irregular',
    slotsCount: 6,
    bracketLabel: '[ 6 ]',
    description: '6 figuras en 1 o 2 tiempos (subdivisión doble de tresillo)',
  },
  {
    type: 'septuplet',
    label: 'Septillo [ 7 ]',
    category: 'irregular',
    slotsCount: 7,
    bracketLabel: '[ 7 ]',
    description: '7 figuras en el espacio de 4 u 8',
  },

  // --- AMALGAMAS / ASIMÉTRICAS ---
  {
    type: '3+2',
    label: 'Amalgama 3+2 (5/8)',
    category: 'amalgam',
    slotsCount: 2,
    bracketLabel: '[ 3+2 ]',
    description: 'Agrupación asimétrica de 3 corcheas seguidas de 2 corcheas',
  },
  {
    type: '2+3',
    label: 'Amalgama 2+3 (5/8)',
    category: 'amalgam',
    slotsCount: 2,
    bracketLabel: '[ 2+3 ]',
    description: 'Agrupación asimétrica de 2 corcheas seguidas de 3 corcheas',
  },
  {
    type: '3+3+2',
    label: 'Amalgama 3+3+2 (8/8 / Tresillo Cubano)',
    category: 'amalgam',
    slotsCount: 3,
    bracketLabel: '[ 3+3+2 ]',
    description: 'Ritmo síncopado clásico latino/balkanico de 8 corcheas',
  },
]

/**
 * Devuelve la etiqueta de corchete para figuras irregulares o amalgamas
 */
export function getSubdivisionBracketLabel(subdivision?: SubdivisionType): string | null {
  if (!subdivision) return null
  const found = SUBDIVISION_OPTIONS.find((s) => s.type === subdivision)
  return found?.bracketLabel || null
}

/**
 * Genera los micro-slots iniciales para una subdivisión dada
 */
export function createSubSlotsForSubdivision(
  subdivision: SubdivisionType,
  beatNumber: number,
  baseChord: string = ''
): SubBeatSlot[] {
  switch (subdivision) {
    case '1/8':
      return [
        {
          id: `slot-${Date.now()}-0`,
          slotIndex: 0,
          label: `${beatNumber}`,
          chord: baseChord,
          accent: 'normal',
        },
        {
          id: `slot-${Date.now()}-1`,
          slotIndex: 1,
          label: '&',
          chord: '',
          accent: 'syncopated',
        },
      ]

    case '1/16':
      return [
        { id: `slot-${Date.now()}-0`, slotIndex: 0, label: `${beatNumber}`, chord: baseChord, accent: 'normal' },
        { id: `slot-${Date.now()}-1`, slotIndex: 1, label: 'e', chord: '', accent: 'normal' },
        { id: `slot-${Date.now()}-2`, slotIndex: 2, label: '&', chord: '', accent: 'syncopated' },
        { id: `slot-${Date.now()}-3`, slotIndex: 3, label: 'a', chord: '', accent: 'normal' },
      ]

    case 'triplet':
      return [
        { id: `slot-${Date.now()}-0`, slotIndex: 0, label: '1', chord: baseChord, accent: 'normal' },
        { id: `slot-${Date.now()}-1`, slotIndex: 1, label: '2', chord: '', accent: 'normal' },
        { id: `slot-${Date.now()}-2`, slotIndex: 2, label: '3', chord: '', accent: 'normal' },
      ]

    case 'quintuplet':
      return Array.from({ length: 5 }, (_, i) => ({
        id: `slot-${Date.now()}-${i}`,
        slotIndex: i,
        label: `${i + 1}`,
        chord: i === 0 ? baseChord : '',
        accent: 'normal',
      }))

    case 'sextuplet':
      return Array.from({ length: 6 }, (_, i) => ({
        id: `slot-${Date.now()}-${i}`,
        slotIndex: i,
        label: `${i + 1}`,
        chord: i === 0 ? baseChord : '',
        accent: 'normal',
      }))

    case 'septuplet':
      return Array.from({ length: 7 }, (_, i) => ({
        id: `slot-${Date.now()}-${i}`,
        slotIndex: i,
        label: `${i + 1}`,
        chord: i === 0 ? baseChord : '',
        accent: 'normal',
      }))

    case '3+2':
      return [
        { id: `slot-${Date.now()}-0`, slotIndex: 0, label: '3', chord: baseChord, accent: 'normal' },
        { id: `slot-${Date.now()}-1`, slotIndex: 1, label: '2', chord: '', accent: 'normal' },
      ]

    case '2+3':
      return [
        { id: `slot-${Date.now()}-0`, slotIndex: 0, label: '2', chord: baseChord, accent: 'normal' },
        { id: `slot-${Date.now()}-1`, slotIndex: 1, label: '3', chord: '', accent: 'normal' },
      ]

    case '3+3+2':
      return [
        { id: `slot-${Date.now()}-0`, slotIndex: 0, label: '3', chord: baseChord, accent: 'normal' },
        { id: `slot-${Date.now()}-1`, slotIndex: 1, label: '3', chord: '', accent: 'normal' },
        { id: `slot-${Date.now()}-2`, slotIndex: 2, label: '2', chord: '', accent: 'normal' },
      ]

    case '1/4':
    case '1/2':
    case '1/1':
    default:
      return [
        {
          id: `slot-${Date.now()}-0`,
          slotIndex: 0,
          label: `${beatNumber}`,
          chord: baseChord,
          accent: 'normal',
        },
      ]
  }
}

/**
 * Devuelve el símbolo de notación para un acento rítmico
 */
export function getAccentSymbol(accent?: BeatAccent): string | null {
  switch (accent) {
    case 'accent':
      return '>'
    case 'cut':
      return '•'
    case 'syncopated':
      return '^'
    case 'normal':
    default:
      return null
  }
}
