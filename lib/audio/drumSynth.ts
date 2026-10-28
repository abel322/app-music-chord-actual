/**
 * Sintetizador de Percusión en Tiempo Real con Web Audio API.
 * Permite preescucha inmediata de pads Donner, metrónomo de conteo y grooves sin latencia ni librerías externas.
 */

import { DrumPadType } from '@/types/drum'
import { getAudioContext } from '@/lib/hooks/useMetronomeAudio'

class DrumSynthService {
  private getContext(): AudioContext | null {
    return getAudioContext()
  }

  // Reproducir un golpe de percusión por tipo de pad
  public playHit(pad: DrumPadType, velocity: number = 100): void {
    const ctx = this.getContext()
    if (!ctx) return

    const normalizedVel = Math.max(0.1, Math.min(1, velocity / 127))
    const now = ctx.currentTime

    switch (pad) {
      case 'KICK':
        this.playKick(ctx, now, normalizedVel)
        break
      case 'SNARE':
        this.playSnare(ctx, now, normalizedVel)
        break
      case 'SNARE_RIM':
        this.playRim(ctx, now, normalizedVel)
        break
      case 'HIHAT_CLOSED':
        this.playHiHat(ctx, now, normalizedVel, 0.05)
        break
      case 'HIHAT_OPEN':
        this.playHiHat(ctx, now, normalizedVel, 0.35)
        break
      case 'HIHAT_PEDAL':
        this.playHiHat(ctx, now, normalizedVel, 0.08)
        break
      case 'TOM_HIGH':
        this.playTom(ctx, now, normalizedVel, 180, 0.25)
        break
      case 'TOM_MID':
        this.playTom(ctx, now, normalizedVel, 130, 0.3)
        break
      case 'TOM_FLOOR':
        this.playTom(ctx, now, normalizedVel, 85, 0.4)
        break
      case 'CRASH':
        this.playCymbal(ctx, now, normalizedVel, 1.2, 5500)
        break
      case 'RIDE':
        this.playCymbal(ctx, now, normalizedVel, 0.6, 7500)
        break
      default:
        this.playSnare(ctx, now, normalizedVel)
    }
  }

  // Clic de metrónomo (para conteo previo 1, 2, 3, 4)
  public playClick(isFirstBeat: boolean = false, volume: number = 0.8): void {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(isFirstBeat ? 1760 : 1200, now) // A6 o D6

    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.07)
  }

  // Sintetizador de Bombo (Kick)
  private playKick(ctx: AudioContext, time: number, vel: number) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.frequency.setValueAtTime(140, time)
    osc.frequency.exponentialRampToValueAtTime(36, time + 0.08)

    gain.gain.setValueAtTime(1.2 * vel, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(time)
    osc.stop(time + 0.36)
  }

  // Sintetizador de Caja (Snare)
  private playSnare(ctx: AudioContext, time: number, vel: number) {
    // Tono base
    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(180, time)
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1)

    oscGain.gain.setValueAtTime(0.7 * vel, time)
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15)
    osc.connect(oscGain)
    oscGain.connect(ctx.destination)
    osc.start(time)
    osc.stop(time + 0.16)

    // Ruido de bordonero (snare wires)
    const noiseBuffer = this.getNoiseBuffer(ctx)
    const noise = ctx.createBufferSource()
    noise.buffer = noiseBuffer

    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.setValueAtTime(1000, time)

    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(1.0 * vel, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.22)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ctx.destination)

    noise.start(time)
    noise.stop(time + 0.23)
  }

  // Sintetizador de Aro (Rimshot)
  private playRim(ctx: AudioContext, time: number, vel: number) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, time)
    osc.frequency.exponentialRampToValueAtTime(400, time + 0.04)

    gain.gain.setValueAtTime(0.8 * vel, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(time)
    osc.stop(time + 0.07)
  }

  // Sintetizador de Hi-Hat
  private playHiHat(ctx: AudioContext, time: number, vel: number, duration: number) {
    const noise = ctx.createBufferSource()
    noise.buffer = this.getNoiseBuffer(ctx)

    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(7500, time)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.6 * vel, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start(time)
    noise.stop(time + duration + 0.01)
  }

  // Sintetizador de Toms
  private playTom(ctx: AudioContext, time: number, vel: number, startFreq: number, duration: number) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(startFreq, time)
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.5, time + duration)

    gain.gain.setValueAtTime(0.9 * vel, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(time)
    osc.stop(time + duration + 0.02)
  }

  // Sintetizador de Platos (Crash / Ride)
  private playCymbal(ctx: AudioContext, time: number, vel: number, duration: number, cutoff: number) {
    const noise = ctx.createBufferSource()
    noise.buffer = this.getNoiseBuffer(ctx)

    const bandpass = ctx.createBiquadFilter()
    bandpass.type = 'bandpass'
    bandpass.frequency.setValueAtTime(cutoff, time)
    bandpass.Q.setValueAtTime(1.5, time)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.8 * vel, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

    noise.connect(bandpass)
    bandpass.connect(gain)
    gain.connect(ctx.destination)

    noise.start(time)
    noise.stop(time + duration + 0.02)
  }

  // Buffer de Ruido Blanco precargado
  private cachedNoiseBuffer: AudioBuffer | null = null
  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.cachedNoiseBuffer) return this.cachedNoiseBuffer

    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    this.cachedNoiseBuffer = buffer
    return buffer
  }
}

export const drumSynth = new DrumSynthService()
