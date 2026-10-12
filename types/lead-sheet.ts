import { SectionMeasures, Measure, MeasureSlot, ChordBeat } from './measure'

/**
 * Interfaz para sección del Lead Sheet Builder con soporte de modulación de tonalidad independiente
 */
export interface Section extends SectionMeasures {
  keySignature?: string | null // Tonalidad específica de la sección. Si es null o undefined, hereda song.keySignature.
}

export type { SectionMeasures, Measure, MeasureSlot, ChordBeat }
