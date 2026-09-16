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
  private compressor: DynamicsCompressorNode | null = null;
  private activeOscillators: Set<OscillatorNode> = new Set();
  private lookaheadTimeout: NodeJS.Timeout | null = null;
  private nextChordIndex: number = 0;
  private nextNoteTime: number = 0;
  private isPlayingProgression: boolean = false;
  private currentChords: { name: string; notes: string[] }[] = [];
  private currentBpm: number = 120;
  private onChordChangeCallback: ((index: number) => void) | null = null;

  init() {
    if (typeof window !== 'undefined' && !this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();

        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.25; // Calibrated master gain

        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.value = -12;
        this.compressor.knee.value = 10;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.1;

        // Route: Master Gain -> Dynamics Compressor -> Destination
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.audioContext.destination);
      }
    }
  }

  private scheduleChord(notes: string[], startTime: number, durationMs: number) {
    if (!this.audioContext || !this.masterGain) return;

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
    const chordGain = 1.0 / Math.max(1, notes.length);

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
      osc1.frequency.setValueAtTime(freq, startTime);

      // Oscilador 2 (Color/Armónico): onda 'triangle' a la misma frecuencia
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq, startTime);

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
      gainNode.gain.setValueAtTime(0, startTime);
      // Attack
      gainNode.gain.linearRampToValueAtTime(chordGain, startTime + actualAttackTime);
      // Decay (spans most of the chord duration down to a soft sustain)
      gainNode.gain.exponentialRampToValueAtTime(Math.max(0.0001, chordGain * sustainLevel), startTime + actualAttackTime + decayTime);
      // Release
      gainNode.gain.linearRampToValueAtTime(0, startTime + playTime);

      gainNode.connect(filter);

      osc1.start(startTime);
      osc2.start(startTime);

      // To avoid glitches with rapid stops, add a tiny buffer to stop
      const stopTime = startTime + playTime + 0.05;
      osc1.stop(stopTime);
      osc2.stop(stopTime);

      this.activeOscillators.add(osc1);
      this.activeOscillators.add(osc2);

      // Garbage collection when oscillator finishes
      const cleanup = () => {
        osc1.disconnect();
        osc2.disconnect();
        mixGain1.disconnect();
        mixGain2.disconnect();
        gainNode.disconnect();
        this.activeOscillators.delete(osc1);
        this.activeOscillators.delete(osc2);
      };

      osc1.onended = cleanup;
      // We don't need to add it to osc2 since they end at the same time and cleanup handles both
    });

    // Disconnect filter after it's done being used
    setTimeout(() => {
        filter.disconnect();
    }, durationMs + 100);
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
    this.scheduleChord(notes, now, durationMs);
  }

  private scheduler() {
    if (!this.audioContext || !this.isPlayingProgression) return;

    // Lookahead schedule window
    const lookahead = 0.1; // seconds
    const scheduleAheadTime = 0.1; // seconds

    while (this.nextNoteTime < this.audioContext.currentTime + scheduleAheadTime) {
      this.scheduleNextChord();
    }

    this.lookaheadTimeout = setTimeout(() => this.scheduler(), lookahead * 1000);
  }

  private scheduleNextChord() {
    if (this.currentChords.length === 0 || !this.audioContext) return;

    const currentChord = this.currentChords[this.nextChordIndex];

    // Calculate duration of one measure (4 beats) in milliseconds
    const beatDurationMs = (60 / this.currentBpm) * 1000;
    const chordDurationMs = beatDurationMs * 4; // Assuming 4 beats per chord

    // Schedule the audio
    this.scheduleChord(currentChord.notes, this.nextNoteTime, chordDurationMs);

    // Schedule UI update
    const chordIndex = this.nextChordIndex;
    const callbackTime = this.nextNoteTime - this.audioContext.currentTime;

    if (this.onChordChangeCallback) {
      if (callbackTime > 0) {
        setTimeout(() => {
          if (this.isPlayingProgression && this.onChordChangeCallback) {
            requestAnimationFrame(() => {
              if (this.onChordChangeCallback) {
                this.onChordChangeCallback(chordIndex);
              }
            });
          }
        }, callbackTime * 1000);
      } else {
        requestAnimationFrame(() => {
          if (this.isPlayingProgression && this.onChordChangeCallback) {
            this.onChordChangeCallback(chordIndex);
          }
        });
      }
    }

    // Advance time and index
    this.nextNoteTime += chordDurationMs / 1000;
    this.nextChordIndex = (this.nextChordIndex + 1) % this.currentChords.length;
  }

  playProgression(chords: { name: string; notes: string[] }[], bpm: number, onChordChange: (index: number) => void) {
    if (!this.audioContext || !this.masterGain) {
      this.init();
      if (!this.audioContext || !this.masterGain) return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.stopAll();

    this.currentChords = chords;
    this.currentBpm = bpm;
    this.onChordChangeCallback = onChordChange;
    this.isPlayingProgression = true;

    this.nextChordIndex = 0;
    this.nextNoteTime = this.audioContext.currentTime + 0.05; // slight delay to start

    this.scheduler();
  }

  stopProgression() {
    this.isPlayingProgression = false;
    if (this.lookaheadTimeout) {
      clearTimeout(this.lookaheadTimeout);
      this.lookaheadTimeout = null;
    }
    this.stopAll();
  }

  stopAll() {
    this.isPlayingProgression = false;
    if (this.lookaheadTimeout) {
      clearTimeout(this.lookaheadTimeout);
      this.lookaheadTimeout = null;
    }

    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) {
        // Ignore if already stopped
      }
    });
    this.activeOscillators.clear();
  }
}

export const synth = new PolyphonicSynth();
