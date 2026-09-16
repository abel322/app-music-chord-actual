export interface ChordDef {
  name: string;
  notes: string[];
}

export interface ProgressionDef {
  id: string;
  name: string;
  genre: string;
  key: string;
  bpm: number;
  chords: ChordDef[];
}

export const GENRES = [
  'All',
  'Lo-Fi / Chill',
  'Neo-Soul & R&B',
  'Trap / Hip-Hop',
  'Jazz Essentials',
  'Pop / Rock'
];

export const chordProgressions: ProgressionDef[] = [
  // --- Lo-Fi / Chill ---
  {
    id: 'lofi-1',
    name: 'Late Night Study',
    genre: 'Lo-Fi / Chill',
    key: 'Db',
    bpm: 75,
    chords: [
      { name: 'Dbmaj9', notes: ['Db3', 'F3', 'Ab3', 'C4', 'Eb4'] },
      { name: 'C7aug', notes: ['C3', 'E3', 'Bb3', 'Ab4'] },
      { name: 'Fm11', notes: ['F2', 'C3', 'Eb3', 'Ab3', 'Bb3', 'Eb4'] },
      { name: 'Ebm7', notes: ['Eb3', 'Gb3', 'Bb3', 'Db4'] },
      { name: 'Ab13', notes: ['Ab2', 'Gb3', 'C4', 'F4'] }
    ]
  },
  {
    id: 'lofi-2',
    name: 'Morning Coffee',
    genre: 'Lo-Fi / Chill',
    key: 'Eb',
    bpm: 80,
    chords: [
      { name: 'Ebmaj7', notes: ['Eb3', 'G3', 'Bb3', 'D4'] },
      { name: 'Cm9', notes: ['C3', 'Eb3', 'G3', 'Bb3', 'D4'] },
      { name: 'Fm9', notes: ['F2', 'Ab3', 'C4', 'Eb4', 'G4'] },
      { name: 'Bb13', notes: ['Bb2', 'Ab3', 'D4', 'G4'] }
    ]
  },
  {
    id: 'lofi-sunset-rain',
    name: 'Sunset Rain',
    genre: 'Lo-Fi / Chill',
    key: 'D',
    bpm: 72,
    chords: [
      { name: 'Dmaj7', notes: ['D3', 'F#3', 'A3', 'C#4'] },
      { name: 'C#7', notes: ['C#3', 'E#3', 'G#3', 'B3'] },
      { name: 'F#m7', notes: ['F#2', 'C#3', 'E3', 'A3', 'E4'] },
      { name: 'A7', notes: ['A2', 'E3', 'G3', 'C#4'] }
    ]
  },
  {
    id: 'lofi-cozy-nostalgia',
    name: 'Cozy Nostalgia',
    genre: 'Lo-Fi / Chill',
    key: 'Ab',
    bpm: 70,
    chords: [
      { name: 'Bbm9', notes: ['Bb2', 'F3', 'Ab3', 'C4', 'Db4'] },
      { name: 'Eb9', notes: ['Eb3', 'G3', 'Db4', 'F4'] },
      { name: 'Abmaj7', notes: ['Ab2', 'Eb3', 'G3', 'C4'] },
      { name: 'Dbmaj7', notes: ['Db3', 'F3', 'Ab3', 'C4'] }
    ]
  },
  {
    id: 'lofi-midnight-tape',
    name: 'Midnight Tape',
    genre: 'Lo-Fi / Chill',
    key: 'C',
    bpm: 75,
    chords: [
      { name: 'Fmaj7', notes: ['F2', 'C3', 'E3', 'A3', 'C4'] },
      { name: 'Em7', notes: ['E2', 'B2', 'D3', 'G3', 'B3'] },
      { name: 'Dm7', notes: ['D3', 'A3', 'C4', 'F4'] },
      { name: 'Cmaj7', notes: ['C3', 'G3', 'B3', 'E4'] }
    ]
  },
  {
    id: 'lofi-tokyo-drift-chill',
    name: 'Tokyo Drift Chill',
    genre: 'Lo-Fi / Chill',
    key: 'G',
    bpm: 78,
    chords: [
      { name: 'Gmaj7', notes: ['G2', 'D3', 'F#3', 'B3'] },
      { name: 'F#7', notes: ['F#2', 'C#3', 'E3', 'A#3'] },
      { name: 'Bm7', notes: ['B2', 'F#3', 'A3', 'D4'] },
      { name: 'E9', notes: ['E2', 'G#3', 'D4', 'F#4'] }
    ]
  },

  // --- Neo-Soul & R&B ---
  {
    id: 'neosoul-1',
    name: 'Silky Smooth',
    genre: 'Neo-Soul & R&B',
    key: 'Am',
    bpm: 85,
    chords: [
      { name: 'Am11', notes: ['A2', 'G3', 'C4', 'D4', 'E4'] },
      { name: 'D9', notes: ['D3', 'F#3', 'C4', 'E4'] },
      { name: 'Gmaj9', notes: ['G2', 'F#3', 'A3', 'B3', 'D4'] },
      { name: 'Cmaj9', notes: ['C3', 'E3', 'G3', 'B3', 'D4'] },
      { name: 'F#m7b5', notes: ['F#2', 'E3', 'A3', 'C4'] },
      { name: 'B7#9', notes: ['B2', 'D#3', 'A3', 'D4'] }
    ]
  },
  {
    id: 'neosoul-2',
    name: "D'Angelo Vibes",
    genre: 'Neo-Soul & R&B',
    key: 'Fm',
    bpm: 78,
    chords: [
      { name: 'Fm9', notes: ['F2', 'Ab3', 'C4', 'Eb4', 'G4'] },
      { name: 'Bbm9', notes: ['Bb2', 'Db3', 'F3', 'Ab3', 'C4'] },
      { name: 'Eb13', notes: ['Eb3', 'Db4', 'G4', 'C5'] },
      { name: 'Abmaj9', notes: ['Ab2', 'G3', 'C4', 'Eb4'] }
    ]
  },
  {
    id: 'neosoul-soulful-cadence',
    name: 'Soulful Cadence',
    genre: 'Neo-Soul & R&B',
    key: 'Db',
    bpm: 82,
    chords: [
      { name: 'Ebm9', notes: ['Eb2', 'Bb2', 'Db3', 'F3', 'Gb3'] },
      { name: 'Ab13', notes: ['Ab2', 'Gb3', 'C4', 'F4'] },
      { name: 'Dbmaj9', notes: ['Db3', 'F3', 'Ab3', 'C4', 'Eb4'] },
      { name: 'Bb7#9', notes: ['Bb2', 'D3', 'Ab3', 'Db4'] }
    ]
  },
  {
    id: 'neosoul-velvet-touch',
    name: 'Velvet Touch',
    genre: 'Neo-Soul & R&B',
    key: 'E',
    bpm: 76,
    chords: [
      { name: 'F#m9', notes: ['F#2', 'C#3', 'E3', 'G#3', 'A3'] },
      { name: 'B13', notes: ['B2', 'A3', 'D#4', 'G#4'] },
      { name: 'Emaj9', notes: ['E2', 'G#2', 'D#3', 'F#3', 'G#3'] },
      { name: 'C#7alt', notes: ['C#3', 'B3', 'E4', 'G4'] }
    ]
  },
  {
    id: 'neosoul-butter-chords',
    name: 'Butter Chords',
    genre: 'Neo-Soul & R&B',
    key: 'Eb',
    bpm: 84,
    chords: [
      { name: 'Abmaj9', notes: ['Ab2', 'G3', 'Bb3', 'C4', 'Eb4'] },
      { name: 'G7#5', notes: ['G2', 'F3', 'B3', 'Eb4'] },
      { name: 'Cm9', notes: ['C3', 'G3', 'Bb3', 'D4', 'Eb4'] },
      { name: 'F13', notes: ['F2', 'Eb3', 'A3', 'D4'] }
    ]
  },
  {
    id: 'neosoul-golden-hour-glow',
    name: 'Golden Hour Glow',
    genre: 'Neo-Soul & R&B',
    key: 'C',
    bpm: 80,
    chords: [
      { name: 'Dm9', notes: ['D3', 'A3', 'C4', 'E4', 'F4'] },
      { name: 'G13', notes: ['G2', 'F3', 'B3', 'E4'] },
      { name: 'Cmaj9', notes: ['C3', 'G3', 'B3', 'D4', 'E4'] },
      { name: 'A7b13', notes: ['A2', 'G3', 'C#4', 'F4'] }
    ]
  },

  // --- Trap / Hip-Hop ---
  {
    id: 'trap-1',
    name: 'Dark Matter',
    genre: 'Trap / Hip-Hop',
    key: 'Cm',
    bpm: 140,
    chords: [
      { name: 'Cm', notes: ['C3', 'G3', 'C4', 'Eb4'] },
      { name: 'Ab', notes: ['Ab2', 'Eb3', 'Ab3', 'C4'] },
      { name: 'Fm', notes: ['F2', 'C3', 'F3', 'Ab3'] },
      { name: 'G', notes: ['G2', 'D3', 'G3', 'B3'] }
    ]
  },
  {
    id: 'trap-2',
    name: 'Moody Bounce',
    genre: 'Trap / Hip-Hop',
    key: 'Em',
    bpm: 130,
    chords: [
      { name: 'Em', notes: ['E2', 'B2', 'E3', 'G3'] },
      { name: 'Cmaj7', notes: ['C3', 'G3', 'B3', 'E4'] },
      { name: 'Am7', notes: ['A2', 'E3', 'G3', 'C4'] },
      { name: 'B7', notes: ['B2', 'F#3', 'A3', 'D#4'] }
    ]
  },
  {
    id: 'trap-dark-phantom',
    name: 'Dark Phantom',
    genre: 'Trap / Hip-Hop',
    key: 'Am',
    bpm: 130,
    chords: [
      { name: 'Am', notes: ['A2', 'E3', 'A3', 'C4'] },
      { name: 'F', notes: ['F2', 'C3', 'F3', 'A3'] },
      { name: 'Dm', notes: ['D3', 'A3', 'D4', 'F4'] },
      { name: 'E7', notes: ['E2', 'B2', 'E3', 'G#3', 'D4'] }
    ]
  },
  {
    id: 'trap-808-grim',
    name: '808 Grim',
    genre: 'Trap / Hip-Hop',
    key: 'Cm',
    bpm: 140,
    chords: [
      { name: 'Cm', notes: ['C3', 'G3', 'C4', 'Eb4'] },
      { name: 'Ab', notes: ['Ab2', 'Eb3', 'Ab3', 'C4'] },
      { name: 'Fm', notes: ['F2', 'C3', 'F3', 'Ab3'] },
      { name: 'G', notes: ['G2', 'D3', 'G3', 'B3'] }
    ]
  },
  {
    id: 'trap-ovo-nights',
    name: 'OVO Nights',
    genre: 'Trap / Hip-Hop',
    key: 'Bm',
    bpm: 120,
    chords: [
      { name: 'Bm', notes: ['B2', 'F#3', 'B3', 'D4'] },
      { name: 'Gmaj7', notes: ['G2', 'D3', 'F#3', 'B3'] },
      { name: 'Em', notes: ['E2', 'B2', 'E3', 'G3'] },
      { name: 'F#m', notes: ['F#2', 'C#3', 'F#3', 'A3'] }
    ]
  },
  {
    id: 'trap-drill-tension',
    name: 'Drill Tension',
    genre: 'Trap / Hip-Hop',
    key: 'D#m',
    bpm: 142,
    chords: [
      { name: 'D#m', notes: ['D#3', 'A#3', 'D#4', 'F#4'] },
      { name: 'B', notes: ['B2', 'F#3', 'B3', 'D#4'] },
      { name: 'G#m', notes: ['G#2', 'D#3', 'G#3', 'B3'] },
      { name: 'A#m', notes: ['A#2', 'F3', 'A#3', 'C#4'] }
    ]
  },

  // --- Jazz Essentials ---
  {
    id: 'jazz-1',
    name: 'Classic ii-V-I',
    genre: 'Jazz Essentials',
    key: 'C',
    bpm: 110,
    chords: [
      { name: 'Dm7', notes: ['D3', 'F3', 'A3', 'C4'] },
      { name: 'G7', notes: ['G2', 'F3', 'B3', 'D4'] },
      { name: 'Cmaj7', notes: ['C3', 'E3', 'G3', 'B3'] },
      { name: 'C6', notes: ['C3', 'E3', 'G3', 'A3'] }
    ]
  },
  {
    id: 'jazz-2',
    name: 'Minor Turnaround',
    genre: 'Jazz Essentials',
    key: 'Cm',
    bpm: 120,
    chords: [
      { name: 'Dm7b5', notes: ['D3', 'F3', 'Ab3', 'C4'] },
      { name: 'G7b9', notes: ['G2', 'F3', 'Ab3', 'B3'] },
      { name: 'Cm6', notes: ['C3', 'Eb3', 'G3', 'A3'] },
      { name: 'A7alt', notes: ['A2', 'G3', 'Db4', 'F4'] }
    ]
  },
  {
    id: 'jazz-standard-major-251',
    name: 'Standard Major II-V-I',
    genre: 'Jazz Essentials',
    key: 'C',
    bpm: 110,
    chords: [
      { name: 'Dm7', notes: ['D3', 'F3', 'A3', 'C4'] },
      { name: 'G7', notes: ['G2', 'F3', 'B3', 'D4'] },
      { name: 'Cmaj7', notes: ['C3', 'E3', 'G3', 'B3'] },
      { name: 'A7', notes: ['A2', 'E3', 'G3', 'C#4'] }
    ]
  },
  {
    id: 'jazz-standard-minor-251',
    name: 'Standard Minor II-V-i',
    genre: 'Jazz Essentials',
    key: 'Cm',
    bpm: 100,
    chords: [
      { name: 'Dm7b5', notes: ['D3', 'F3', 'Ab3', 'C4'] },
      { name: 'G7b9', notes: ['G2', 'F3', 'Ab3', 'B3'] },
      { name: 'Cm7', notes: ['C3', 'G3', 'Bb3', 'Eb4'] },
      { name: 'C7', notes: ['C3', 'G3', 'Bb3', 'E4'] }
    ]
  },
  {
    id: 'jazz-bird-blues-snippet',
    name: 'Bird Blues snippet',
    genre: 'Jazz Essentials',
    key: 'F',
    bpm: 130,
    chords: [
      { name: 'Fmaj7', notes: ['F2', 'E3', 'A3', 'C4'] },
      { name: 'Em7b5', notes: ['E3', 'G3', 'Bb3', 'D4'] },
      { name: 'A7', notes: ['A2', 'G3', 'C#4', 'E4'] },
      { name: 'Dm7', notes: ['D3', 'F3', 'C4', 'E4'] },
      { name: 'G7', notes: ['G2', 'F3', 'B3', 'D4'] },
      { name: 'C7', notes: ['C3', 'E3', 'Bb3', 'D4'] }
    ]
  },
  {
    id: 'jazz-coltrane-turnaround',
    name: 'Coltrane Turnaround',
    genre: 'Jazz Essentials',
    key: 'C',
    bpm: 120,
    chords: [
      { name: 'Cmaj7', notes: ['C3', 'E3', 'G3', 'B3'] },
      { name: 'Eb7', notes: ['Eb3', 'G3', 'Bb3', 'Db4'] },
      { name: 'Abmaj7', notes: ['Ab2', 'Eb3', 'G3', 'C4'] },
      { name: 'B7', notes: ['B2', 'D#3', 'A3', 'C#4'] },
      { name: 'Emaj7', notes: ['E2', 'D#3', 'G#3', 'B3'] },
      { name: 'G7', notes: ['G2', 'F3', 'B3', 'D4'] }
    ]
  },

  // --- Pop / Rock ---
  {
    id: 'pop-1',
    name: 'Four Chords',
    genre: 'Pop / Rock',
    key: 'C',
    bpm: 120,
    chords: [
      { name: 'C', notes: ['C3', 'E3', 'G3', 'C4'] },
      { name: 'G', notes: ['G2', 'D3', 'G3', 'B3'] },
      { name: 'Am', notes: ['A2', 'E3', 'A3', 'C4'] },
      { name: 'F', notes: ['F2', 'C3', 'F3', 'A3'] }
    ]
  },
  {
    id: 'pop-2',
    name: 'Epic Anthem',
    genre: 'Pop / Rock',
    key: 'F',
    bpm: 128,
    chords: [
      { name: 'F', notes: ['F2', 'C3', 'F3', 'A3'] },
      { name: 'C', notes: ['C3', 'E3', 'G3', 'C4'] },
      { name: 'Dm', notes: ['D3', 'F3', 'A3', 'D4'] },
      { name: 'Bb', notes: ['Bb2', 'F3', 'Bb3', 'D4'] }
    ]
  },
  {
    id: 'pop-classic-anthem',
    name: 'Classic Anthem (I-V-vi-IV)',
    genre: 'Pop / Rock',
    key: 'C',
    bpm: 120,
    chords: [
      { name: 'C', notes: ['C3', 'E3', 'G3', 'C4'] },
      { name: 'G', notes: ['G2', 'D3', 'G3', 'B3'] },
      { name: 'Am', notes: ['A2', 'E3', 'A3', 'C4'] },
      { name: 'F', notes: ['F2', 'C3', 'F3', 'A3'] }
    ]
  },
  {
    id: 'pop-emotional-lift',
    name: 'Emotional Lift (vi-IV-I-V)',
    genre: 'Pop / Rock',
    key: 'C',
    bpm: 110,
    chords: [
      { name: 'Am', notes: ['A2', 'E3', 'A3', 'C4'] },
      { name: 'F', notes: ['F2', 'C3', 'F3', 'A3'] },
      { name: 'C', notes: ['C3', 'E3', 'G3', 'C4'] },
      { name: 'G', notes: ['G2', 'D3', 'G3', 'B3'] }
    ]
  },
  {
    id: 'pop-punk-drive',
    name: 'Pop Punk Drive (I-IV-vi-V)',
    genre: 'Pop / Rock',
    key: 'E',
    bpm: 145,
    chords: [
      { name: 'E', notes: ['E2', 'B2', 'E3', 'G#3'] },
      { name: 'A', notes: ['A2', 'E3', 'A3', 'C#4'] },
      { name: 'C#m', notes: ['C#3', 'G#3', 'C#4', 'E4'] },
      { name: 'B', notes: ['B2', 'F#3', 'B3', 'D#4'] }
    ]
  },
  {
    id: 'pop-acoustic-warmth',
    name: 'Acoustic Warmth (I-vi-IV-V)',
    genre: 'Pop / Rock',
    key: 'G',
    bpm: 95,
    chords: [
      { name: 'G', notes: ['G2', 'D3', 'G3', 'B3'] },
      { name: 'Em', notes: ['E2', 'B2', 'E3', 'G3'] },
      { name: 'C', notes: ['C3', 'E3', 'G3', 'C4'] },
      { name: 'D', notes: ['D3', 'A3', 'D4', 'F#4'] }
    ]
  }
];
