/**
 * Módulo de Teoría Armónica Avanzada para MusicChord
 * Gestión desacoplada de Progresiones de Acordes, Detección y Catálogo de Cadencias
 */

const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_NOTES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const FLAT_TO_SHARP: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#',
}

const FLAT_KEYS = ['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Dm', 'Gm', 'Cm', 'Fm', 'Bbm']

/**
 * Normaliza cualquier nota (ej: Db -> C#)
 */
export function normalizeNote(note: string): string {
  const trimmed = note.trim()
  return FLAT_TO_SHARP[trimmed] || trimmed
}

export function getNoteName(noteIndex: number, preferFlat: boolean = false): string {
  const norm = (noteIndex % 12 + 12) % 12
  return preferFlat ? FLAT_NOTES[norm] : SHARP_NOTES[norm]
}

const ROMAN_MAP: Record<string, number> = {
  i: 0,
  ii: 2,
  iii: 4,
  iv: 5,
  v: 7,
  vi: 9,
  vii: 11,
}

/**
 * Convierte un grado romano (incluyendo alteraciones, extensiones y dominantes secundarias)
 * a su acorde real en la tonalidad dada.
 * Ej: degreeToChord('vi', 'C') => 'Am'
 *     degreeToChord('V7', 'G') => 'D7'
 *     degreeToChord('♭VII', 'C') => 'Bb'
 *     degreeToChord('iiø7', 'C') => 'Dm7b5'
 *     degreeToChord('V7(b9)', 'C') => 'G7(b9)'
 *     degreeToChord('Imaj7', 'F') => 'Fmaj7'
 */
export function degreeToChord(degree: string, key: string = 'C'): string {
  if (!degree) return ''
  const trimmed = degree.trim()

  // Dominantes secundarias (ej: V7/vi, V7/bVI) excepto inversiones de tipo iv6
  if (trimmed.includes('/') && !trimmed.startsWith('iv6')) {
    const [num, denom] = trimmed.split('/')
    const denomLower = denom.toLowerCase().replace(/^[b♭#♯]/, '')
    if (ROMAN_MAP[denomLower] !== undefined) {
      const targetChord = degreeToChord(denom, key)
      const match = targetChord.match(/^([A-G][#b]?)/)
      if (match) {
        return degreeToChord(num, match[1])
      }
    }
  }

  const isMinorKey = key.endsWith('m') && !key.toLowerCase().endsWith('maj')
  const cleanKey = key.replace(/m$/i, '').trim()
  const keyIndex = SHARP_NOTES.indexOf(cleanKey) !== -1 ? SHARP_NOTES.indexOf(cleanKey) : FLAT_NOTES.indexOf(cleanKey)
  if (keyIndex === -1) return degree

  let accidental = 0
  let rest = trimmed
  let hasFlatAccidental = false

  if (rest.startsWith('♭') || rest.startsWith('b')) {
    accidental = -1
    hasFlatAccidental = true
    rest = rest.slice(1)
  } else if (rest.startsWith('♯') || rest.startsWith('#')) {
    accidental = 1
    rest = rest.slice(1)
  }

  const romanMatch = rest.match(/^(vii|vi|iv|v|iii|ii|i)/i)
  if (!romanMatch) return degree

  const romanRaw = romanMatch[0]
  const romanLower = romanRaw.toLowerCase()
  const baseSemitones = ROMAN_MAP[romanLower]
  if (baseSemitones === undefined) return degree

  const isLower = romanRaw === romanLower
  const suffix = rest.slice(romanRaw.length)

  const preferFlat = hasFlatAccidental || FLAT_KEYS.includes(key)
  const chordRootIndex = (keyIndex + baseSemitones + accidental + 12) % 12
  const chordRoot = getNoteName(chordRootIndex, preferFlat)

  // Extensiones explícitas
  if (suffix) {
    if (suffix === '7') {
      return `${chordRoot}${isLower ? 'm7' : '7'}`
    }
    if (suffix === 'maj7' || suffix === 'Δ7' || suffix === 'Maj7') {
      return `${chordRoot}maj7`
    }
    if (suffix === 'ø7' || suffix === 'm7b5' || suffix === 'm7♭5') {
      return `${chordRoot}m7b5`
    }
    if (suffix === 'dim7' || suffix === '°7' || suffix === 'o7') {
      return `${chordRoot}dim7`
    }
    if (suffix === 'dim' || suffix === '°' || suffix === 'o') {
      return `${chordRoot}dim`
    }
    if (suffix.startsWith('(b9)') || suffix === '7(b9)') {
      return `${chordRoot}7(b9)`
    }
    return `${chordRoot}${suffix}`
  }

  // Sensible disminuida
  if (romanLower === 'vii' && (trimmed.includes('°') || trimmed.includes('o'))) {
    return `${chordRoot}dim`
  }

  return `${chordRoot}${isLower ? 'm' : ''}`
}

/**
 * Obtiene el grado romano relativo de un acorde dado dentro de una tonalidad
 */
export function chordToDegree(chord: string, key: string = 'C'): string | null {
  if (!chord) return null

  // Remover bajo alternado (ej. D/F# -> D)
  const [mainChord] = chord.split('/')
  const match = mainChord.match(/^([A-G][#b]?)(.*)$/)
  if (!match) return null

  const chordRoot = normalizeNote(match[1])
  const chordSuffix = match[2] || ''

  const rootKey = normalizeNote(key.replace(/m$/i, '').trim())
  const keyIndex = SHARP_NOTES.indexOf(rootKey)
  const chordIndex = SHARP_NOTES.indexOf(chordRoot)

  if (keyIndex === -1 || chordIndex === -1) return null

  const semitones = (chordIndex - keyIndex + 12) % 12
  const isMinor = chordSuffix.startsWith('m') && !chordSuffix.startsWith('maj')
  const isDim = chordSuffix.includes('dim') || chordSuffix.includes('m7b5') || chordSuffix.includes('°')

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
 * Definición de una Progresión Armónica
 */
export interface HarmonicProgression {
  id: string
  name: string
  degrees: string[]
  genre: 'Pop' | 'Jazz' | 'Rock' | 'Gospel' | 'Balada' | 'Clásica' | 'Latino' | 'Modal' | 'Personalizada'
  description: string
  barsCount?: number
  isCustom?: boolean
  createdAt?: string
}

/**
 * Catálogo Maestro de Progresiones Armónicas (Mayor y Menor)
 */
export const POPULAR_PROGRESSIONS: HarmonicProgression[] = [
  // --- POP / WORSHIP ---
  {
    id: 'axis-pop',
    name: 'I - V - vi - IV (Eje Pop / Los 4 Acordes)',
    degrees: ['I', 'V', 'vi', 'IV'],
    genre: 'Pop',
    description: 'La progresión más exitosa del pop y worship contemporáneo (Don\'t Stop Believin\', Let It Be, With Or Without You).',
    barsCount: 4,
  },
  {
    id: 'worship-vi-iv-i-v',
    name: 'vi - IV - I - V (Pop Melancólico / Worship)',
    degrees: ['vi', 'IV', 'I', 'V'],
    genre: 'Pop',
    description: 'Sonido reflexivo centrado en la relativa menor (Someone Like You, Despacito, Oceans).',
    barsCount: 4,
  },
  {
    id: 'pop-i-iv-vi-v',
    name: 'I - IV - vi - V (Pop Energético / Himno)',
    degrees: ['I', 'IV', 'vi', 'V'],
    genre: 'Pop',
    description: 'Flujo positivo y ascendente utilizado en estrofas y pre-coros dinámicos.',
    barsCount: 4,
  },
  {
    id: 'royal-road',
    name: 'IV - V - iii - vi (Royal Road / Pop Contemporáneo)',
    degrees: ['IV', 'V', 'iii', 'vi'],
    genre: 'Pop',
    description: 'La famosísima progresión de la música japonesa y pop internacional con resolución en vi.',
    barsCount: 4,
  },
  {
    id: '50s-doo-wop',
    name: 'I - vi - IV - V (Doo-Wop Años 50 / Balada)',
    degrees: ['I', 'vi', 'IV', 'V'],
    genre: 'Balada',
    description: 'La rueda armónica dorada del pop de los 50 y baladas nostálgicas (Stand By Me, Unchained Melody).',
    barsCount: 4,
  },

  // --- JAZZ / BOSSA / STANDARD ---
  {
    id: 'jazz-ii-v-i',
    name: 'ii7 - V7 - Imaj7 (Cadencia de Jazz Estándar)',
    degrees: ['ii7', 'V7', 'Imaj7', 'Imaj7'],
    genre: 'Jazz',
    description: 'La cadencia armónica por excelencia en jazz, bossa nova y neo-soul (Autumn Leaves, Blue Bossa).',
    barsCount: 4,
  },
  {
    id: 'jazz-turnaround-1',
    name: 'Imaj7 - vi7 - ii7 - V7 (Turnaround de Jazz I - vi - ii - V)',
    degrees: ['Imaj7', 'vi7', 'ii7', 'V7'],
    genre: 'Jazz',
    description: 'Turnaround cíclico estándar para enlazar coros y solos.',
    barsCount: 4,
  },
  {
    id: 'jazz-turnaround-2',
    name: 'iii7 - vi7 - ii7 - V7 (Turnaround iii - vi - ii - V)',
    degrees: ['iii7', 'vi7', 'ii7', 'V7'],
    genre: 'Jazz',
    description: 'Descenso suave por quintas secundarias hacia la dominante.',
    barsCount: 4,
  },
  {
    id: 'jazz-minor-ii-v-i',
    name: 'iiø7 - V7(b9) - i (ii - V - i Menor Bossa / Jazz)',
    degrees: ['iiø7', 'V7(b9)', 'i', 'i'],
    genre: 'Jazz',
    description: 'Cadencia fundamental en tonalidad menor con dominante con novena bemol.',
    barsCount: 4,
  },
  {
    id: 'coltrane-changes-basic',
    name: 'Imaj7 - V7/♭VI - ♭VImaj7 - V7 (Coltrane Changes Básicas)',
    degrees: ['Imaj7', 'V7/♭VI', '♭VImaj7', 'V7'],
    genre: 'Jazz',
    description: 'Modulación por terceras mayores inspirada en Giant Steps.',
    barsCount: 4,
  },

  // --- ROCK / MODAL / FUNK ---
  {
    id: 'rock-mixolydian',
    name: 'I - ♭VII - IV - I (Rock Mixolidio Épico)',
    degrees: ['I', '♭VII', 'IV', 'I'],
    genre: 'Rock',
    description: 'Sonido himno del classic rock usando la séptima bemol (Sweet Home Alabama, Hey Jude, Fortunate Son).',
    barsCount: 4,
  },
  {
    id: 'andalusian-flamenco',
    name: 'i - ♭VII - ♭VI - V7 (Cadencia Andaluza / Flamenco)',
    degrees: ['i', '♭VII', '♭VI', 'V7'],
    genre: 'Latino',
    description: 'Descenso armónico tradicional en el folklore español y rock latino (Hit the Road Jack, Sultans of Swing).',
    barsCount: 4,
  },
  {
    id: 'blues-minor',
    name: 'i - iv - v - i (Blues Menor / Modal)',
    degrees: ['i', 'iv', 'v', 'i'],
    genre: 'Rock',
    description: 'Estructura modal sobria y profunda para blues, funk y rock alternativo.',
    barsCount: 4,
  },
  {
    id: 'folk-classic-rock',
    name: 'I - IV - I - V (Folk / Rock Clásico)',
    degrees: ['I', 'IV', 'I', 'V'],
    genre: 'Rock',
    description: 'Estructura rústica y abierta para versos acústicos y country rock.',
    barsCount: 4,
  },

  // --- GOSPEL / NEO-SOUL ---
  {
    id: 'gospel-minor-iv',
    name: 'I - I7 - IV - iv (Gospel / Cuarto Menor Emotivo)',
    degrees: ['I', 'I7', 'IV', 'iv'],
    genre: 'Gospel',
    description: 'Progresión gospel conmovedora con el clásico préstamo modal del iv menor.',
    barsCount: 4,
  },
  {
    id: 'neo-soul-descending',
    name: 'IVmaj7 - iii7 - ii7 - Imaj7 (Neo-Soul Descenso Suave)',
    degrees: ['IVmaj7', 'iii7', 'ii7', 'Imaj7'],
    genre: 'Gospel',
    description: 'Paseo diatónico descendente característico de Stevie Wonder, D\'Angelo y R&B contemporáneo.',
    barsCount: 4,
  },
  {
    id: 'gospel-turnaround',
    name: 'ii - iii - IV - V (Gospel Ascenso Épico)',
    degrees: ['ii', 'iii', 'IV', 'V'],
    genre: 'Gospel',
    description: 'Escalada cromática/diatónica de gran fuerza vocal que desemboca en la dominante.',
    barsCount: 4,
  },
]

/**
 * Obtiene los acordes reales de una progresión para una tonalidad específica
 */
export function getProgressionChords(
  progression: HarmonicProgression | string,
  key: string = 'C'
): string[] {
  let degrees: string[] = []

  if (typeof progression === 'string') {
    const found = POPULAR_PROGRESSIONS.find((p) => p.id === progression)
    if (found) degrees = found.degrees
    else degrees = progression.split(/[\s,-]+/).filter(Boolean)
  } else if (progression && Array.isArray(progression.degrees)) {
    degrees = progression.degrees
  }

  return degrees.map((deg) => degreeToChord(deg, key))
}

/**
 * Definición de una Cadencia Armónica
 */
export interface CadenceDefinition {
  id: string
  type: string
  name: string
  degrees: string
  description: string
  colorBadge: string // Estilos Tailwind para el badge
  genre?: string
  isCustom?: boolean
  createdAt?: string
  chordDegrees?: string[] // Fórmulas explícitas de grados armónicos (ej. ['IV', 'I'], ['V', 'I'], ['V'])
}

/**
 * Catálogo Maestro de Cadencias Predefinidas
 */
export const PRESET_CADENCES: CadenceDefinition[] = [
  {
    id: 'cad-pac',
    type: 'autentica-pac',
    name: 'Cadencia Auténtica Perfecta (PAC)',
    degrees: 'V → I',
    description: 'Resolución conclusiva máxima de tensión dominante a tónica en estado fundamental.',
    colorBadge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    chordDegrees: ['V', 'I'],
  },
  {
    id: 'cad-iac',
    type: 'autentica-iac',
    name: 'Cadencia Auténtica Imperfecta (IAC)',
    degrees: 'V → I',
    description: 'Resolución de dominante donde uno de los acordes está invertido o soprano no reposa en tónica.',
    colorBadge: 'bg-teal-100 text-teal-800 dark:bg-teal-950/80 dark:text-teal-300 border-teal-300 dark:border-teal-800',
    chordDegrees: ['V', 'I'],
  },
  {
    id: 'cad-plagal',
    type: 'plagal',
    name: 'Cadencia Plagal ("Amén")',
    degrees: 'IV → I',
    description: 'Resolución suave y solemne de la subdominante a la tónica, popular en himnos y baladas pop.',
    colorBadge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800',
    chordDegrees: ['IV', 'I'],
  },
  {
    id: 'cad-rota',
    type: 'rota',
    name: 'Cadencia Rota / Deceptiva',
    degrees: 'V → vi',
    description: 'Resolución sorpresiva donde la dominante evade la tónica y reposa en la relativa menor.',
    colorBadge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    chordDegrees: ['V', 'vi'],
  },
  {
    id: 'cad-semicadencia',
    type: 'semicadencia',
    name: 'Semicadencia (Reposo en V)',
    degrees: 'V',
    description: 'Pausa respiratoria sobre la dominante que deja la frase abierta esperando respuesta.',
    colorBadge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800',
    chordDegrees: ['V'],
  },
  {
    id: 'cad-frigia',
    type: 'frigia',
    name: 'Cadencia Frigia (Andaluza)',
    degrees: 'iv → V',
    description: 'Típica del modo menor y música española, con movimiento descendente de semitono al V.',
    colorBadge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    chordDegrees: ['iv', 'V'],
  },
  {
    id: 'cad-picardia',
    type: 'picardia',
    name: 'Cadencia Picardía (Tercera de Picardía)',
    degrees: 'iv → I',
    description: 'Finalización luminosa en acorde Mayor dentro de una obra o sección en tonalidad menor.',
    colorBadge: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/80 dark:text-fuchsia-300 border-fuchsia-300 dark:border-fuchsia-800',
    chordDegrees: ['iv', 'I'],
  },
  {
    id: 'cad-backdoor',
    type: 'backdoor',
    name: 'Cadencia Backdoor (Jazz/Soul)',
    degrees: '♭VII7 → I',
    description: 'Sustitución modal elegante del jazz y soul que resuelve suavemente desde el ♭VII dominante.',
    colorBadge: 'bg-violet-100 text-violet-800 dark:bg-violet-950/80 dark:text-violet-300 border-violet-300 dark:border-violet-800',
    chordDegrees: ['♭VII7', 'I'],
  },
]

/**
 * Obtiene la lista de acordes reales calculados para una tonalidad a partir de una cadencia
 */
export function getCadenceChords(
  cadence: CadenceDefinition | string,
  key: string = 'C'
): string[] {
  let degrees: string[] = []

  let cadDef: CadenceDefinition | undefined
  if (typeof cadence === 'string') {
    cadDef = PRESET_CADENCES.find((c) => c.id === cadence || c.type === cadence)
  } else {
    cadDef = cadence
  }

  if (cadDef?.chordDegrees && cadDef.chordDegrees.length > 0) {
    degrees = cadDef.chordDegrees
  } else if (cadDef) {
    switch (cadDef.type) {
      case 'autentica-pac':
      case 'autentica-iac':
        degrees = ['V', 'I']
        break
      case 'plagal':
        degrees = ['IV', 'I']
        break
      case 'rota':
        degrees = ['V', 'vi']
        break
      case 'semicadencia':
        degrees = ['V']
        break
      case 'frigia':
        degrees = ['iv', 'V']
        break
      case 'picardia':
        degrees = ['iv', 'I']
        break
      case 'backdoor':
        degrees = ['♭VII7', 'I']
        break
      default:
        degrees = cadDef.degrees
          .replace(/→/g, ' ')
          .replace(/->/g, ' ')
          .replace(/-/g, ' ')
          .replace(/,/g, ' ')
          .split(/\s+/)
          .filter(Boolean)
          .filter((d) => !d.includes('(') && !d.includes(')'))
        if (degrees.length === 0) degrees = ['V', 'I']
    }
  } else if (typeof cadence === 'string') {
    degrees = cadence
      .replace(/→/g, ' ')
      .replace(/->/g, ' ')
      .replace(/-/g, ' ')
      .replace(/,/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
  }

  return degrees.map((deg) => degreeToChord(deg, key))
}

/**
 * Analiza dos acordes consecutivos e identifica automáticamente la cadencia
 */
export function detectCadence(
  currentChord: string,
  previousChord: string,
  key: string = 'C'
): CadenceDefinition | null {
  if (!currentChord || !previousChord) return null

  const prevDegree = chordToDegree(previousChord, key)
  const currDegree = chordToDegree(currentChord, key)

  if (!prevDegree || !currDegree) return null

  const isMinorKey = key.endsWith('m') && !key.toLowerCase().endsWith('maj')

  // 1. Cadencia Backdoor (♭VII -> I)
  if (
    (prevDegree === '♭VII' || prevDegree === 'bVII') &&
    (currDegree === 'I' || currDegree === 'i')
  ) {
    return PRESET_CADENCES.find((c) => c.type === 'backdoor') || null
  }

  // 2. Tercera de Picardía (en tonalidad menor, resolución a I mayor)
  if (
    isMinorKey &&
    (prevDegree === 'V' || prevDegree === 'v') &&
    currDegree === 'I'
  ) {
    return PRESET_CADENCES.find((c) => c.type === 'picardia') || null
  }

  // 3. Cadencia Frigia (♭VI -> V o iv -> V)
  if (
    (prevDegree === '♭VI' || prevDegree === 'bVI' || prevDegree === 'iv') &&
    currDegree === 'V'
  ) {
    return PRESET_CADENCES.find((c) => c.type === 'frigia') || null
  }

  // 4. Cadencia Auténtica (V -> I o vii° -> I)
  if (
    (prevDegree === 'V' || prevDegree === 'v' || prevDegree === 'vii°') &&
    (currDegree === 'I' || currDegree === 'i')
  ) {
    return PRESET_CADENCES.find((c) => c.type === 'autentica-pac') || null
  }

  // 5. Cadencia Plagal (IV -> I o iv -> I)
  if (
    (prevDegree === 'IV' || prevDegree === 'iv') &&
    (currDegree === 'I' || currDegree === 'i')
  ) {
    return PRESET_CADENCES.find((c) => c.type === 'plagal') || null
  }

  // 6. Cadencia Rota (V -> vi o V -> ♭VI)
  if (
    (prevDegree === 'V' || prevDegree === 'v') &&
    (currDegree === 'vi' || currDegree === 'VI' || currDegree === '♭VI' || currDegree === 'bVI')
  ) {
    return PRESET_CADENCES.find((c) => c.type === 'rota') || null
  }

  // 7. Semicadencia (Cualquier grado que reposa en V)
  if (
    currDegree === 'V' &&
    (prevDegree === 'I' || prevDegree === 'IV' || prevDegree === 'ii' || prevDegree === 'vi')
  ) {
    return PRESET_CADENCES.find((c) => c.type === 'semicadencia') || null
  }

  return null
}
