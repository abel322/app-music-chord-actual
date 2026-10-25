/**
 * Tipos de TypeScript y Mapeo Estándar Donner / General MIDI para el Módulo de Batería
 */

export type DrumPadType = 
  | 'KICK' | 'SNARE' | 'SNARE_RIM' 
  | 'HIHAT_CLOSED' | 'HIHAT_OPEN' | 'HIHAT_PEDAL' 
  | 'CRASH' | 'RIDE' 
  | 'TOM_HIGH' | 'TOM_MID' | 'TOM_FLOOR';

export interface DrumHit {
  step: number;        // Paso en la rejilla (0 a 15 para compás de 16 semicorcheas, o 0 a 31 para 2 compases)
  pad: DrumPadType;
  note: number;        // Nota MIDI
  velocity: number;    // Dinámica 1 - 127
}

export interface DrumGrooveData {
  barsCount: number;    // 1 o 2 compases
  quantizeGrid: 8 | 16;
  hits: DrumHit[];
  presetId?: string;
  presetName?: string;
}

export interface DrumPadInfo {
  name: string;
  type: DrumPadType;
  isCymbal: boolean;
  stemUp: boolean;     // Manos (plica arriba) vs Pies (plica abajo)
  line: number;        // Posición en el pentagrama (1 = 1ra línea inferior / Mi, 5 = 5ta línea superior / Fa)
  shortName: string;
  color: string;
}

export const DONNER_DRUM_MAP: Record<number, DrumPadInfo> = {
  35: { name: 'Bombo Acústico', type: 'KICK', isCymbal: false, stemUp: false, line: 1, shortName: 'BD', color: 'from-amber-500 to-orange-600' },
  36: { name: 'Bombo (Kick)', type: 'KICK', isCymbal: false, stemUp: false, line: 1, shortName: 'KICK', color: 'from-amber-500 to-orange-600' },
  37: { name: 'Cross Stick / Aro', type: 'SNARE_RIM', isCymbal: false, stemUp: true, line: 3, shortName: 'RIM', color: 'from-blue-500 to-indigo-600' },
  38: { name: 'Caja (Snare)', type: 'SNARE', isCymbal: false, stemUp: true, line: 3, shortName: 'SNARE', color: 'from-rose-500 to-pink-600' },
  40: { name: 'Aro Caja (Rimshot)', type: 'SNARE_RIM', isCymbal: false, stemUp: true, line: 3, shortName: 'RIM', color: 'from-rose-500 to-pink-600' },
  41: { name: 'Tom 3 (Base / Floor)', type: 'TOM_FLOOR', isCymbal: false, stemUp: true, line: 2, shortName: 'FTOM', color: 'from-emerald-500 to-teal-600' },
  42: { name: 'Hi-Hat Cerrado', type: 'HIHAT_CLOSED', isCymbal: true, stemUp: true, line: 5, shortName: 'HH-C', color: 'from-yellow-400 to-amber-500' },
  43: { name: 'Tom Base Agudo', type: 'TOM_FLOOR', isCymbal: false, stemUp: true, line: 2, shortName: 'FTOM', color: 'from-emerald-500 to-teal-600' },
  44: { name: 'Hi-Hat Pedal', type: 'HIHAT_PEDAL', isCymbal: true, stemUp: false, line: 0, shortName: 'HH-P', color: 'from-yellow-400 to-amber-500' },
  45: { name: 'Tom 2 (Medio)', type: 'TOM_MID', isCymbal: false, stemUp: true, line: 3.5, shortName: 'MTOM', color: 'from-cyan-500 to-blue-600' },
  46: { name: 'Hi-Hat Abierto', type: 'HIHAT_OPEN', isCymbal: true, stemUp: true, line: 5, shortName: 'HH-O', color: 'from-yellow-300 to-amber-400' },
  47: { name: 'Tom Medio Agudo', type: 'TOM_MID', isCymbal: false, stemUp: true, line: 3.5, shortName: 'MTOM', color: 'from-cyan-500 to-blue-600' },
  48: { name: 'Tom 1 (Agudo)', type: 'TOM_HIGH', isCymbal: false, stemUp: true, line: 4, shortName: 'HTOM', color: 'from-purple-500 to-violet-600' },
  49: { name: 'Crash Cymbal 1', type: 'CRASH', isCymbal: true, stemUp: true, line: 5.5, shortName: 'CRASH', color: 'from-red-500 to-rose-600' },
  50: { name: 'Tom Agudo Alto', type: 'TOM_HIGH', isCymbal: false, stemUp: true, line: 4, shortName: 'HTOM', color: 'from-purple-500 to-violet-600' },
  51: { name: 'Ride Cymbal', type: 'RIDE', isCymbal: true, stemUp: true, line: 4.5, shortName: 'RIDE', color: 'from-blue-400 to-sky-500' },
  53: { name: 'Ride Bell', type: 'RIDE', isCymbal: true, stemUp: true, line: 4.5, shortName: 'BELL', color: 'from-blue-400 to-sky-500' },
  55: { name: 'Splash Cymbal', type: 'CRASH', isCymbal: true, stemUp: true, line: 5.5, shortName: 'SPLASH', color: 'from-red-400 to-orange-500' },
  57: { name: 'Crash Cymbal 2', type: 'CRASH', isCymbal: true, stemUp: true, line: 5.5, shortName: 'CRASH 2', color: 'from-red-500 to-rose-600' },
};

export function getDrumInfoByNote(note: number): DrumPadInfo {
  return (
    DONNER_DRUM_MAP[note] || {
      name: `Pad MIDI ${note}`,
      type: 'SNARE',
      isCymbal: false,
      stemUp: true,
      line: 3,
      shortName: `M${note}`,
      color: 'from-slate-500 to-slate-700',
    }
  );
}

/**
 * Presets rítmicos integrados para bateristas
 */
export interface DrumPreset {
  id: string;
  name: string;
  description: string;
  category: 'Pop/Rock' | 'Alabanza' | 'Balada' | 'Groove' | 'Especial';
  barsCount: number;
  quantizeGrid: 8 | 16;
  hits: DrumHit[];
}

export const DRUM_PRESETS: DrumPreset[] = [
  {
    id: 'pop_rock_standard',
    name: 'Balada Pop / Rock Estándar',
    description: 'Hi-Hat en corcheas continuas, Bombo en 1 y 3, Caja firme en 2 y 4.',
    category: 'Pop/Rock',
    barsCount: 1,
    quantizeGrid: 16,
    hits: [
      // Hi-Hat en cada corchea (pasos 0, 2, 4, 6, 8, 10, 12, 14)
      { step: 0, pad: 'HIHAT_CLOSED', note: 42, velocity: 95 },
      { step: 2, pad: 'HIHAT_CLOSED', note: 42, velocity: 80 },
      { step: 4, pad: 'HIHAT_CLOSED', note: 42, velocity: 90 },
      { step: 6, pad: 'HIHAT_CLOSED', note: 42, velocity: 80 },
      { step: 8, pad: 'HIHAT_CLOSED', note: 42, velocity: 95 },
      { step: 10, pad: 'HIHAT_CLOSED', note: 42, velocity: 80 },
      { step: 12, pad: 'HIHAT_CLOSED', note: 42, velocity: 90 },
      { step: 14, pad: 'HIHAT_CLOSED', note: 42, velocity: 80 },
      // Bombo en 1 y 3 (paso 0 y 8, con sutil anticipación en paso 10)
      { step: 0, pad: 'KICK', note: 36, velocity: 110 },
      { step: 8, pad: 'KICK', note: 36, velocity: 105 },
      { step: 10, pad: 'KICK', note: 36, velocity: 90 },
      // Caja en 2 y 4 (paso 4 y 12)
      { step: 4, pad: 'SNARE', note: 38, velocity: 115 },
      { step: 12, pad: 'SNARE', note: 38, velocity: 115 },
    ],
  },
  {
    id: 'four_on_floor',
    name: 'Four on the Floor (Pumping Beat)',
    description: 'Bombo a 4 tiempos (1, 2, 3, 4), Hi-Hat abierto en contratiempos, Caja en 2 y 4.',
    category: 'Alabanza',
    barsCount: 1,
    quantizeGrid: 16,
    hits: [
      // Bombo en todos los tiempos negros (0, 4, 8, 12)
      { step: 0, pad: 'KICK', note: 36, velocity: 120 },
      { step: 4, pad: 'KICK', note: 36, velocity: 115 },
      { step: 8, pad: 'KICK', note: 36, velocity: 118 },
      { step: 12, pad: 'KICK', note: 36, velocity: 115 },
      // Caja en 2 y 4
      { step: 4, pad: 'SNARE', note: 38, velocity: 115 },
      { step: 12, pad: 'SNARE', note: 38, velocity: 115 },
      // Hi-Hat en contratiempos abiertos
      { step: 2, pad: 'HIHAT_OPEN', note: 46, velocity: 100 },
      { step: 6, pad: 'HIHAT_OPEN', note: 46, velocity: 100 },
      { step: 10, pad: 'HIHAT_OPEN', note: 46, velocity: 100 },
      { step: 14, pad: 'HIHAT_OPEN', note: 46, velocity: 100 },
      // Hi-Hat cerrado de apoyo en pulsos a tierra
      { step: 0, pad: 'HIHAT_CLOSED', note: 42, velocity: 85 },
      { step: 8, pad: 'HIHAT_CLOSED', note: 42, velocity: 85 },
    ],
  },
  {
    id: 'toms_groove',
    name: 'Patrón de Toms / Floor Tom Groove',
    description: 'Groove tribal con Floor Tom y Toms en semicorcheas dinámicas, bombo acentuado.',
    category: 'Groove',
    barsCount: 1,
    quantizeGrid: 16,
    hits: [
      // Floor Tom en corcheas constantes
      { step: 0, pad: 'TOM_FLOOR', note: 41, velocity: 105 },
      { step: 2, pad: 'TOM_FLOOR', note: 41, velocity: 90 },
      { step: 4, pad: 'TOM_FLOOR', note: 41, velocity: 105 },
      { step: 6, pad: 'TOM_FLOOR', note: 41, velocity: 85 },
      { step: 8, pad: 'TOM_FLOOR', note: 41, velocity: 100 },
      { step: 10, pad: 'TOM_FLOOR', note: 41, velocity: 85 },
      { step: 12, pad: 'TOM_FLOOR', note: 41, velocity: 105 },
      { step: 14, pad: 'TOM_FLOOR', note: 41, velocity: 90 },
      // Tom 1 y Tom 2 haciendo figuras sincopadas
      { step: 3, pad: 'TOM_HIGH', note: 48, velocity: 85 },
      { step: 7, pad: 'TOM_MID', note: 45, velocity: 85 },
      { step: 11, pad: 'TOM_HIGH', note: 48, velocity: 90 },
      { step: 15, pad: 'TOM_MID', note: 45, velocity: 85 },
      // Bombo en 1 y 3 (con síncopa en paso 6 y 10)
      { step: 0, pad: 'KICK', note: 36, velocity: 115 },
      { step: 6, pad: 'KICK', note: 36, velocity: 100 },
      { step: 8, pad: 'KICK', note: 36, velocity: 110 },
      { step: 10, pad: 'KICK', note: 36, velocity: 95 },
    ],
  },
  {
    id: 'fast_praise_disco',
    name: 'Alabanza Rápida / Disco Beat',
    description: 'Hi-Hat con apertura en contratiempo (&), bombo en tierra y caja explosiva.',
    category: 'Alabanza',
    barsCount: 1,
    quantizeGrid: 16,
    hits: [
      { step: 0, pad: 'KICK', note: 36, velocity: 115 },
      { step: 0, pad: 'HIHAT_CLOSED', note: 42, velocity: 85 },
      { step: 2, pad: 'HIHAT_OPEN', note: 46, velocity: 105 },
      { step: 4, pad: 'SNARE', note: 38, velocity: 118 },
      { step: 4, pad: 'KICK', note: 36, velocity: 100 },
      { step: 6, pad: 'HIHAT_OPEN', note: 46, velocity: 105 },
      { step: 8, pad: 'KICK', note: 36, velocity: 115 },
      { step: 8, pad: 'HIHAT_CLOSED', note: 42, velocity: 85 },
      { step: 10, pad: 'HIHAT_OPEN', note: 46, velocity: 105 },
      { step: 12, pad: 'SNARE', note: 38, velocity: 118 },
      { step: 12, pad: 'KICK', note: 36, velocity: 100 },
      { step: 14, pad: 'HIHAT_OPEN', note: 46, velocity: 105 },
    ],
  },
  {
    id: 'half_time_worship',
    name: 'Balada Solemne (Half-Time Worship)',
    description: 'Caja única en el 3er tiempo, Ride con campana sutil, Bombo amplio y espacioso.',
    category: 'Balada',
    barsCount: 1,
    quantizeGrid: 16,
    hits: [
      // Ride en corcheas (0, 2, 4, 6, 8, 10, 12, 14)
      { step: 0, pad: 'RIDE', note: 51, velocity: 90 },
      { step: 2, pad: 'RIDE', note: 51, velocity: 80 },
      { step: 4, pad: 'RIDE', note: 51, velocity: 85 },
      { step: 6, pad: 'RIDE', note: 51, velocity: 80 },
      { step: 8, pad: 'RIDE', note: 51, velocity: 95 },
      { step: 10, pad: 'RIDE', note: 51, velocity: 80 },
      { step: 12, pad: 'RIDE', note: 51, velocity: 85 },
      { step: 14, pad: 'RIDE', note: 51, velocity: 80 },
      // Bombo en 1 y 2-y
      { step: 0, pad: 'KICK', note: 36, velocity: 110 },
      { step: 6, pad: 'KICK', note: 36, velocity: 95 },
      // Caja Half-time SOLO en el tiempo 3 (paso 8)
      { step: 8, pad: 'SNARE', note: 38, velocity: 120 },
      // Bombo en paso 10 y 13
      { step: 10, pad: 'KICK', note: 36, velocity: 90 },
      { step: 13, pad: 'KICK', note: 36, velocity: 90 },
    ],
  },
];
