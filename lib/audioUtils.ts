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

  playChord(notes: string[], durationMs: number = 1000) {
    if (!this.audioContext || !this.masterGain) {
      this.init();
      if (!this.audioContext || !this.masterGain) return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.stopAll();

    const now = this.audioContext.currentTime;
    // Envelope settings
    const attackTime = 0.05;
    const releaseTime = 0.8;
    // Play for slightly shorter than the next chord might come, or let it ring based on duration
    const playTime = durationMs / 1000;

    notes.forEach((noteStr) => {
      const freq = noteToFreq(noteStr);
      if (freq === 0) return;

      const osc = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      // Lo-fi rhodes-like sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Simple ADSR
      gainNode.gain.setValueAtTime(0, now);
      // Attack
      gainNode.gain.linearRampToValueAtTime(0.3, now + attackTime);
      // Sustain
      gainNode.gain.setValueAtTime(0.3, now + playTime - releaseTime);
      // Release
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + playTime);

      osc.connect(gainNode);
      gainNode.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + playTime);

      this.activeOscillators.push(osc);
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
