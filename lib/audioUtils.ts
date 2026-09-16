export const noteToFreq = (noteStr: string): number => {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const regex = /^([A-G][#b]?)([0-9])$/;
  const match = noteStr.match(regex);

  if (!match) return 0;

  let note = match[1];
  let octave = parseInt(match[2], 10);

  // Convert flats to sharps
  if (note.endsWith('b')) {
    const noteChar = note[0];
    const index = notes.indexOf(noteChar);
    if (index === 0) { // Cb -> B, lower octave
      note = 'B';
      octave -= 1;
    } else {
      note = notes[index - 1]; // e.g. E -> index is 4 (E), index - 1 is 3 (D#)
    }
  }

  // Transpose notes in octave 5 or higher down to octave 3 or 4
  if (octave >= 5) {
    if (octave === 5) {
      octave = 4;
    } else {
      // For 6 or higher, alternate between 4 and 3 based on the octave number
      octave = octave % 2 === 0 ? 4 : 3;
    }
  }

  const noteIndex = notes.indexOf(note);
  if (noteIndex === -1) return 0;

  // A4 is 440 Hz
  const a4Index = notes.indexOf('A');
  const a4Octave = 4;

  const semitonesFromA4 = (octave - a4Octave) * 12 + (noteIndex - a4Index);

  return 440 * Math.pow(2, semitonesFromA4 / 12);
};

export class PolyphonicSynth {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeOscillators: OscillatorNode[] = [];

  init() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        this.masterGain = this.audioContext.createGain();
        // Lower overall volume to prevent clipping when multiple notes play
        this.masterGain.gain.value = 0.6;
        this.masterGain.connect(this.audioContext.destination);
      }
    }
  }

  playChord(notes: string[], durationMs: number = 2000) {
    if (!this.audioContext || !this.masterGain) {
      this.init();
      if (!this.audioContext || !this.masterGain) return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.stopAll();

    const now = this.audioContext.currentTime;
    const playTime = durationMs / 1000;

    // Envelope settings
    const attackTime = 0.015;
    const releaseTime = 0.3;
    const sustainLevel = 0.1;

    // Constrain times to fit within the playTime
    const actualReleaseTime = Math.min(releaseTime, playTime / 2);
    const actualAttackTime = Math.min(attackTime, playTime / 4);
    const decayTime = Math.max(0, playTime - actualAttackTime - actualReleaseTime);

    // Master Gain per voice proportional attenuation to prevent clipping
    const chordGain = 0.25 / Math.max(1, notes.length);

    // Warm analog-style lowpass filter for the chord
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800; // between 700 Hz and 1000 Hz
    filter.Q.value = 1.0;
    filter.connect(this.masterGain);

    notes.forEach((noteStr) => {
      const freq = noteToFreq(noteStr);
      if (freq === 0) return;

      const osc1 = this.audioContext!.createOscillator();
      const osc2 = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      // Oscilador 1 (Fundamental): onda 'sine' al 100% de amplitud
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // Oscilador 2 (Color/Armónico): onda 'triangle' a la misma frecuencia
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq, now);

      const mixGain1 = this.audioContext!.createGain();
      mixGain1.gain.value = 1.0;
      const mixGain2 = this.audioContext!.createGain();
      mixGain2.gain.value = 0.18; // 15-20% para darle cuerpo sin estridencia

      osc1.connect(mixGain1);
      osc2.connect(mixGain2);

      mixGain1.connect(gainNode);
      mixGain2.connect(gainNode);

      // ADSR
      // Start at 0 to avoid click
      gainNode.gain.setValueAtTime(0, now);
      // Attack
      gainNode.gain.linearRampToValueAtTime(chordGain, now + actualAttackTime);
      // Decay (spans most of the chord duration down to a soft sustain)
      gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, chordGain * sustainLevel), now + actualAttackTime + decayTime);
      // Release
      gainNode.gain.linearRampToValueAtTime(0, now + playTime);

      gainNode.connect(filter);

      osc1.start(now);
      osc2.start(now);

      // To avoid glitches with rapid stops, add a tiny buffer to stop
      osc1.stop(now + playTime + 0.05);
      osc2.stop(now + playTime + 0.05);

      this.activeOscillators.push(osc1, osc2);
    });
  }

  stopAll() {
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    this.activeOscillators = [];
  }
}

export const synth = new PolyphonicSynth();
