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
  private filter: BiquadFilterNode | null = null;
  private activeVoices: Set<{ osc: OscillatorNode; gainNode: GainNode }> = new Set();
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
        this.masterGain.gain.value = 1.0; // Calibrated master gain

        this.filter = this.audioContext.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 900;

        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.value = -12;
        this.compressor.knee.value = 10;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.003;
        this.compressor.release.value = 0.1;

        // Route: Filter -> Master Gain -> Dynamics Compressor -> Destination
        this.filter.connect(this.masterGain);
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.audioContext.destination);
      }
    }
  }

  private scheduleChord(notes: string[], startTime: number, durationMs: number) {
    if (!this.audioContext || !this.filter) return;

    const duration = durationMs / 1000;
    const now = startTime;
    const voiceGain = 0.2 / Math.max(1, notes.length);

    notes.forEach((noteStr) => {
      const freq = noteToFreq(noteStr);
      if (freq === 0) return;

      const osc = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      osc.connect(gainNode);
      gainNode.connect(this.filter!);

      // Envolvente limpia por voz (evitar saltos discretos a 0)
      gainNode.gain.setValueAtTime(0.0001, now);

      const attackEnd = now + 0.03;
      // Decay point calculation - ensure it is strictly greater than attackEnd
      // To prevent InvalidStateError: DOMException: Failed to execute 'exponentialRampToValueAtTime'
      const decayEnd = Math.max(attackEnd + 0.001, now + duration - 0.05);
      const stopTime = Math.max(decayEnd + 0.001, now + duration);

      gainNode.gain.exponentialRampToValueAtTime(voiceGain, attackEnd); // Attack rápido y suave
      gainNode.gain.exponentialRampToValueAtTime(voiceGain * 0.2, decayEnd); // Decay natural
      gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime); // Cierre a cero sin click

      osc.start(now);
      osc.stop(stopTime);

      const voice = { osc, gainNode };
      this.activeVoices.add(voice);

      // Garbage collection when oscillator finishes
      osc.onended = () => {
        osc.disconnect();
        gainNode.disconnect();
        this.activeVoices.delete(voice);
      };
    });
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

    const now = this.audioContext ? this.audioContext.currentTime : 0;

    this.activeVoices.forEach(voice => {
      try {
        if (this.audioContext) {
          // fade out of 0.02s
          voice.gainNode.gain.cancelScheduledValues(now);
          // Set to current value to avoid jumping
          try {
            voice.gainNode.gain.setValueAtTime(voice.gainNode.gain.value, now);
            voice.gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);
            voice.osc.stop(now + 0.02);
          } catch(err) {
            voice.osc.stop();
          }
        } else {
          voice.osc.stop();
        }
      } catch (e) {
        // Ignore if already stopped
      }
    });
    // Let onended handle disconnection and deletion
  }
}

export const synth = new PolyphonicSynth();
