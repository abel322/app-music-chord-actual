/**
 * Catálogo Exhaustivo de Acordes y Utilidades Teóricas para MusicChord
 * Soporte para Tríadas, Séptimas, Extensiones (9, 11, 13), Acordes Alterados (Jazz/Gospel),
 * Slash Chords (Bajo alternado), Poliacordes y Normalización Inteligente de Entrada Libre.
 */

export interface ChordRootOption {
  value: string
  label: string
  accidental?: 'sharp' | 'flat' | 'natural'
}

export const CHORD_ROOTS: ChordRootOption[] = [
  { value: 'C', label: 'C', accidental: 'natural' },
  { value: 'C#', label: 'C#', accidental: 'sharp' },
  { value: 'Db', label: 'D♭', accidental: 'flat' },
  { value: 'D', label: 'D', accidental: 'natural' },
  { value: 'D#', label: 'D#', accidental: 'sharp' },
  { value: 'Eb', label: 'E♭', accidental: 'flat' },
  { value: 'E', label: 'E', accidental: 'natural' },
  { value: 'F', label: 'F', accidental: 'natural' },
  { value: 'F#', label: 'F#', accidental: 'sharp' },
  { value: 'Gb', label: 'G♭', accidental: 'flat' },
  { value: 'G', label: 'G', accidental: 'natural' },
  { value: 'G#', label: 'G#', accidental: 'sharp' },
  { value: 'Ab', label: 'A♭', accidental: 'flat' },
  { value: 'A', label: 'A', accidental: 'natural' },
  { value: 'A#', label: 'A#', accidental: 'sharp' },
  { value: 'Bb', label: 'B♭', accidental: 'flat' },
  { value: 'B', label: 'B', accidental: 'natural' },
]

export type ChordCategory = 'triads' | 'sevenths' | 'extensions' | 'altered' | 'slash_inversion'

export interface ChordQuality {
  id: string
  suffix: string
  name: string
  symbol: string
  description: string
  category: ChordCategory
}

export const CHORD_QUALITIES: ChordQuality[] = [
  // --- 1. TRÍADAS BÁSICAS ---
  {
    id: 'major',
    suffix: '',
    name: 'Mayor',
    symbol: 'M (Natural)',
    description: 'Tríada mayor fundamental (1, 3, 5)',
    category: 'triads',
  },
  {
    id: 'minor',
    suffix: 'm',
    name: 'Menor',
    symbol: 'm',
    description: 'Tríada menor melancólica (1, ♭3, 5)',
    category: 'triads',
  },
  {
    id: 'diminished',
    suffix: 'dim',
    name: 'Disminuido',
    symbol: 'dim / °',
    description: 'Tríada disminuida de tensión (1, ♭3, ♭5)',
    category: 'triads',
  },
  {
    id: 'augmented',
    suffix: 'aug',
    name: 'Aumentado',
    symbol: 'aug / +',
    description: 'Tríada aumentada suspendida (1, 3, #5)',
    category: 'triads',
  },
  {
    id: 'sus2',
    suffix: 'sus2',
    name: 'Suspendido 2',
    symbol: 'sus2',
    description: 'Tríada abierta sin tercera (1, 2, 5)',
    category: 'triads',
  },
  {
    id: 'sus4',
    suffix: 'sus4',
    name: 'Suspendido 4',
    symbol: 'sus4',
    description: 'Suspensión clásica hacia la resolución (1, 4, 5)',
    category: 'triads',
  },

  // --- 2. ACORDES DE SÉPTIMA ---
  {
    id: 'dom7',
    suffix: '7',
    name: 'Séptima Dominante',
    symbol: '7',
    description: 'Tensión dominante principal (1, 3, 5, ♭7)',
    category: 'sevenths',
  },
  {
    id: 'maj7',
    suffix: 'maj7',
    name: 'Séptima Mayor',
    symbol: 'maj7 / Δ',
    description: 'Sonoridad jazz suave y brillante (1, 3, 5, 7)',
    category: 'sevenths',
  },
  {
    id: 'm7',
    suffix: 'm7',
    name: 'Séptima Menor',
    symbol: 'm7',
    description: 'Color menor con séptima (1, ♭3, 5, ♭7)',
    category: 'sevenths',
  },
  {
    id: 'm7b5',
    suffix: 'm7b5',
    name: 'Semidisminuido',
    symbol: 'm7b5 / ø',
    description: 'Acorde ii en tonalidad menor (1, ♭3, ♭5, ♭7)',
    category: 'sevenths',
  },
  {
    id: 'dim7',
    suffix: 'dim7',
    name: 'Disminuido Completo',
    symbol: 'dim7 / °7',
    description: 'Simétrico por terceras menores (1, ♭3, ♭5, 𝄫7)',
    category: 'sevenths',
  },
  {
    id: 'mmaj7',
    suffix: 'm(maj7)',
    name: 'Menor Maj7',
    symbol: 'm(maj7)',
    description: 'Sonoridad de misterio / Menor melódica (1, ♭3, 5, 7)',
    category: 'sevenths',
  },
  {
    id: 'maj7sharp5',
    suffix: 'maj7#5',
    name: 'Maj7 Aumentado',
    symbol: 'maj7#5',
    description: 'Acorde moderno con quinta aumentada (1, 3, #5, 7)',
    category: 'sevenths',
  },

  // --- 3. EXTENSIONES Y TENSIONES (JAZZ / GOSPEL / NEO-SOUL) ---
  {
    id: 'dom9',
    suffix: '9',
    name: 'Nona Dominante',
    symbol: '9',
    description: 'Dominante extendido (1, 3, 5, ♭7, 9)',
    category: 'extensions',
  },
  {
    id: 'maj9',
    suffix: 'maj9',
    name: 'Nona Mayor',
    symbol: 'maj9',
    description: 'Extensión jazz elegante (1, 3, 5, 7, 9)',
    category: 'extensions',
  },
  {
    id: 'm9',
    suffix: 'm9',
    name: 'Nona Menor',
    symbol: 'm9',
    description: 'Color sofisticado R&B / Neo-Soul (1, ♭3, 5, ♭7, 9)',
    category: 'extensions',
  },
  {
    id: 'add9',
    suffix: 'add9',
    name: 'Add9 (Tríada + 9ª)',
    symbol: 'add9',
    description: 'Acorde pop/acústico sin 7ª (1, 3, 5, 9)',
    category: 'extensions',
  },
  {
    id: 'madd9',
    suffix: 'm(add9)',
    name: 'Menor Add9',
    symbol: 'm(add9)',
    description: 'Tríada menor con nona agregada (1, ♭3, 5, 9)',
    category: 'extensions',
  },
  {
    id: 'dom11',
    suffix: '11',
    name: 'Oncena Dominante',
    symbol: '11',
    description: 'Sonoridad funk / soul (1, 5, ♭7, 9, 11)',
    category: 'extensions',
  },
  {
    id: 'm11',
    suffix: 'm11',
    name: 'Oncena Menor',
    symbol: 'm11',
    description: 'Gran amplitud armónica menor (1, ♭3, 5, ♭7, 9, 11)',
    category: 'extensions',
  },
  {
    id: 'maj11',
    suffix: 'maj11',
    name: 'Oncena Mayor',
    symbol: 'maj11',
    description: 'Sonido contemporáneo etéreo (1, 3, 5, 7, 9, 11)',
    category: 'extensions',
  },
  {
    id: 'seven_sharp11',
    suffix: '7#11',
    name: '7(#11) Lidio Dominante',
    symbol: '7#11',
    description: 'Escala lidia dominante de jazz (1, 3, 5, ♭7, #11)',
    category: 'extensions',
  },
  {
    id: 'dom13',
    suffix: '13',
    name: 'Trecena Dominante',
    symbol: '13',
    description: 'Extensión máxima de dominante (1, 3, 5, ♭7, 9, 13)',
    category: 'extensions',
  },
  {
    id: 'maj13',
    suffix: 'maj13',
    name: 'Trecena Mayor',
    symbol: 'maj13',
    description: 'Lujo armónico en acordes mayores (1, 3, 5, 7, 9, 13)',
    category: 'extensions',
  },
  {
    id: 'm13',
    suffix: 'm13',
    name: 'Trecena Menor',
    symbol: 'm13',
    description: 'Dórico refinado con trecena (1, ♭3, 5, ♭7, 9, 13)',
    category: 'extensions',
  },
  {
    id: 'six',
    suffix: '6',
    name: 'Sexta Mayor',
    symbol: '6',
    description: 'Cadencia swing tradicional (1, 3, 5, 6)',
    category: 'extensions',
  },
  {
    id: 'm6',
    suffix: 'm6',
    name: 'Sexta Menor',
    symbol: 'm6',
    description: 'Sonoridad melódica menor / bossa nova (1, ♭3, 5, 6)',
    category: 'extensions',
  },
  {
    id: 'six_nine',
    suffix: '6/9',
    name: 'Sexta Nona',
    symbol: '6/9',
    description: 'Resolución acústica de bossa nova y jazz (1, 3, 5, 6, 9)',
    category: 'extensions',
  },

  // --- 4. ACORDES ALTERADOS (GOSPEL, BEBOP, POST-BOP) ---
  {
    id: 'seven_alt',
    suffix: '7alt',
    name: '7 Alterado',
    symbol: '7alt',
    description: 'Escala alterada completa (♭9, #9, ♭5, #5)',
    category: 'altered',
  },
  {
    id: 'seven_flat9',
    suffix: '7(b9)',
    name: '7 con Novena Bemol',
    symbol: '7(b9)',
    description: 'Tensión dominante menor clásica (1, 3, 5, ♭7, ♭9)',
    category: 'altered',
  },
  {
    id: 'seven_sharp9',
    suffix: '7(#9)',
    name: '7 con Novena Aumentada',
    symbol: '7(#9)',
    description: 'Acorde Hendrix / Blues rock / Funk (1, 3, 5, ♭7, #9)',
    category: 'altered',
  },
  {
    id: 'seven_flat5',
    suffix: '7(b5)',
    name: '7 con Quinta Bemol',
    symbol: '7(b5)',
    description: 'Tensión tritonal francesa (1, 3, ♭5, ♭7)',
    category: 'altered',
  },
  {
    id: 'seven_sharp5',
    suffix: '7(#5)',
    name: '7 con Quinta Aumentada',
    symbol: '7(#5)',
    description: 'Dominante aumentado hacia I (1, 3, #5, ♭7)',
    category: 'altered',
  },
  {
    id: 'seven_b9_b13',
    suffix: '7(b9,b13)',
    name: '7(♭9, ♭13)',
    symbol: '7(b9,b13)',
    description: 'Tensión gospel máxima hacia acorde menor (1, 3, ♭7, ♭9, ♭13)',
    category: 'altered',
  },
  {
    id: 'seven_sharp9_sharp11',
    suffix: '7(#9,#11)',
    name: '7(#9, #11)',
    symbol: '7(#9,#11)',
    description: 'Doble tensión contemporánea de jazz moderno',
    category: 'altered',
  },
  {
    id: 'sus4_flat9',
    suffix: 'sus4(b9)',
    name: 'Sus4(♭9) Frigio',
    symbol: 'sus4(b9)',
    description: 'Acorde frigio español y gospel contemporáneo',
    category: 'altered',
  },
  {
    id: 'thirteen_flat9',
    suffix: '13b9',
    name: '13(♭9)',
    symbol: '13b9',
    description: 'Trecena con novena bemol jazzística',
    category: 'altered',
  },
]

export const BASS_NOTES = [
  '',
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
]

export interface SlashPreset {
  chord: string
  label: string
  type: 'inversion' | 'polychord' | 'pedal'
}

export const COMMON_SLASH_CHORDS: SlashPreset[] = [
  { chord: 'C/E', label: 'C/E (1ª Inversión)', type: 'inversion' },
  { chord: 'G/B', label: 'G/B (1ª Inversión)', type: 'inversion' },
  { chord: 'D/F#', label: 'D/F# (1ª Inversión)', type: 'inversion' },
  { chord: 'F/A', label: 'F/A (1ª Inversión)', type: 'inversion' },
  { chord: 'Bb/D', label: 'Bb/D (1ª Inversión)', type: 'inversion' },
  { chord: 'Am/G', label: 'Am/G (Bajo pedal)', type: 'pedal' },
  { chord: 'D/C', label: 'D/C (Lidio Poliacorde)', type: 'polychord' },
  { chord: 'F/G', label: 'F/G (G9sus4 Gospel/Soul)', type: 'polychord' },
  { chord: 'Ab/Bb', label: 'Ab/Bb (Bb9sus4 Neo-Soul)', type: 'polychord' },
  { chord: 'Bb/C', label: 'Bb/C (C11 Gospel)', type: 'polychord' },
  { chord: 'Eb/F', label: 'Eb/F (F9sus4 Pop)', type: 'polychord' },
  { chord: 'E/C', label: 'E/C (Cmaj7#5 Upper Structure)', type: 'polychord' },
  { chord: 'F#/C', label: 'F#/C (Tritone Upper Structure)', type: 'polychord' },
]

/**
 * Normaliza inteligentemente la entrada de texto de cualquier acorde
 * Respeta libertad absoluta de escritura, corrigiendo mayúsculas y alias comunes.
 */
export function normalizeChordInput(input: string): string {
  if (!input) return ''
  const trimmed = input.trim()
  if (trimmed === '%' || trimmed === '/') return trimmed

  // Si tiene bajo alternado (Slash Chord)
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/')
    const main = normalizeSingleChord(parts[0])
    const bass = normalizeBassNote(parts[1])
    return bass ? `${main}/${bass}` : main
  }

  return normalizeSingleChord(trimmed)
}

function normalizeSingleChord(chord: string): string {
  if (!chord) return ''

  // Primera letra de la fundamental a mayúscula
  let root = chord[0].toUpperCase()
  let rest = chord.slice(1)

  // Accidental (# o b)
  if (rest.startsWith('#') || rest.startsWith('b')) {
    root += rest[0]
    rest = rest.slice(1)
  }

  // Normalizar alias comunes sin limitar la entrada
  rest = rest.replace(/^[Δ\^]/, 'maj7')
  rest = rest.replace(/^[°o]7/, 'dim7').replace(/^[°o]/, 'dim')
  rest = rest.replace(/^ø/, 'm7b5')

  if (rest.startsWith('-')) {
    rest = 'm' + rest.slice(1)
  }
  if (rest.startsWith('min')) {
    rest = 'm' + rest.slice(3)
  }

  return root + rest
}

function normalizeBassNote(bass: string): string {
  if (!bass) return ''
  const trimmed = bass.trim()
  if (!trimmed) return ''

  let root = trimmed[0].toUpperCase()
  const rest = trimmed.slice(1)
  if (rest.startsWith('#') || rest.startsWith('b')) {
    root += rest[0]
  }
  return root
}
