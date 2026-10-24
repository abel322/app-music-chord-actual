import { MeasureDivision } from '@/types/measure'

export interface RhythmOption {
  id: string
  name: string        // Nombre corto y directo
  badge: string       // Etiqueta compacta de slots/duración
  category: 'regular' | 'irregular'
  slotsCount: number
  durations: number[] // Duración en tiempos para cada slot en compás 4/4
  division: MeasureDivision
  slotLabels?: string[]
}

export const RHYTHM_OPTIONS: RhythmOption[] = [
  // --- REGULARES ---
  {
    id: '1_redonda',
    name: '1 Redonda',
    badge: '1 slot (4t)',
    category: 'regular',
    slotsCount: 1,
    durations: [4],
    division: 'whole',
    slotLabels: ['T. 1-4 (4t)'],
  },
  {
    id: '2_blancas',
    name: '2 Blancas',
    badge: '2 slots (2t)',
    category: 'regular',
    slotsCount: 2,
    durations: [2, 2],
    division: 'half',
    slotLabels: ['T. 1-2 (2t)', 'T. 3-4 (2t)'],
  },
  {
    id: '4_negras',
    name: '4 Negras',
    badge: '4 slots (1t)',
    category: 'regular',
    slotsCount: 4,
    durations: [1, 1, 1, 1],
    division: 'quarter',
    slotLabels: ['T. 1', 'T. 2', 'T. 3', 'T. 4'],
  },
  {
    id: '8_corcheas',
    name: '8 Corcheas',
    badge: '8 slots (½t)',
    category: 'regular',
    slotsCount: 8,
    durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    division: 'eighth',
    slotLabels: [
      'T. 1',
      'T. 1.5 (&)',
      'T. 2',
      'T. 2.5 (&)',
      'T. 3',
      'T. 3.5 (&)',
      'T. 4',
      'T. 4.5 (&)',
    ],
  },
  {
    id: 'blanca_2negras',
    name: 'Blanca + 2N',
    badge: '3 slots (2+1+1)',
    category: 'regular',
    slotsCount: 3,
    durations: [2, 1, 1],
    division: 'blanca_2negras',
    slotLabels: ['T. 1-2 (2t)', 'T. 3 (1t)', 'T. 4 (1t)'],
  },
  {
    id: '2negras_blanca',
    name: '2N + Blanca',
    badge: '3 slots (1+1+2)',
    category: 'regular',
    slotsCount: 3,
    durations: [1, 1, 2],
    division: '2negras_blanca',
    slotLabels: ['T. 1 (1t)', 'T. 2 (1t)', 'T. 3-4 (2t)'],
  },

  // --- IRREGULARES (TRESILLOS) ---
  {
    id: 'tresillo_3',
    name: 'Tresillo (3)',
    badge: '3 slots',
    category: 'irregular',
    slotsCount: 3,
    durations: [1.33, 1.33, 1.33],
    division: 'triplet_half',
    slotLabels: ['T. 1', 'T. 2.3', 'T. 3.7'],
  },
  {
    id: 'tresillo_6',
    name: 'Tresillo (6)',
    badge: '6 slots',
    category: 'irregular',
    slotsCount: 6,
    durations: [0.66, 0.66, 0.66, 0.66, 0.66, 0.66],
    division: 'triplet_quarter',
    slotLabels: ['T. 1', 'T. 1.7', 'T. 2.3', 'T. 3', 'T. 3.7', 'T. 4.3'],
  },
]

/**
 * Obtiene las opciones de subdivisión rítmica adaptadas a la cifra de compás
 */
export function getRhythmOptionsForTimeSignature(timeSignature: string = '4/4'): RhythmOption[] {
  if (timeSignature === '3/4') {
    return [
      {
        id: '1_redonda',
        name: 'Compás Completo',
        badge: '1 slot (3t)',
        category: 'regular',
        slotsCount: 1,
        durations: [3],
        division: 'whole',
        slotLabels: ['T. 1-3 (3t)'],
      },
      {
        id: 'blanca_negra',
        name: 'Blanca + Negra',
        badge: '2 slots (2+1)',
        category: 'regular',
        slotsCount: 2,
        durations: [2, 1],
        division: 'half',
        slotLabels: ['T. 1-2 (2t)', 'T. 3 (1t)'],
      },
      {
        id: '4_negras',
        name: '3 Negras',
        badge: '3 slots (1t)',
        category: 'regular',
        slotsCount: 3,
        durations: [1, 1, 1],
        division: 'quarter',
        slotLabels: ['T. 1', 'T. 2', 'T. 3'],
      },
      {
        id: '8_corcheas',
        name: '6 Corcheas',
        badge: '6 slots (½t)',
        category: 'regular',
        slotsCount: 6,
        durations: [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
        division: 'eighth',
        slotLabels: ['T. 1', 'T. 1.5 (&)', 'T. 2', 'T. 2.5 (&)', 'T. 3', 'T. 3.5 (&)'],
      },
      {
        id: 'tresillo_3',
        name: 'Tresillo (3)',
        badge: '3 slots',
        category: 'irregular',
        slotsCount: 3,
        durations: [1, 1, 1],
        division: 'triplet_half',
        slotLabels: ['T. 1 (Tresillo)', 'T. 2', 'T. 3'],
      },
    ]
  }

  if (timeSignature === '6/8') {
    return [
      {
        id: '1_redonda',
        name: 'Compás Completo',
        badge: '1 slot (6t)',
        category: 'regular',
        slotsCount: 1,
        durations: [6],
        division: 'whole',
        slotLabels: ['T. 1-6 (6t)'],
      },
      {
        id: '2_blancas',
        name: '2 Pulsos',
        badge: '2 slots (3+3)',
        category: 'regular',
        slotsCount: 2,
        durations: [3, 3],
        division: 'half',
        slotLabels: ['Pulso 1 (T. 1-3)', 'Pulso 2 (T. 4-6)'],
      },
      {
        id: '8_corcheas',
        name: '6 Corcheas',
        badge: '6 slots (1t)',
        category: 'regular',
        slotsCount: 6,
        durations: [1, 1, 1, 1, 1, 1],
        division: 'eighth',
        slotLabels: ['T. 1', 'T. 2', 'T. 3', 'T. 4', 'T. 5', 'T. 6'],
      },
      {
        id: 'tresillo_3',
        name: 'Dosillo (2)',
        badge: '2 slots (binario)',
        category: 'irregular',
        slotsCount: 2,
        durations: [3, 3],
        division: 'triplet_half',
        slotLabels: ['Dosillo 1', 'Dosillo 2'],
      },
    ]
  }

  // Estándar 4/4 y demás métricas
  return RHYTHM_OPTIONS
}
