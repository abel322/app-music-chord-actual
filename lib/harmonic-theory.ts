/**
 * Módulo de Teoría Armónica para MusicChord
 * Gestión de Progresiones de Acordes y Detección de Cadencias
 */

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
}

/**
 * Normaliza cualquier nota (ej: Db -> C#)
 */
export function normalizeNote(note: string): string {
  const trimmed = note.trim()
  return FLAT_TO_SHARP[trimmed] || trimmed
}

/**
 * Mapeo de grados romanos relativos a semitonos e intervalos
 */
const DEGREE_DEFINITIONS: Record<string, { semitones: number; quality: string }> = {
  // Tónica
  I: { semitones: 0, quality: '' },
  i: { semitones: 0, quality: 'm' },

  // Segunda bemol / Napolitano
  '♭II': { semitones: 1, quality: '' },
  bII: { semitones: 1, quality: '' },

  // Segunda
  ii: { semitones: 2, quality: 'm' },
  II: { semitones: 2, quality: '' },

  // Tercera bemol
  '♭III': { semitones: 3, quality: '' },
  bIII: { semitones: 3, quality: '' },

  // Tercera
  iii: { semitones: 4, quality: 'm' },
  III: { semitones: 4, quality: '' },

  // Cuarta
  IV: { semitones: 5, quality: '' },
  iv: { semitones: 5, quality: 'm' },

  // Tritono
  '♭V': { semitones: 6, quality: 'dim' },

  // Quinta
  V: { semitones: 7, quality: '' },
  v: { semitones: 7, quality: 'm' },
  V7: { semitones: 7, quality: '7' },

  // Sexta bemol
  '♭VI': { semitones: 8, quality: '' },
  bVI: { semitones: 8, quality: '' },

  // Sexta
  vi: { semitones: 9, quality: 'm' },
  VI: { semitones: 9, quality: '' },

  // Séptima bemol
  '♭VII': { semitones: 10, quality: '' },
  bVII: { semitones: 10, quality: '' },

  // Séptima / Sensible
  'vii°': { semitones: 11, quality: 'dim' },
  viio: { semitones: 11, quality: 'dim' },
  vii: { semitones: 11, quality: 'dim' },
  VII: { semitones: 11, quality: '' },
}

/**
 * Convierte un grado romano a su acorde correspondiente en una tonalidad dada
 * Ej: degreeToChord('vi', 'C') => 'Am'
 *     degreeToChord('V', 'G') => 'D'
 */
export function degreeToChord(degree: string, key: string = 'C'): string {
  // Limpiar tonalidad de si viene con "m" (menor)
  const isMinorKey = key.endsWith('m') && !key.toLowerCase().endsWith('maj')
  const rootKey = normalizeNote(key.replace(/m$/i, '').trim())

  const rootIndex = NOTES.indexOf(rootKey)
  if (rootIndex === -1) return degree

  const def = DEGREE_DEFINITIONS[degree]
  if (!def) return degree

  const chordRootIndex = (rootIndex + def.semitones) % 12
  const chordRoot = NOTES[chordRootIndex]

  return `${chordRoot}${def.quality}`
}

/**
 * Obtiene el grado romano de un acorde dado dentro de una tonalidad
 */
export function chordToDegree(chord: string, key: string = 'C'): string | null {
  if (!chord) return null

  // Remover bajo alternado para analizar el grado fundamental (ej. D/F# -> D)
  const [mainChord] = chord.split('/')
  const match = mainChord.match(/^([A-G][#b]?)(.*)$/)
  if (!match) return null

  const chordRoot = normalizeNote(match[1])
  const chordSuffix = match[2] || ''

  const rootKey = normalizeNote(key.replace(/m$/i, '').trim())
  const keyIndex = NOTES.indexOf(rootKey)
  const chordIndex = NOTES.indexOf(chordRoot)

  if (keyIndex === -1 || chordIndex === -1) return null

  const semitones = (chordIndex - keyIndex + 12) % 12
  const isMinor = chordSuffix.startsWith('m') && !chordSuffix.startsWith('maj')
  const isDim = chordSuffix.includes('dim') || chordSuffix.includes('m7b5')

  switch (semitones) {
    case 0:
      return isMinor ? 'i' : 'I'
    case 1:
      return '♭II'
    case 2:
      return isMinor ? 'ii' : 'II'
    case 3:
      return '♭III'
    case 4:
      return isMinor ? 'iii' : 'III'
    case 5:
      return isMinor ? 'iv' : 'IV'
    case 6:
      return '♭V'
    case 7:
      return isMinor ? 'v' : 'V'
    case 8:
      return '♭VI'
    case 9:
      return isMinor ? 'vi' : 'VI'
    case 10:
      return '♭VII'
    case 11:
      return isDim ? 'vii°' : 'VII'
    default:
      return null
  }
}

/**
 * Definición de una Progresión Armónica Predefinida
 */
export interface HarmonicProgression {
  id: string
  name: string
  degrees: string[]
  genre: 'Pop' | 'Jazz' | 'Rock' | 'Balada' | 'Clásica' | 'Latino'
  description: string
  cadenceNote?: string
}

/**
 * Catálogo maestro de progresiones armónicas populares
 */
export const POPULAR_PROGRESSIONS: HarmonicProgression[] = [
  {
    id: 'axis-pop',
    name: 'I - V - vi - IV (Eje Pop / Los 4 Acordes)',
    degrees: ['I', 'V', 'vi', 'IV'],
    genre: 'Pop',
    description: 'La progresión más exitosa del pop contemporáneo (Don\'t Stop Believin\', Let It Be, With Or Without You).',
    cadenceNote: 'Resolución abierta',
  },
  {
    id: 'melancholic-vi-iv-i-v',
    name: 'vi - IV - I - V (Pop Melancólico / Menor)',
    degrees: ['vi', 'IV', 'I', 'V'],
    genre: 'Pop',
    description: 'Sonido reflexivo y moderno centrado en la relativa menor (Faded, Someone Like You, Despacito).',
    cadenceNote: 'Semicadencia en V',
  },
  {
    id: 'jazz-ii-v-i',
    name: 'ii - V - I - I (Cadencia de Jazz Estándar)',
    degrees: ['ii', 'V', 'I', 'I'],
    genre: 'Jazz',
    description: 'La cadencia armónica por excelencia en jazz, bossa nova y neo-soul (Autumn Leaves, Blue Bossa).',
    cadenceNote: 'Cadencia Auténtica Perfecta',
  },
  {
    id: 'doo-wop-50s',
    name: 'I - vi - IV - V (Doo-Wop Años 50 / Balada)',
    degrees: ['I', 'vi', 'IV', 'V'],
    genre: 'Balada',
    description: 'La rueda armónica dorada del pop de los 50 y baladas nostálgicas (Stand By Me, Unchained Melody).',
    cadenceNote: 'Semicadencia circular',
  },
  {
    id: 'rock-i-iv-v',
    name: 'I - IV - V - IV (Rock & Roll Clásico)',
    degrees: ['I', 'IV', 'V', 'IV'],
    genre: 'Rock',
    description: 'Estructura directa y potente del rock, blues y folk (Wild Thing, Twist and Shout, La Bamba).',
    cadenceNote: 'Plagal pendular',
  },
  {
    id: 'classical-i-iv-v-i',
    name: 'I - IV - V - I (Resolución Auténtica Clásica)',
    degrees: ['I', 'IV', 'V', 'I'],
    genre: 'Clásica',
    description: 'La progresión fundamental de la armonía tonal con conclusión perfecta.',
    cadenceNote: 'Cadencia Auténtica Perfecta',
  },
  {
    id: 'andalusian-cadence',
    name: 'vi - V - IV - III (Cadencia Andaluza / Flamenco)',
    degrees: ['vi', 'V', 'IV', 'III'],
    genre: 'Latino',
    description: 'Descenso armónico tradicional en el folklore español y rock latino (Hit the Road Jack, Sultans of Swing).',
    cadenceNote: 'Cadencia Frigia / Flamenca',
  },
  {
    id: 'mixolydian-rock',
    name: 'I - ♭VII - IV - I (Rock Mixolidio Épico)',
    degrees: ['I', '♭VII', 'IV', 'I'],
    genre: 'Rock',
    description: 'Sonido himno del classic rock usando la séptima bemol (Sweet Home Alabama, Hey Jude, Fortunate Son).',
    cadenceNote: 'Resolución Mixolidia',
  },
  {
    id: 'plagal-turnaround',
    name: 'I - IV - I - V (Balada Folk / Acústica)',
    degrees: ['I', 'IV', 'I', 'V'],
    genre: 'Balada',
    description: 'Estructura rústica y abierta para estrofas y versos acústicos.',
    cadenceNote: 'Semicadencia',
  },
]

/**
 * Obtiene los acordes reales de una progresión para una tonalidad específica
 */
export function getProgressionChords(progressionId: string, key: string = 'C'): string[] {
  const prog = POPULAR_PROGRESSIONS.find((p) => p.id === progressionId)
  if (!prog) return []

  return prog.degrees.map((deg) => degreeToChord(deg, key))
}

/**
 * Información de una Cadencia Armónica
 */
export interface CadenceInfo {
  type: 'autentica' | 'plagal' | 'rota' | 'semicadencia' | 'frigia'
  label: string
  description: string
  colorBadge: string // Estilos Tailwind para el tag visual
}

/**
 * Analiza dos acordes consecutivos e identifica si forman una cadencia musical
 */
export function detectCadence(
  currentChord: string,
  previousChord: string,
  key: string = 'C'
): CadenceInfo | null {
  if (!currentChord || !previousChord) return null

  const prevDegree = chordToDegree(previousChord, key)
  const currDegree = chordToDegree(currentChord, key)

  if (!prevDegree || !currDegree) return null

  // 1. Cadencia Auténtica Perfecta (V -> I)
  if (
    (prevDegree === 'V' || prevDegree === 'V7' || prevDegree === 'vii°') &&
    (currDegree === 'I' || currDegree === 'i')
  ) {
    return {
      type: 'autentica',
      label: 'Cadencia Auténtica (V → I)',
      description: 'Resolución tonal perfecta de tensión a reposo absoluto.',
      colorBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    }
  }

  // 2. Cadencia Plagal (IV -> I) ("Amén")
  if (
    (prevDegree === 'IV' || prevDegree === 'iv') &&
    (currDegree === 'I' || currDegree === 'i')
  ) {
    return {
      type: 'plagal',
      label: 'Cadencia Plagal (IV → I)',
      description: 'Resolución dulce y suave (Cadencia del Amén).',
      colorBadge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
    }
  }

  // 3. Cadencia Rota / Deceptiva (V -> vi o V -> VI)
  if (
    (prevDegree === 'V' || prevDegree === 'V7') &&
    (currDegree === 'vi' || currDegree === 'VI' || currDegree === '♭VI')
  ) {
    return {
      type: 'rota',
      label: 'Cadencia Rota (V → vi)',
      description: 'Resolución sorpresiva hacia la relativa menor en lugar de la tónica.',
      colorBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    }
  }

  // 4. Semicadencia (Termina en V)
  if (
    currDegree === 'V' &&
    (prevDegree === 'I' || prevDegree === 'IV' || prevDegree === 'ii' || prevDegree === 'vi')
  ) {
    return {
      type: 'semicadencia',
      label: 'Semicadencia (→ V)',
      description: 'Reposo en la dominante que deja la frase en suspenso para continuar.',
      colorBadge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    }
  }

  // 5. Cadencia Frigia (♭VI -> V o iv -> V)
  if (
    (prevDegree === '♭VI' || prevDegree === 'iv') &&
    currDegree === 'V'
  ) {
    return {
      type: 'frigia',
      label: 'Cadencia Frigia (♭VI → V)',
      description: 'Resolución de carácter modal andaluz hacia la dominante.',
      colorBadge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    }
  }

  return null
}
