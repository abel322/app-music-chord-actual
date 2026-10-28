'use client'

/**
 * Motor de Audio y Metrónomo de Cero Latencia (Web Audio API)
 * 
 * Implementa:
 * 1. AudioContext global reutilizable con latencyHint: 'interactive'.
 * 2. Pre-calentamiento (unlock) al primer gesto del usuario (pointerdown, keydown, touchstart).
 * 3. Síntesis pura de oscilador sin retardos con ataque inmediato de 1ms y caída rápida percusiva de 35ms.
 * 4. Frecuencias calibradas: 1600 Hz para pulsos acentuados (compás 1, pulso 4 de cuenta previa) y 1000 Hz para pulsos normales.
 */

let sharedAudioCtx: AudioContext | null = null

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass({ latencyHint: 'interactive' })
    }
  }

  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {})
  }

  return sharedAudioCtx
}

// Escuchar el primer clic / toque en el documento para desbloquear el audio context sin retrasos posteriores
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    try {
      const ctx = getAudioContext()
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {})
      }
      // Reproducir buffer silencioso de 1 muestra para garantizar el encendido completo del hardware de audio en iOS Safari / Android
      if (ctx) {
        const buffer = ctx.createBuffer(1, 1, 22050)
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        source.start(0)
      }
    } catch {
      // Ignorar de forma segura si la política del navegador aún no permite interacción
    }

    window.removeEventListener('pointerdown', unlockAudio)
    window.removeEventListener('keydown', unlockAudio)
    window.removeEventListener('touchstart', unlockAudio)
  }

  window.addEventListener('pointerdown', unlockAudio, { once: true, passive: true })
  window.addEventListener('keydown', unlockAudio, { once: true, passive: true })
  window.addEventListener('touchstart', unlockAudio, { once: true, passive: true })
}

export function playTickSound(ctx: AudioContext, time: number, isAccent: boolean): void {
  try {
    if (!ctx || ctx.state === 'closed') return

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    // Evitar programar en tiempos negativos o pasados si el reloj avanzó
    const playTime = Math.max(time, ctx.currentTime)

    // Frecuencia: 1600 Hz para el acento (tiempo 1), 1000 Hz para pulsos normales
    osc.frequency.setValueAtTime(isAccent ? 1600 : 1000, playTime)

    // Envolvente rápida percusiva (ataque inmediato de 1ms, caída limpia de 35ms)
    gain.gain.setValueAtTime(isAccent ? 0.9 : 0.6, playTime)
    gain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.04)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(playTime)
    osc.stop(playTime + 0.045)
  } catch {
    // Silencioso si ocurre algún error en la capa de audio del sistema
  }
}

export function useMetronomeAudio() {
  return {
    getAudioContext,
    playTickSound,
  }
}
