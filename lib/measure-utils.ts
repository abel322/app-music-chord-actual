import { Measure, ChordBeat, SectionMeasures, BeatAccent } from '@/types/measure'
import { transposeChord } from '@/lib/transpose'
import { CadenceDefinition, getCadenceChords } from '@/lib/harmonic-theory'

/**
 * Analiza un compás musical y devuelve la cantidad de tiempos (pulsos)
 */
export function getBeatsPerMeasure(timeSignature: string = '4/4'): number {
  const parts = timeSignature.split('/')
  const numerator = parseInt(parts[0], 10)
  const denominator = parseInt(parts[1], 10) || 4
  if (isNaN(numerator) || numerator <= 0) return 4

  // Compases compuestos con denominador 8:
  // 6/8: 2 pulsos compuestos (o 6 corcheas agrupadas en 2 pulsos con puntillo)
  // 9/8: 3 pulsos compuestos
  // 12/8: 4 pulsos compuestos (/ / / / con subdivisión ternaria)
  if (denominator === 8) {
    if (numerator === 6) return 2
    if (numerator === 9) return 3
    if (numerator === 12) return 4
  }

  return numerator
}

/**
 * Crea un compás inicial vacío o con acorde inicial
 */
export function createDefaultMeasure(
  measureNumber: number,
  timeSignature: string = '4/4',
  defaultChord: string = ''
): Measure {
  const beats: ChordBeat[] = []
  if (defaultChord) {
    beats.push({
      id: `beat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      beat: 1,
      chord: defaultChord,
      accent: 'normal',
      duration: getBeatsPerMeasure(timeSignature),
    })
  }

  return {
    id: `measure-${Date.now()}-${measureNumber}-${Math.random().toString(36).slice(2, 6)}`,
    measureNumber,
    timeSignature,
    division: 'whole',
    slots: [
      {
        index: 0,
        label: 'Todo el Compás',
        chord: defaultChord || null,
      },
    ],
    beats,
  }
}

/**
 * Genera una secuencia de compases (ej: 4, 8, 12, 16)
 */
export function generateMeasures(
  count: number,
  startingNumber: number = 1,
  timeSignature: string = '4/4',
  chordsPattern: string[] = []
): Measure[] {
  const measures: Measure[] = []
  for (let i = 0; i < count; i++) {
    const num = startingNumber + i
    const chord = chordsPattern.length > 0 ? chordsPattern[i % chordsPattern.length] : ''
    measures.push(createDefaultMeasure(num, timeSignature, chord))
  }
  return measures
}

/**
 * Duplica un compás existente insertándolo inmediatamente después
 */
export function duplicateMeasure(measures: Measure[], measureId: string): Measure[] {
  const index = measures.findIndex((m) => m.id === measureId)
  if (index === -1) return measures

  const target = measures[index]
  const duplicated: Measure = {
    ...target,
    id: `m-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    division: target.division,
    slots: target.slots ? target.slots.map((s) => ({ ...s })) : undefined,
    subdivision: target.subdivision,
    subdivisionGrouping: target.subdivisionGrouping,
    cadence: target.cadence,
    cadenceLabel: target.cadenceLabel,
    cadenceColor: target.cadenceColor,
    beats: target.beats.map((b) => ({
      ...b,
      id: `b-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      subSlots: b.subSlots
        ? b.subSlots.map((s) => ({
            ...s,
            id: `s-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          }))
        : undefined,
    })),
  }

  const updated = [...measures]
  updated.splice(index + 1, 0, duplicated)

  // Renumerar compases
  return updated.map((m, idx) => ({ ...m, measureNumber: idx + 1 }))
}

/**
 * Aplica una lista de acordes provenientes de una progresión a una lista de compases
 */
export function applyProgressionToMeasures(
  measures: Measure[],
  progressionChords: string[],
  timeSignature: string = '4/4'
): Measure[] {
  if (progressionChords.length === 0) return measures

  const beatsCount = getBeatsPerMeasure(timeSignature)
  const result: Measure[] = []

  // Si hay menos compases que acordes en la progresión, expandir compases
  const targetCount = Math.max(measures.length, progressionChords.length)

  for (let i = 0; i < targetCount; i++) {
    const existing = measures[i]
    const chord = progressionChords[i % progressionChords.length]

    const newMeasure: Measure = {
      id: existing ? existing.id : `m-prog-${Date.now()}-${i}`,
      measureNumber: i + 1,
      timeSignature: existing?.timeSignature || timeSignature,
      repeatStart: existing?.repeatStart,
      repeatEnd: existing?.repeatEnd,
      repeatCount: existing?.repeatCount,
      volta: existing?.volta,
      cadence: existing?.cadence,
      cadenceLabel: existing?.cadenceLabel,
      cadenceColor: existing?.cadenceColor,
      guideLyric: existing?.guideLyric || '',
      division: 'whole',
      slots: [
        {
          index: 0,
          label: 'Todo el Compás',
          chord,
        },
      ],
      beats: [
        {
          id: `b-${Date.now()}-${i}`,
          beat: 1,
          chord,
          accent: 'normal',
          duration: beatsCount,
        },
      ],
    }

    result.push(newMeasure)
  }

  return result
}

/**
 * Aplica una progresión de acordes a partir de un compás específico,
 * rellenando compases subsiguientes y preservando compases anteriores y posteriores.
 */
export function applyProgressionFromMeasure(
  measures: Measure[],
  startMeasureId: string,
  progressionChords: string[],
  timeSignature: string = '4/4'
): Measure[] {
  if (!progressionChords || progressionChords.length === 0) return measures

  const startIndex = measures.findIndex((m) => m.id === startMeasureId)
  if (startIndex === -1) {
    return applyProgressionToMeasures(measures, progressionChords, timeSignature)
  }

  const beatsCount = getBeatsPerMeasure(timeSignature)
  const updated = [...measures]

  for (let i = 0; i < progressionChords.length; i++) {
    const targetIdx = startIndex + i
    const chord = progressionChords[i]

    if (targetIdx < updated.length) {
      // Reemplazar acorde en el compás existente
      updated[targetIdx] = {
        ...updated[targetIdx],
        division: 'whole',
        slots: [
          {
            index: 0,
            label: 'Todo el Compás',
            chord,
          },
        ],
        beats: [
          {
            id: `beat-prog-${Date.now()}-${i}`,
            beat: 1,
            chord,
            accent: 'normal',
            duration: beatsCount,
          },
        ],
      }
    } else {
      // Si la progresión excede la cantidad de compases, agregar nuevo compás
      const newM = createDefaultMeasure(targetIdx + 1, timeSignature, chord)
      updated.push(newM)
    }
  }

  // Renumerar compases
  return updated.map((m, idx) => ({ ...m, measureNumber: idx + 1 }))
}

/**
 * Asigna un único acorde que llena todo el compás (división whole)
 */
function setMeasureWholeChord(measure: Measure, chord: string, timeSignature: string): Measure {
  const beatsCount = getBeatsPerMeasure(measure.timeSignature || timeSignature)
  return {
    ...measure,
    division: 'whole',
    slots: [
      {
        index: 0,
        label: 'Todo el Compás',
        chord,
      },
    ],
    beats: [
      {
        id: `b-${Date.now()}-${measure.measureNumber}-${Math.random().toString(36).slice(2, 6)}`,
        beat: 1,
        chord,
        accent: 'normal',
        duration: beatsCount,
      },
    ],
  }
}

/**
 * Divide un compás en dos mitades (división half) con dos acordes
 */
function splitMeasureIntoTwoChords(
  measure: Measure,
  chord1: string,
  chord2: string,
  timeSignature: string
): Measure {
  const beatsCount = getBeatsPerMeasure(measure.timeSignature || timeSignature)
  const midBeat = Math.ceil(beatsCount / 2) + 1
  return {
    ...measure,
    division: 'half',
    slots: [
      {
        index: 0,
        label: 'T. 1-2',
        chord: chord1,
      },
      {
        index: 1,
        label: 'T. 3-4',
        chord: chord2,
      },
    ],
    beats: [
      {
        id: `b-${Date.now()}-1-${Math.random().toString(36).slice(2, 6)}`,
        beat: 1,
        chord: chord1,
        accent: 'normal',
        duration: Math.floor(beatsCount / 2),
      },
      {
        id: `b-${Date.now()}-2-${Math.random().toString(36).slice(2, 6)}`,
        beat: midBeat,
        chord: chord2,
        accent: 'normal',
        duration: Math.floor(beatsCount / 2),
      },
    ],
  }
}

/**
 * Aplica una cadencia armónica al final de una sección de compases, inyectando los acordes
 * correspondientes según la tonalidad en los compases finales.
 * - Si la cadencia tiene 2 acordes (ej. IV -> I, V -> I, V -> vi, ♭VII7 -> I):
 *   - Si hay 2 o más compases: penúltimo compás recibe el acorde de tensión, y el último compás recibe el acorde de resolución y el badge.
 *   - Si hay solo 1 compás: divide el compás en 2 mitades (mitad 1 = tensión, mitad 2 = resolución) y coloca el badge.
 * - Si la cadencia tiene 1 acorde (ej. Semicadencia sobre V):
 *   - El último compás recibe el acorde de reposo V y el badge.
 * - Si cad es null: elimina la cadencia del último compás.
 */
export function applyCadenceToSectionMeasures(
  measures: Measure[],
  cadence: CadenceDefinition | null,
  key: string = 'C',
  timeSignature: string = '4/4'
): Measure[] {
  if (measures.length === 0) return measures

  // Quitar / desmarcar cadencia
  if (!cadence) {
    return measures.map((m) => ({
      ...m,
      cadence: undefined,
      cadenceLabel: undefined,
      cadenceColor: undefined,
    }))
  }

  const cadenceChords = getCadenceChords(cadence, key)
  if (cadenceChords.length === 0) return measures

  const updated: Measure[] = measures.map((m) => ({
    ...m,
    cadence: undefined,
    cadenceLabel: undefined,
    cadenceColor: undefined,
  }))

  const lastIdx = updated.length - 1

  if (cadenceChords.length === 1) {
    // Semicadencia (1 acorde de reposo en el último compás)
    const chord = cadenceChords[0]
    updated[lastIdx] = {
      ...setMeasureWholeChord(updated[lastIdx], chord, timeSignature),
      cadence: cadence.id || cadence.type,
      cadenceLabel: `${cadence.name} (${cadence.degrees})`,
      cadenceColor: cadence.colorBadge,
    }
  } else {
    // Cadencias de 2 acordes (tensión -> resolución)
    const c1 = cadenceChords[cadenceChords.length - 2]
    const c2 = cadenceChords[cadenceChords.length - 1]

    if (updated.length >= 2) {
      const penultIdx = lastIdx - 1
      // Penúltimo compás: acorde de tensión/acercamiento (ej. IV o V)
      updated[penultIdx] = setMeasureWholeChord(updated[penultIdx], c1, timeSignature)

      // Último compás: acorde de resolución (ej. I) con badge de cadencia
      updated[lastIdx] = {
        ...setMeasureWholeChord(updated[lastIdx], c2, timeSignature),
        cadence: cadence.id || cadence.type,
        cadenceLabel: `${cadence.name} (${cadence.degrees})`,
        cadenceColor: cadence.colorBadge,
      }
    } else {
      // Si la sección solo tiene 1 compás, dividir en 2 tiempos/mitades
      updated[lastIdx] = {
        ...splitMeasureIntoTwoChords(updated[lastIdx], c1, c2, timeSignature),
        cadence: cadence.id || cadence.type,
        cadenceLabel: `${cadence.name} (${cadence.degrees})`,
        cadenceColor: cadence.colorBadge,
      }
    }
  }

  return updated
}

/**
 * Aplica una cadencia armónica a un compás específico dentro de una lista de compases.
 * - Si la cadencia tiene 2 acordes (ej. IV -> I):
 *   - Si el compás ya está dividido en 2 mitades o más: asigna chord 1 y chord 2 en ese compás.
 *   - Si el compás es whole y le sigue otro compás: asigna tensión en el actual y resolución en el siguiente.
 *   - Si es el último compás: divide en 2 mitades con ambos acordes.
 * - Si la cadencia tiene 1 acorde (ej. Semicadencia): asigna V en el compás actual.
 */
export function applyCadenceToMeasure(
  measures: Measure[],
  targetMeasureId: string,
  cadence: CadenceDefinition | null,
  key: string = 'C',
  timeSignature: string = '4/4'
): { updatedMeasures: Measure[]; targetUpdatedMeasure: Measure } {
  const targetIdx = measures.findIndex((m) => m.id === targetMeasureId)
  if (targetIdx === -1) {
    return { updatedMeasures: measures, targetUpdatedMeasure: measures[0] }
  }

  // Quitar cadencia
  if (!cadence) {
    const clearedMeasure: Measure = {
      ...measures[targetIdx],
      cadence: undefined,
      cadenceLabel: undefined,
      cadenceColor: undefined,
    }
    const updatedMeasures = measures.map((m, i) => (i === targetIdx ? clearedMeasure : m))
    return { updatedMeasures, targetUpdatedMeasure: clearedMeasure }
  }

  const cadenceChords = getCadenceChords(cadence, key)
  const updated = [...measures]
  const currentM = updated[targetIdx]
  const isLastMeasure = targetIdx === updated.length - 1

  if (cadenceChords.length === 1) {
    // Semicadencia (reposo en V en el compás actual)
    const chord = cadenceChords[0]
    const updatedM = {
      ...setMeasureWholeChord(currentM, chord, timeSignature),
      cadence: cadence.id || cadence.type,
      cadenceLabel: `${cadence.name} (${cadence.degrees})`,
      cadenceColor: cadence.colorBadge,
    }
    updated[targetIdx] = updatedM
    return { updatedMeasures: updated, targetUpdatedMeasure: updatedM }
  } else {
    // Cadencia de 2 acordes
    const c1 = cadenceChords[cadenceChords.length - 2]
    const c2 = cadenceChords[cadenceChords.length - 1]

    // Si el compás ya tiene 2 slots o es el último compás de la sección
    if (currentM.division === 'half' || (currentM.slots && currentM.slots.length === 2) || isLastMeasure) {
      const updatedM = {
        ...splitMeasureIntoTwoChords(currentM, c1, c2, timeSignature),
        cadence: cadence.id || cadence.type,
        cadenceLabel: `${cadence.name} (${cadence.degrees})`,
        cadenceColor: cadence.colorBadge,
      }
      updated[targetIdx] = updatedM
      return { updatedMeasures: updated, targetUpdatedMeasure: updatedM }
    } else {
      // Si el compás es whole y le sigue otro compás (targetIdx < measures.length - 1)
      const nextIdx = targetIdx + 1
      // Compás actual recibe tensión c1
      const updatedCurrent = setMeasureWholeChord(currentM, c1, timeSignature)
      // Compás siguiente recibe resolución c2 y el badge de cadencia
      const updatedNext = {
        ...setMeasureWholeChord(updated[nextIdx], c2, timeSignature),
        cadence: cadence.id || cadence.type,
        cadenceLabel: `${cadence.name} (${cadence.degrees})`,
        cadenceColor: cadence.colorBadge,
      }
      updated[targetIdx] = updatedCurrent
      updated[nextIdx] = updatedNext
      return { updatedMeasures: updated, targetUpdatedMeasure: updatedCurrent }
    }
  }
}

/**
 * Transpone todos los acordes de una lista de compases por N semitonos
 */
export function transposeMeasures(measures: Measure[], semitones: number): Measure[] {
  if (semitones === 0) return measures

  return measures.map((m) => ({
    ...m,
    slots: m.slots
      ? m.slots.map((s) => ({
          ...s,
          chord: s.chord && s.chord !== '%' ? transposeChord(s.chord, semitones) : s.chord,
        }))
      : undefined,
    beats: m.beats.map((b) => ({
      ...b,
      chord: transposeChord(b.chord, semitones),
      subSlots: b.subSlots
        ? b.subSlots.map((s) => ({
            ...s,
            chord: s.chord ? transposeChord(s.chord, semitones) : '',
          }))
        : undefined,
    })),
  }))
}

/**
 * Transpone todas las secciones de compases
 */
export function transposeSectionMeasures(sections: SectionMeasures[], semitones: number): SectionMeasures[] {
  if (semitones === 0) return sections

  return sections.map((sec) => ({
    ...sec,
    measures: transposeMeasures(sec.measures, semitones),
  }))
}

/**
 * Convierte secciones tradicionales/legadas a la estructura moderna de compases
 */
export function ensureSectionMeasures(
  rawSection: any,
  sectionIndex: number = 0,
  defaultTimeSignature: string = '4/4',
  globalMeasureCounter: { current: number } = { current: 1 }
): SectionMeasures {
  const timeSignature = rawSection.timeSignature || defaultTimeSignature

  // Si ya tiene compases definidos, normalizar numeración
  if (Array.isArray(rawSection.measures) && rawSection.measures.length > 0) {
    const normalizedMeasures: Measure[] = rawSection.measures.map((m: any, mIdx: number) => {
      const num = m.measureNumber || globalMeasureCounter.current++
      return {
        id: m.id || `m-${Date.now()}-${mIdx}`,
        measureNumber: num,
        timeSignature: m.timeSignature || timeSignature,
        division: m.division,
        slots: Array.isArray(m.slots)
          ? m.slots.map((s: any) => ({
              index: s.index,
              label: s.label,
              chord: s.chord,
              accent: s.accent,
              isRest: s.isRest,
            }))
          : undefined,
        subdivision: m.subdivision,
        subdivisionGrouping: m.subdivisionGrouping,
        cadence: m.cadence,
        cadenceLabel: m.cadenceLabel,
        cadenceColor: m.cadenceColor,
        beats: Array.isArray(m.beats)
          ? m.beats.map((b: any) => ({
              id: b.id || `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              beat: b.beat || 1,
              chord: b.chord || '',
              accent: b.accent || 'normal',
              duration: b.duration,
              subdivision: b.subdivision,
              subSlots: Array.isArray(b.subSlots)
                ? b.subSlots.map((s: any) => ({
                    id: s.id || `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    slotIndex: s.slotIndex ?? 0,
                    label: s.label || '',
                    chord: s.chord || '',
                    accent: s.accent || 'normal',
                    tied: !!s.tied,
                  }))
                : undefined,
            }))
          : [],
        repeatStart: !!m.repeatStart,
        repeatEnd: !!m.repeatEnd,
        repeatCount: m.repeatCount,
        volta: m.volta,
        guideLyric: m.guideLyric || '',
      }
    })

    return {
      id: rawSection.id || `sec-${Date.now()}-${sectionIndex}`,
      type: rawSection.type || 'verse',
      label: rawSection.label || `Sección ${sectionIndex + 1}`,
      timeSignature,
      instruments: Array.isArray(rawSection.instruments) ? rawSection.instruments : [],
      measures: normalizedMeasures,
      guideLyrics: rawSection.guideLyrics || '',
      lines: rawSection.lines,
    }
  }

  // Si viene del formato antiguo con 'lines', extraer los acordes y armar compases automáticos
  const extractedChords: string[] = []
  const guideLines: string[] = []

  if (Array.isArray(rawSection.lines)) {
    for (const line of rawSection.lines) {
      if (line.lyrics) guideLines.push(line.lyrics)
      if (Array.isArray(line.chords)) {
        for (const c of line.chords) {
          if (typeof c === 'string') extractedChords.push(c)
          else if (c && c.chord) extractedChords.push(c.chord)
        }
      }
    }
  }

  // Generar mínimo 4 compases
  const measureCount = Math.max(4, extractedChords.length > 0 ? Math.ceil(extractedChords.length / 2) * 2 : 4)
  const measures: Measure[] = []

  for (let i = 0; i < measureCount; i++) {
    const mNum = globalMeasureCounter.current++
    const chordForMeasure = extractedChords[i] || ''
    const lyricSnippet = guideLines[i] || ''

    const m = createDefaultMeasure(mNum, timeSignature, chordForMeasure)
    if (lyricSnippet) m.guideLyric = lyricSnippet
    measures.push(m)
  }

  return {
    id: rawSection.id || `sec-${Date.now()}-${sectionIndex}`,
    type: rawSection.type || 'verse',
    label: rawSection.label || `Sección ${sectionIndex + 1}`,
    timeSignature,
    instruments: Array.isArray(rawSection.instruments) ? rawSection.instruments : [],
    measures,
    guideLyrics: guideLines.join('\n'),
    lines: rawSection.lines,
  }
}

/**
 * Obtiene la insignia / prefijo de 3 letras para una sección evitando colisiones.
 * - Intro: INT
 * - Interludio / Instrumental: ITL (o INS para legacy si se prefiere)
 * - Verso / Estrofa: EST (o VER)
 * - Pre-Coro: PRE
 * - Coro: COR
 * - Puente: PUE (o BRI)
 * - Solo: SOL
 * - Outro: OUT
 */
export function getSectionBadge(type: string): string {
  const normalized = (type || '').toLowerCase().trim()
  switch (normalized) {
    case 'intro':
      return 'INT'
    case 'interlude':
    case 'interludio':
    case 'instrumental':
      return 'ITL'
    case 'verse':
    case 'estrofa':
      return 'EST'
    case 'prechorus':
    case 'pre-coro':
      return 'PRE'
    case 'chorus':
    case 'coro':
      return 'COR'
    case 'bridge':
    case 'puente':
      return 'PUE'
    case 'solo':
      return 'SOL'
    case 'outro':
      return 'OUT'
    default:
      return normalized.slice(0, 3).toUpperCase() || 'SEC'
  }
}

/**
 * Obtiene el nombre por defecto legible de la sección según su tipo
 */
export function getSectionDefaultName(type: string): string {
  const normalized = (type || '').toLowerCase().trim()
  switch (normalized) {
    case 'intro':
      return 'Intro'
    case 'interlude':
    case 'interludio':
    case 'instrumental':
      return 'Interludio'
    case 'verse':
    case 'estrofa':
      return 'Estrofa'
    case 'prechorus':
    case 'pre-coro':
      return 'Pre-Coro'
    case 'chorus':
    case 'coro':
      return 'Coro'
    case 'bridge':
    case 'puente':
      return 'Puente'
    case 'solo':
      return 'Solo'
    case 'outro':
      return 'Outro'
    default:
      return 'Sección'
  }
}
