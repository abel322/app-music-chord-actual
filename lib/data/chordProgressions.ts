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
  }
];
