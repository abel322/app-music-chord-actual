import { Measure, ChordBeat, SectionMeasures, BeatAccent } from '@/types/measure'
import { transposeChord } from '@/lib/transpose'

/**
 * Analiza un compás musical y devuelve la cantidad de tiempos (pulsos)
 */
export function getBeatsPerMeasure(timeSignature: string = '4/4'): number {
  const parts = timeSignature.split('/')
  const numerator = parseInt(parts[0], 10)
  if (isNaN(numerator) || numerator <= 0) return 4

  // En 6/8 usualmente se siente en 2 pulsos con subdivisión ternaria, pero permitimos 6 o 2
  if (timeSignature === '6/8') return 6
  if (timeSignature === '9/8') return 9
  if (timeSignature === '12/8') return 12

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
    beats: target.beats.map((b) => ({
      ...b,
      id: `b-dup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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
      guideLyric: existing?.guideLyric || '',
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
 * Transpone todos los acordes de una lista de compases por N semitonos
 */
export function transposeMeasures(measures: Measure[], semitones: number): Measure[] {
  if (semitones === 0) return measures

  return measures.map((m) => ({
    ...m,
    beats: m.beats.map((b) => ({
      ...b,
      chord: transposeChord(b.chord, semitones),
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
        beats: Array.isArray(m.beats)
          ? m.beats.map((b: any) => ({
              id: b.id || `b-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              beat: b.beat || 1,
              chord: b.chord || '',
              accent: b.accent || 'normal',
              duration: b.duration,
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
