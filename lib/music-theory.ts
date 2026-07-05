// Teoría musical para acordes diatónicos

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Intervalos de escala mayor (en semitonos)
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11]

// Calidad de acordes por grado en escala mayor
// I, ii, iii, IV, V, vi, vii°
const MAJOR_SCALE_CHORD_QUALITIES = ['', 'm', 'm', '', '', 'm', 'dim']

export interface DiatonicChords {
  inKey: Array<{ root: string; type: string; degree: string }>
  outOfKey: Array<{ root: string; type: string }>
}

export function getDiatonicChords(key: string): DiatonicChords {
  const keyIndex = NOTES.indexOf(key)
  if (keyIndex === -1) return { inKey: [], outOfKey: [] }

  // Calcular notas de la escala
  const scaleNotes = MAJOR_SCALE_INTERVALS.map(interval => {
    return NOTES[(keyIndex + interval) % 12]
  })

  // Acordes diatónicos con sus grados
  const degrees = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°']
  const inKey = scaleNotes.map((note, index) => ({
    root: note,
    type: MAJOR_SCALE_CHORD_QUALITIES[index],
    degree: degrees[index],
  }))

  // Acordes fuera de la tonalidad
  const inKeyRoots = new Set(scaleNotes)
  const outOfKey = NOTES
    .filter(note => !inKeyRoots.has(note))
    .flatMap(note => [
      { root: note, type: '' },
      { root: note, type: 'm' },
    ])

  return { inKey, outOfKey }
}

export function isChordInKey(chordRoot: string, chordType: string, key: string): boolean {
  const { inKey } = getDiatonicChords(key)
  
  // Normalizar el tipo de acorde para comparación
  // Extraer la calidad básica (mayor, menor, dim) sin las extensiones
  let baseType = ''
  
  if (chordType.startsWith('m') && !chordType.startsWith('maj')) {
    baseType = 'm'
  } else if (chordType.includes('dim')) {
    baseType = 'dim'
  } else if (chordType.includes('aug')) {
    baseType = 'aug'
  } else {
    // Es mayor (puede tener maj7, 7, 9, etc.)
    baseType = ''
  }
  
  // Verificar si la raíz y la calidad básica están en la tonalidad
  return inKey.some(chord => chord.root === chordRoot && chord.type === baseType)
}

// Obtener el grado de un acorde en una tonalidad
export function getChordDegree(chordRoot: string, chordType: string, key: string): string | null {
  const keyIndex = NOTES.indexOf(key)
  const chordIndex = NOTES.indexOf(chordRoot)
  
  if (keyIndex === -1 || chordIndex === -1) return null

  // Calcular la distancia en semitonos desde la tónica
  const distance = (chordIndex - keyIndex + 12) % 12

  // Mapear semitonos a grados
  const degreeMap: Record<number, string> = {
    0: 'I',    // Tónica
    1: '♭II',  // Napolitano
    2: 'II',   // Supertónica
    3: '♭III', // Mediante bemol
    4: 'III',  // Mediante
    5: 'IV',   // Subdominante
    6: '♭V',   // Subdominante aumentada / Tritono
    7: 'V',    // Dominante
    8: '♭VI',  // Submediante bemol
    9: 'VI',   // Submediante
    10: '♭VII',// Subtónica
    11: 'VII', // Sensible
  }

  let degree = degreeMap[distance] || '?'

  // Ajustar según el tipo de acorde
  if (chordType === 'm' || chordType.startsWith('m')) {
    degree = degree.toLowerCase()
  } else if (chordType === 'dim' || chordType.includes('dim')) {
    degree = degree.toLowerCase() + '°'
  } else if (chordType === 'aug' || chordType.includes('aug')) {
    degree = degree + '+'
  }

  return degree
}

// Obtener todos los tipos de acordes organizados
export function getAllChordTypes() {
  return [
    { value: '', label: 'Mayor', category: 'basic' },
    { value: 'm', label: 'Menor', category: 'basic' },
    { value: '7', label: '7', category: 'seventh' },
    { value: 'maj7', label: 'Maj7', category: 'seventh' },
    { value: 'm7', label: 'm7', category: 'seventh' },
    { value: 'sus4', label: 'sus4', category: 'suspended' },
    { value: 'sus2', label: 'sus2', category: 'suspended' },
    { value: 'dim', label: 'dim', category: 'altered' },
    { value: 'aug', label: 'aug', category: 'altered' },
    { value: '6', label: '6', category: 'extended' },
    { value: '9', label: '9', category: 'extended' },
    { value: 'add9', label: 'add9', category: 'extended' },
  ]
}
