import { Measure, ChordBeat, SectionMeasures, BeatAccent } from '@/types/measure'
import { transposeChord } from '@/lib/transpose'
import { CadenceDefinition } from '@/lib/harmonic-theory'
import { inferMeasureDivision, ensureMeasureSlots } from '@/lib/rhythm-utils'

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
    cadenceRole: target.cadenceRole,
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
  _key: string = 'C',
  _timeSignature: string = '4/4'
): Measure[] {
  if (measures.length === 0) return measures

  // Quitar / desmarcar cadencia de toda la sección
  if (!cadence) {
    return measures.map((m) => ({
      ...m,
      cadence: undefined,
      cadenceLabel: undefined,
      cadenceColor: undefined,
      cadenceRole: undefined,
    }))
  }

  const updated: Measure[] = measures.map((m) => ({
    ...m,
    cadence: undefined,
    cadenceLabel: undefined,
    cadenceColor: undefined,
    cadenceRole: undefined,
  }))

  const lastIdx = updated.length - 1
  if (updated.length >= 2) {
    const penultIdx = updated.length - 2
    updated[penultIdx] = {
      ...updated[penultIdx],
      cadence: cadence.id || cadence.type,
      cadenceLabel: `${cadence.name} (${cadence.degrees})`,
      cadenceColor: cadence.colorBadge,
      cadenceRole: 'start',
    }
    updated[lastIdx] = {
      ...updated[lastIdx],
      cadenceRole: 'end',
    }
  } else {
    updated[lastIdx] = {
      ...updated[lastIdx],
      cadence: cadence.id || cadence.type,
      cadenceLabel: `${cadence.name} (${cadence.degrees})`,
      cadenceColor: cadence.colorBadge,
      cadenceRole: 'single',
    }
  }

  return updated
}

/**
 * Calcula el porcentaje horizontal de inicio (tensión) para el corchete de cadencia en el compás emisor.
 * - 4 subdivisiones / negras (ej. B/D# en tiempo 4 o Bsus4 - B en tiempos 3 y 4):
 *   - Si el acorde de tensión está solo en el pulso 4: 75%
 *   - Si la tensión abarca los pulsos 3 y 4: 50%
 *   - Si la tensión está en el pulso 3: 50%
 * - 2 subdivisiones / blancas (o compás con 2 acordes): 50%
 * - 1 acorde / redonda (whole): 50%
 */
export function getCadenceStartPercent(measure: Measure, timeSignature: string = '4/4'): number {
  const effectiveTimeSig = measure.timeSignature || timeSignature || '4/4'
  const division = inferMeasureDivision(measure)
  const slots = ensureMeasureSlots(measure, effectiveTimeSig)
  const numSlots = slots?.length || 1

  if (division === 'quarter' || numSlots === 4) {
    const hasChord2 = !!slots[2]?.chord && slots[2]?.chord !== '%'
    const hasChord3 = !!slots[3]?.chord && slots[3]?.chord !== '%'

    // Acorde de tensión únicamente en el pulso 4 (ej. B/D#)
    if (hasChord3 && !hasChord2) {
      return 75
    }
    // Tensión en pulsos 3 y 4 (ej. Bsus4 - B)
    if (hasChord2 && hasChord3) {
      return 50
    }
    // Tensión en pulso 3
    if (hasChord2 && !hasChord3) {
      return 50
    }
    return 50
  }

  if (division === 'half' || numSlots === 2) {
    return 50
  }

  if (division === 'eighth' || numSlots >= 6) {
    return 50
  }

  return 50
}

/**
 * Calcula el porcentaje horizontal de fin (resolución) para el corchete de cadencia en el compás receptor.
 * - 4 subdivisiones / negras: el pulso 1 ocupa el primer cuarto (25%)
 * - 2 subdivisiones / blancas: el pulso 1 resuelve en la primera mitad (~35%)
 * - Compás completo / redonda: resolución en el pulso 1 (~25%)
 */
export function getCadenceEndPercent(measure: Measure, timeSignature: string = '4/4'): number {
  const effectiveTimeSig = measure.timeSignature || timeSignature || '4/4'
  const division = inferMeasureDivision(measure)
  const slots = ensureMeasureSlots(measure, effectiveTimeSig)
  const numSlots = slots?.length || 1

  if (division === 'quarter' || numSlots === 4) {
    return 25
  }

  if (division === 'half' || numSlots === 2) {
    return 35
  }

  return 25
}

/**
 * Genera el formato completo y la variante compacta/corta de la etiqueta de cadencia
 * para evitar desbordamientos en pantallas pequeñas o al final de las filas.
 * Ej: "Cadencia Auténtica Perfecta (PAC) (V → I)" -> full / "PAC (V → I)" -> short
 */
export function getCadenceDisplayLabels(cadenceIdOrType?: string, originalLabel?: string): {
  full: string
  short: string
} {
  const normalized = (cadenceIdOrType || '').toLowerCase()
  const rawLabel = originalLabel || ''

  if (normalized.includes('pac')) {
    return {
      full: 'Cadencia Auténtica Perfecta (PAC) (V → I)',
      short: 'PAC (V → I)',
    }
  }
  if (normalized.includes('iac')) {
    return {
      full: 'Cadencia Auténtica Imperfecta (IAC) (V → I)',
      short: 'IAC (V → I)',
    }
  }
  if (normalized.includes('rota') || normalized.includes('deceptiv')) {
    return {
      full: 'Cadencia Rota / Deceptiva (V → vi)',
      short: 'Rota (V → vi)',
    }
  }
  if (normalized.includes('plagal')) {
    return {
      full: 'Cadencia Plagal (IV → I)',
      short: 'Plagal (IV → I)',
    }
  }
  if (normalized.includes('semicadencia') || normalized.includes('semi')) {
    return {
      full: 'Semicadencia (→ V)',
      short: 'Semicadencia (→ V)',
    }
  }
  if (normalized.includes('frigia')) {
    return {
      full: 'Cadencia Frigia (iv → V)',
      short: 'Frigia (iv → V)',
    }
  }
  if (normalized.includes('picardia') || normalized.includes('picard')) {
    return {
      full: 'Cadencia Picardía (iv → I)',
      short: 'Picardía (iv → I)',
    }
  }
  if (normalized.includes('backdoor')) {
    return {
      full: 'Cadencia Backdoor (♭VII7 → I)',
      short: 'Backdoor (♭VII7 → I)',
    }
  }

  if (rawLabel) {
    const rawLower = rawLabel.toLowerCase()
    if (rawLabel.includes('PAC') || (rawLower.includes('auténtica') && rawLower.includes('perfecta')) || (rawLower.includes('autentica') && rawLower.includes('perfecta'))) {
      return { full: 'Cadencia Auténtica Perfecta (PAC) (V → I)', short: 'PAC (V → I)' }
    }
    if (rawLabel.includes('IAC') || (rawLower.includes('auténtica') && rawLower.includes('imperfecta')) || (rawLower.includes('autentica') && rawLower.includes('imperfecta'))) {
      return { full: 'Cadencia Auténtica Imperfecta (IAC) (V → I)', short: 'IAC (V → I)' }
    }
    if (rawLower.includes('rota') || rawLower.includes('deceptiv')) {
      return { full: 'Cadencia Rota / Deceptiva (V → vi)', short: 'Rota (V → vi)' }
    }
    if (rawLower.includes('plagal')) {
      return { full: 'Cadencia Plagal (IV → I)', short: 'Plagal (IV → I)' }
    }
    if (rawLower.includes('semicadencia') || rawLower.includes('semi')) {
      return { full: 'Semicadencia (→ V)', short: 'Semicadencia (→ V)' }
    }
    if (rawLower.includes('frigia')) {
      return { full: 'Cadencia Frigia (iv → V)', short: 'Frigia (iv → V)' }
    }
    if (rawLower.includes('picard')) {
      return { full: 'Cadencia Picardía (iv → I)', short: 'Picardía (iv → I)' }
    }
    if (rawLower.includes('backdoor')) {
      return { full: 'Cadencia Backdoor (♭VII7 → I)', short: 'Backdoor (♭VII7 → I)' }
    }
    const cleanShort = rawLabel
      .replace(/^Cadencia\s+/i, '')
      .replace(/\s*\([^)]*\)\s*\(([^)]+)\)$/, ' ($1)')
      .trim()
    return {
      full: rawLabel,
      short: cleanShort || rawLabel,
    }
  }

  return {
    full: 'Cadencia',
    short: 'Cad.',
  }
}

/**
 * Aplica una cadencia armónica a un compás específico dentro de una lista de compases.
 * Actúa estrictamente como marcado visual y metadatos, preservando 100% los acordes, slots y división existentes.
 */
export function applyCadenceToMeasure(
  measures: Measure[],
  targetMeasureId: string,
  cadence: CadenceDefinition | null,
  _key: string = 'C',
  _timeSignature: string = '4/4'
): { updatedMeasures: Measure[]; targetUpdatedMeasure: Measure } {
  const targetIdx = measures.findIndex((m) => m.id === targetMeasureId)
  if (targetIdx === -1) {
    return { updatedMeasures: measures, targetUpdatedMeasure: measures[0] }
  }

  // Quitar cadencia manual
  if (!cadence) {
    const target = measures[targetIdx]
    const updatedMeasures = measures.map((m, i) => {
      if (i === targetIdx) {
        return {
          ...m,
          cadence: undefined,
          cadenceLabel: undefined,
          cadenceColor: undefined,
          cadenceRole: undefined,
        }
      }
      // Si el compás actual era 'start' de una cadencia de 2 compases, limpiar también su 'end'
      if (target.cadenceRole === 'start' && i === targetIdx + 1 && m.cadenceRole === 'end') {
        return {
          ...m,
          cadence: undefined,
          cadenceLabel: undefined,
          cadenceColor: undefined,
          cadenceRole: undefined,
        }
      }
      // Si el compás actual era 'end' de una cadencia de 2 compases, limpiar también su 'start'
      if (target.cadenceRole === 'end' && i === targetIdx - 1 && m.cadenceRole === 'start') {
        return {
          ...m,
          cadence: undefined,
          cadenceLabel: undefined,
          cadenceColor: undefined,
          cadenceRole: undefined,
        }
      }
      return m
    })
    return { updatedMeasures, targetUpdatedMeasure: updatedMeasures[targetIdx] }
  }

  // Asignar metadatos de cadencia respetando completamente los acordes y división actuales
  const isLast = targetIdx === measures.length - 1
  const currentM = measures[targetIdx]
  const updatedM: Measure = {
    ...currentM,
    cadence: cadence.id || cadence.type,
    cadenceLabel: `${cadence.name} (${cadence.degrees})`,
    cadenceColor: cadence.colorBadge,
    cadenceRole: isLast ? 'single' : 'start',
  }

  const updatedMeasures = measures.map((m, i) => {
    if (i === targetIdx) return updatedM
    if (!isLast && i === targetIdx + 1 && !m.cadence) {
      return {
        ...m,
        cadenceRole: 'end' as const,
      }
    }
    return m
  })

  return { updatedMeasures, targetUpdatedMeasure: updatedM }
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
 * Transpone los compases de una única sección y opcionalmente actualiza su keySignature
 */
export function transposeSingleSectionMeasures(
  section: SectionMeasures,
  semitones: number,
  newKeySignature?: string | null
): SectionMeasures {
  return {
    ...section,
    keySignature: newKeySignature !== undefined ? newKeySignature : (section.keySignature ?? null),
    measures: semitones === 0 ? section.measures : transposeMeasures(section.measures, semitones),
  }
}

/**
 * Determina si una sección contiene al menos un acorde real en sus compases
 */
export function sectionHasChords(section: SectionMeasures): boolean {
  if (!section.measures || section.measures.length === 0) return false
  return section.measures.some((m) => {
    const hasSlotChord = m.slots?.some((s) => s.chord && s.chord.trim() !== '' && s.chord !== '%')
    const hasBeatChord = m.beats?.some((b) => b.chord && b.chord.trim() !== '' && b.chord !== '%')
    return Boolean(hasSlotChord || hasBeatChord)
  })
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
      keySignature: rawSection.keySignature || null,
      instruments: Array.isArray(rawSection.instruments) ? rawSection.instruments : [],
      measures: normalizedMeasures,
      guideLyrics: rawSection.guideLyrics || '',
      lyrics: rawSection.lyrics || '',
      lines: rawSection.lines,
      repeatCount: rawSection.repeatCount ? Math.max(1, Math.min(64, Number(rawSection.repeatCount))) : 1,
      tempoOverride: rawSection.tempoOverride !== undefined ? (rawSection.tempoOverride ? Number(rawSection.tempoOverride) : null) : null,
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
    keySignature: rawSection.keySignature || null,
    instruments: Array.isArray(rawSection.instruments) ? rawSection.instruments : [],
    measures,
    guideLyrics: guideLines.join('\n'),
    lyrics: rawSection.lyrics || '',
    lines: rawSection.lines,
    repeatCount: rawSection.repeatCount ? Math.max(1, Math.min(64, Number(rawSection.repeatCount))) : 1,
    tempoOverride: rawSection.tempoOverride !== undefined ? (rawSection.tempoOverride ? Number(rawSection.tempoOverride) : null) : null,
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
export function getSectionBadge(type: string, label?: string): string {
  const normLabel = (label || '').toLowerCase().trim()
  const normalized = (type || '').toLowerCase().trim()

  // Si el nombre o tipo es Interludio / Interlude, devolver INT
  if (
    normLabel.includes('interludio') ||
    normLabel.includes('interlude') ||
    normalized === 'interlude' ||
    normalized === 'interludio'
  ) {
    return 'INT'
  }

  // Si el nombre o tipo es Intro
  if (normLabel.includes('intro') || normalized === 'intro') {
    return 'INT'
  }

  // Pre-Coro
  if (
    normLabel.includes('pre-coro') ||
    normLabel.includes('precoro') ||
    normLabel.includes('pre-chorus') ||
    normalized === 'prechorus' ||
    normalized === 'pre-coro'
  ) {
    return 'PRE'
  }

  // Coro
  if (
    normLabel.includes('coro') ||
    normLabel.includes('chorus') ||
    normalized === 'chorus' ||
    normalized === 'coro'
  ) {
    return 'COR'
  }

  // Puente
  if (
    normLabel.includes('puente') ||
    normLabel.includes('bridge') ||
    normalized === 'bridge' ||
    normalized === 'puente'
  ) {
    return 'PUE'
  }

  // Solo
  if (normLabel.includes('solo') || normalized === 'solo') {
    return 'SOL'
  }

  // Outro
  if (
    normLabel.includes('outro') ||
    normLabel.includes('final') ||
    normalized === 'outro'
  ) {
    return 'OUT'
  }

  // Estrofa / Verso
  if (
    normLabel.includes('estrofa') ||
    normLabel.includes('verso') ||
    normLabel.includes('verse') ||
    normalized === 'verse' ||
    normalized === 'estrofa'
  ) {
    return 'EST'
  }

  switch (normalized) {
    case 'intro':
    case 'interlude':
    case 'interludio':
      return 'INT'
    case 'instrumental':
      return 'INS'
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
      if (normLabel) {
        return normLabel.slice(0, 3).toUpperCase()
      }
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

/**
 * Genera un identificador único seguro para compases, beats o secciones.
 */
export function generateUniqueMeasureId(prefix: string = 'id'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Genera un nombre inteligente para una sección duplicada:
 * - Si termina en número (ej. "Estrofa 1"), busca el número más alto existente y asigna el siguiente (ej. "Estrofa 2").
 * - Si se llama "Coro" (o "Chorus"), asigna "Coro 2" (o incrementa secuencialmente si ya existen).
 * - Si no tiene número explícito, asigna "${originalLabel} (Copia)" (o "(Copia 2)" si ya existe).
 */
export function getDuplicatedSectionLabel(
  originalLabel: string,
  existingSections: Array<{ label: string }> = []
): string {
  const trimmed = (originalLabel || '').trim() || 'Sección'

  // Caso 1: Termina con número (ej. "Estrofa 1", "Verso 2", "Coro 1")
  const numberMatch = trimmed.match(/^(.*?)\s+(\d+)$/)
  if (numberMatch) {
    const base = numberMatch[1].trim()
    const currentNum = parseInt(numberMatch[2], 10)
    const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`^${escapedBase}\\s+(\\d+)$`, 'i')

    let maxNum = currentNum
    for (const sec of existingSections) {
      const match = (sec.label || '').trim().match(regex)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) {
          maxNum = num
        }
      }
    }

    return `${base} ${maxNum + 1}`
  }

  // Caso 2: Se llama "Coro" o "Chorus"
  if (/^coro$/i.test(trimmed) || /^chorus$/i.test(trimmed)) {
    const base = trimmed
    const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`^${escapedBase}\\s+(\\d+)$`, 'i')

    let maxNum = 1 // Partimos de Coro 1 implícito
    for (const sec of existingSections) {
      const match = (sec.label || '').trim().match(regex)
      if (match) {
        const num = parseInt(match[1], 10)
        if (num > maxNum) {
          maxNum = num
        }
      }
    }

    return `${base} ${maxNum + 1}`
  }

  // Caso 3: Sin número explícito -> "${nombreOriginal} (Copia)"
  const baseCopy = `${trimmed} (Copia)`
  const existsExact = existingSections.some(
    (s) => (s.label || '').trim().toLowerCase() === baseCopy.toLowerCase()
  )
  if (!existsExact) {
    return baseCopy
  }

  let counter = 2
  while (
    existingSections.some(
      (s) =>
        (s.label || '').trim().toLowerCase() === `${trimmed} (Copia ${counter})`.toLowerCase()
    )
  ) {
    counter++
  }

  return `${trimmed} (Copia ${counter})`
}

/**
 * Realiza una clonación profunda (deep clone) de una sección y todos sus compases,
 * slots, pulsos y metadatos, generando nuevos IDs únicos y renombrando inteligentemente.
 */
export function cloneSectionMeasures(
  section: SectionMeasures,
  existingSections: Array<{ label: string }> = []
): SectionMeasures {
  const newSectionId = generateUniqueMeasureId('sec')
  const newLabel = getDuplicatedSectionLabel(section.label, existingSections)

  const clonedMeasures: Measure[] = (section.measures || []).map((m, idx) => {
    const newMeasureId = generateUniqueMeasureId('m')

    const clonedSlots = m.slots
      ? m.slots.map((slot) => ({
          ...slot,
        }))
      : undefined

    const clonedBeats: ChordBeat[] = (m.beats || []).map((beat) => ({
      ...beat,
      id: generateUniqueMeasureId('beat'),
      subSlots: beat.subSlots
        ? beat.subSlots.map((sub) => ({
            ...sub,
            id: generateUniqueMeasureId('subbeat'),
          }))
        : undefined,
    }))

    return {
      ...m,
      id: newMeasureId,
      measureNumber: m.measureNumber ?? idx + 1,
      slots: clonedSlots,
      beats: clonedBeats,
    }
  })

  return {
    ...section,
    id: newSectionId,
    label: newLabel,
    keySignature: section.keySignature ?? null,
    tempoOverride: section.tempoOverride ?? null,
    repeatCount: section.repeatCount ? Math.max(1, Math.min(64, Number(section.repeatCount))) : 1,
    instruments: section.instruments ? [...section.instruments] : [],
    guideLyrics: section.guideLyrics || '',
    lyrics: section.lyrics || '',
    measures: clonedMeasures,
    lines: section.lines ? JSON.parse(JSON.stringify(section.lines)) : undefined,
  }
}

/**
 * Extrae una vista previa compacta de texto de los acordes de una sección para vista colapsada
 * Ej: "[ E - C#m7 - Cmaj7 - F#m7 ]"
 */
export function getSectionChordsPreview(section: SectionMeasures, maxChords: number = 8): string {
  const chords: string[] = []
  for (const m of section.measures || []) {
    if (m.slots && m.slots.length > 0) {
      for (const s of m.slots) {
        if (s.chord && s.chord.trim() !== '' && s.chord !== '%') {
          chords.push(s.chord.trim())
        }
      }
    } else if (m.beats && m.beats.length > 0) {
      for (const b of m.beats) {
        if (b.chord && b.chord.trim() !== '' && b.chord !== '%') {
          chords.push(b.chord.trim())
        }
      }
    }
  }

  if (chords.length === 0) return '[ Sin acordes ]'

  const displayChords = chords.slice(0, maxChords)
  const preview = displayChords.join(' - ')
  return chords.length > maxChords ? `[ ${preview} ... ]` : `[ ${preview} ]`
}

/**
 * Ensambla el texto lírico unificado de una canción a partir de sus secciones.
 * Cada sección aporta su encabezado [Label 2x] y sus versos limpios.
 */
export function buildFullLyricsText(sections: SectionMeasures[]): string {
  if (!Array.isArray(sections) || sections.length === 0) return ''
  return sections
    .map((sec) => {
      const repeats = sec.repeatCount && sec.repeatCount > 1 ? ` ${sec.repeatCount}x` : ''
      const header = `[${sec.label}${repeats}]`
      const text = (sec.lyrics || '').trim()
      return text ? `${header}\n${text}` : header
    })
    .join('\n\n')
}

/**
 * Parsea un texto de letra crudo separándolo en bloques de secciones por etiquetas [Tag].
 */
export function parseLyricsBlocks(text: string): Array<{
  rawHeader: string
  cleanName: string
  repeats: number
  lines: string[]
}> {
  if (!text || typeof text !== 'string') return []
  const lines = text.split('\n')
  const blocks: Array<{
    rawHeader: string
    cleanName: string
    repeats: number
    lines: string[]
  }> = []

  let currentBlock: {
    rawHeader: string
    cleanName: string
    repeats: number
    lines: string[]
  } | null = null

  const repeatRegex = /(?:[\s\-_]+|\s*\()(?:x\s*(\d+)|(\d+)\s*x)\s*\)?$/i

  for (const line of lines) {
    const trimmed = line.trim()
    const headerMatch = trimmed.match(/^\[([^\]]+)\]$/)

    if (headerMatch) {
      if (currentBlock) blocks.push(currentBlock)
      const rawInside = headerMatch[1].trim()
      const match = rawInside.match(repeatRegex)
      let cleanName = rawInside
      let repeats = 1
      if (match) {
        const numStr = match[1] || match[2]
        const parsed = parseInt(numStr, 10)
        repeats = !isNaN(parsed) && parsed > 0 ? parsed : 1
        cleanName = rawInside.replace(repeatRegex, '').trim()
      }
      currentBlock = {
        rawHeader: trimmed,
        cleanName: cleanName || rawInside,
        repeats,
        lines: [],
      }
    } else if (currentBlock) {
      currentBlock.lines.push(line)
    }
  }

  if (currentBlock) blocks.push(currentBlock)
  return blocks
}

/**
 * Sincroniza y migra las letras existentes en una canción hacia sus secciones correspondientes.
 * Si las secciones ya tienen 'lyrics' asignado, se preserva.
 * Si 'section.lyrics' está vacío pero 'rawLyricsText' tiene contenido estructurado con [Tags],
 * extrae los versos del tag correspondiente y los asocia a la sección.
 */
export function syncSectionsWithLyrics(
  sections: SectionMeasures[],
  rawLyricsText?: string | null
): SectionMeasures[] {
  if (!Array.isArray(sections) || sections.length === 0) return []

  const hasAnyLyrics = sections.some((s) => s.lyrics && s.lyrics.trim().length > 0)
  if (hasAnyLyrics || !rawLyricsText || rawLyricsText.trim().length === 0) {
    return sections
  }

  const parsedBlocks = parseLyricsBlocks(rawLyricsText)
  if (parsedBlocks.length === 0) return sections

  return sections.map((sec) => {
    if (sec.lyrics && sec.lyrics.trim().length > 0) return sec

    const secLabelNorm = sec.label.toLowerCase().trim()
    const secTypeNorm = sec.type.toLowerCase().trim()

    // Buscar coincidencia en los bloques parseados
    const match = parsedBlocks.find((block) => {
      const blockClean = block.cleanName.toLowerCase().trim()
      return (
        blockClean === secLabelNorm ||
        secLabelNorm.includes(blockClean) ||
        blockClean.includes(secLabelNorm) ||
        blockClean === secTypeNorm
      )
    })

    if (match && match.lines.length > 0) {
      const content = match.lines.join('\n').trim()
      if (content.length > 0) {
        return {
          ...sec,
          lyrics: content,
          repeatCount: sec.repeatCount && sec.repeatCount > 1 ? sec.repeatCount : (match.repeats || 1),
        }
      }
    }

    return sec
  })
}


