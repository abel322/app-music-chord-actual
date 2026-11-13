'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface SongSectionAnchor {
  id: string;
  name: string;
  startMeasureIndex: number;
}

export interface UseLiveBandFollowerOptions {
  initialBpm: number;
  beatsPerMeasure?: number;
  totalMeasures: number;
  sections: SongSectionAnchor[];
  sensitivity?: number; // 0.3 (baja/sala muy ruidosa) a 1.0 (alta/acústico)
  onMeasureChange: (measureIndex: number, beatInMeasure: number) => void;
  onSectionJump?: (measureIndex: number, sectionName: string) => void;
}

const normalizeText = (str: string) =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export function useLiveBandFollower({
  initialBpm,
  beatsPerMeasure = 4,
  totalMeasures,
  sections,
  sensitivity = 0.65,
  onMeasureChange,
  onSectionJump,
}: UseLiveBandFollowerOptions) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [liveBpm, setLiveBpm] = useState(initialBpm || 75);
  const [bandStatus, setBandStatus] = useState<'idle' | 'listening' | 'tracking' | 'holding'>('idle');
  const [inputLevel, setInputLevel] = useState(0);
  const [lastVoiceAction, setLastVoiceAction] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFollowingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);

  // Estado interno del motor rítmico elástico (PLL)
  const trackerRef = useRef({
    measureIndex: 0,
    beatPhase: 0, // 0.0 a beatsPerMeasure (ej. 0.0 -> 4.0)
    adaptiveBpm: initialBpm || 75,
    lastFrameTime: 0,
    lastOnsetTime: 0,
    lastSoundTime: 0,
    energyHistory: [] as number[],
    prevSpectrum: null as Float32Array | null,
    lastVoiceTriggerTime: 0,
  });

  const callbacksRef = useRef({
    onMeasureChange,
    onSectionJump,
    sections,
    totalMeasures,
    beatsPerMeasure,
    sensitivity,
    initialBpm,
  });

  useEffect(() => {
    callbacksRef.current = {
      onMeasureChange,
      onSectionJump,
      sections,
      totalMeasures,
      beatsPerMeasure,
      sensitivity,
      initialBpm,
    };
  }, [onMeasureChange, onSectionJump, sections, totalMeasures, beatsPerMeasure, sensitivity, initialBpm]);

  // Permite sincronizar manualmente si el usuario hace clic en un compás mientras sigue activo
  const syncToMeasure = useCallback((measureIndex: number) => {
    const maxMeasure = Math.max(0, (callbacksRef.current.totalMeasures || 1) - 1);
    trackerRef.current.measureIndex = Math.max(0, Math.min(measureIndex, maxMeasure));
    trackerRef.current.beatPhase = 0;
    trackerRef.current.lastSoundTime = performance.now();
    callbacksRef.current.onMeasureChange(trackerRef.current.measureIndex, 1);
  }, []);

  // Calibración manual rápida con 1 toque en el Tiempo 1
  const tapDownbeat = useCallback(() => {
    const now = performance.now();
    const tr = trackerRef.current;
    const elapsedMs = now - tr.lastOnsetTime;

    // Si tocó dentro de un rango razonable de 1 compás o 1 tiempo, ajustar BPM
    const expectedBeatMs = 60000 / tr.adaptiveBpm;
    if (elapsedMs > expectedBeatMs * 0.6 && elapsedMs < expectedBeatMs * 1.5) {
      const measuredBpm = 60000 / elapsedMs;
      const baseBpm = callbacksRef.current.initialBpm || 75;
      const minBpm = Math.max(40, baseBpm * 0.65);
      const maxBpm = Math.min(210, baseBpm * 1.45);
      const clampedBpm = Math.max(minBpm, Math.min(maxBpm, measuredBpm));
      tr.adaptiveBpm = tr.adaptiveBpm * 0.65 + clampedBpm * 0.35;
      setLiveBpm(Math.round(tr.adaptiveBpm));
    }

    tr.beatPhase = 0;
    tr.lastOnsetTime = now;
    tr.lastSoundTime = now;
    setBandStatus('tracking');
    callbacksRef.current.onMeasureChange(tr.measureIndex, 1);
  }, []);

  const stopFollowing = useCallback(() => {
    isFollowingRef.current = false;
    setIsFollowing(false);
    setBandStatus('idle');
    setInputLevel(0);

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
  }, []);

  const startFollowing = useCallback(async (startFromMeasure = 0) => {
    stopFollowing();
    setErrorMsg(null);

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('El navegador no permite acceso al micrófono.');
      return;
    }

    try {
      // Solicitar micrófono sin filtros de voz para capturar ataques limpios de instrumentos
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') await ctx.resume();

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.25;
      source.connect(analyser);

      const baseBpm = callbacksRef.current.initialBpm || 75;
      const now = performance.now();

      trackerRef.current = {
        measureIndex: startFromMeasure,
        beatPhase: 0,
        adaptiveBpm: baseBpm,
        lastFrameTime: now,
        lastOnsetTime: now,
        lastSoundTime: now,
        energyHistory: [],
        prevSpectrum: new Float32Array(analyser.frequencyBinCount),
        lastVoiceTriggerTime: 0,
      };

      streamRef.current = stream;
      audioCtxRef.current = ctx;
      isFollowingRef.current = true;
      setIsFollowing(true);
      setLiveBpm(Math.round(baseBpm));
      setBandStatus('listening');
      callbacksRef.current.onMeasureChange(startFromMeasure, 1);

      // 1. Iniciar Anclaje por Voz Paralelo (opcional si el navegador lo soporta)
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'es-ES';
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            const triggerNow = Date.now();
            if (triggerNow - trackerRef.current.lastVoiceTriggerTime < 1400) return;

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const raw = event.results[i][0]?.transcript || '';
              const clean = normalizeText(raw).split(/\s+/).slice(-3).join(' ');
              if (!clean) continue;

              const { sections: secs, onSectionJump: jumpCb } = callbacksRef.current;
              const currM = trackerRef.current.measureIndex;

              // Comando de repetición ("repetir", "otra vez", "de nuevo", "repite")
              if (/\b(repetir|repite|otra vez|de nuevo)\b/.test(clean)) {
                const currentSec = [...secs].reverse().find((s) => s.startMeasureIndex <= currM) || secs[0];
                if (currentSec) {
                  trackerRef.current.lastVoiceTriggerTime = triggerNow;
                  trackerRef.current.measureIndex = currentSec.startMeasureIndex;
                  trackerRef.current.beatPhase = 0;
                  setLastVoiceAction(`↻ ${currentSec.name}`);
                  jumpCb?.(currentSec.startMeasureIndex, currentSec.name);
                  return;
                }
              }

              // Mapeo flexible de sinónimos comunes en español
              let queryText = clean;
              if (clean.includes('verso')) queryText += ' estrofa';
              if (clean.includes('estribillo')) queryText += ' coro';
              if (clean.includes('pre coro') || clean.includes('precoro')) queryText += ' precoro';

              const matched = secs.filter((s) => {
                const sNorm = normalizeText(s.name);
                return queryText.includes(sNorm) || (sNorm.length >= 4 && queryText.includes(sNorm)) || (clean.length >= 4 && sNorm.includes(clean));
              });

              if (matched.length > 0) {
                const target = matched.find((s) => s.startMeasureIndex > currM) || matched[0];
                trackerRef.current.lastVoiceTriggerTime = triggerNow;
                trackerRef.current.measureIndex = target.startMeasureIndex;
                trackerRef.current.beatPhase = 0;
                setLastVoiceAction(`🎙️ ${target.name}`);
                jumpCb?.(target.startMeasureIndex, target.name);
                return;
              }
            }
          };

          recognition.onerror = () => {
            // Ignorar errores transitorios de micrófono o silencios
          };

          recognition.onend = () => {
            if (isFollowingRef.current) {
              try {
                recognition.start();
              } catch {}
            }
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch (e) {
          console.warn('SpeechRecognition no disponible o bloqueado:', e);
        }
      }

      // 2. Bucle DSP en Tiempo Real (Detección de Ataques + Reloj Elástico PLL + Freno en Silencios)
      const freqData = new Float32Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.fftSize);
      const minBpm = Math.max(40, baseBpm * 0.65);
      const maxBpm = Math.min(210, baseBpm * 1.45);

      const processAudioFrame = () => {
        if (!isFollowingRef.current) return;

        const frameNow = performance.now();
        const tr = trackerRef.current;
        const dtSec = Math.min(0.1, (frameNow - tr.lastFrameTime) / 1000);
        tr.lastFrameTime = frameNow;

        analyser.getFloatFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        // Calcular energía RMS instantánea para detectar si la banda está tocando o en silencio
        let sumSq = 0;
        for (let i = 0; i < timeData.length; i++) {
          const norm = (timeData[i] - 128) / 128;
          sumSq += norm * norm;
        }
        const rms = Math.sqrt(sumSq / timeData.length);
        setInputLevel(Math.min(100, Math.round(rms * 420)));

        // Calcular flujo espectral positivo (Spectral Flux) en frecuencias musicales (60Hz - 4.5kHz)
        let flux = 0;
        const prev = tr.prevSpectrum;
        if (prev) {
          const startBin = 2; // ~86 Hz
          const endBin = Math.min(110, freqData.length); // ~4.7 kHz
          for (let b = startBin; b < endBin; b++) {
            const rawDb = Number.isFinite(freqData[b]) ? freqData[b] : -100;
            const mag = Math.max(0, rawDb + 95);
            const diff = mag - prev[b];
            if (diff > 0) flux += diff;
            prev[b] = mag;
          }
        }

        tr.energyHistory.push(flux);
        if (tr.energyHistory.length > 35) tr.energyHistory.shift();

        const avgFlux =
          tr.energyHistory.reduce((acc, v) => acc + v, 0) / Math.max(1, tr.energyHistory.length);

        const sens = callbacksRef.current.sensitivity || 0.65;
        const rmsThreshold = 0.012 * (1.35 - sens); // Umbral de silencio adaptable
        const onsetThreshold = avgFlux * (1.85 - sens * 0.55) + 18;

        const isSoundPresent = rms > rmsThreshold || flux > onsetThreshold * 0.75;
        if (isSoundPresent) {
          tr.lastSoundTime = frameNow;
        }

        const expectedBeatMs = 60000 / tr.adaptiveBpm;
        const timeSinceLastOnset = frameNow - tr.lastOnsetTime;

        // Detectar ataque rítmico válido (con período refractario del 58% de un tiempo para ignorar subdivisión rápida)
        if (flux > onsetThreshold && rms > rmsThreshold && timeSinceLastOnset > expectedBeatMs * 0.58) {
          tr.lastOnsetTime = frameNow;

          // Si el ataque cae cerca de un pulso entero (0.72x a 1.38x del beat esperado), actualizar BPM elástico
          if (timeSinceLastOnset >= expectedBeatMs * 0.72 && timeSinceLastOnset <= expectedBeatMs * 1.38) {
            const instantBpm = 60000 / timeSinceLastOnset;
            const clampedBpm = Math.max(minBpm, Math.min(maxBpm, instantBpm));
            tr.adaptiveBpm = tr.adaptiveBpm * 0.78 + clampedBpm * 0.22;
            setLiveBpm(Math.round(tr.adaptiveBpm));
          }

          // Corrección suave de fase hacia el pulso entero más cercano para que no se desplace del beat
          const nearestBeat = Math.round(tr.beatPhase);
          const phaseError = nearestBeat - tr.beatPhase;
          if (Math.abs(phaseError) < 0.38) {
            tr.beatPhase += phaseError * 0.45;
          }
        }

        // ANTI-ADELANTO: Si hay silencio por más de 1.8 tiempos (calderón o pausa entre partes), congelar el compás actual
        const silenceDurationMs = frameNow - tr.lastSoundTime;
        const isHoldingOnSilence = silenceDurationMs > expectedBeatMs * 1.8;

        if (isHoldingOnSilence) {
          setBandStatus('holding');
        } else {
          setBandStatus('tracking');
          const prevBeatInt = Math.floor(tr.beatPhase);
          const beatsPerSecond = tr.adaptiveBpm / 60;
          tr.beatPhase += beatsPerSecond * dtSec;

          const spm = callbacksRef.current.beatsPerMeasure || 4;
          if (tr.beatPhase >= spm) {
            tr.beatPhase -= spm;
            const nextMeasure = tr.measureIndex + 1;
            const total = callbacksRef.current.totalMeasures || 0;
            if (total > 0 && nextMeasure >= total) {
              // Al finalizar el último compás, detener seguimiento cleanly
              stopFollowing();
              return;
            }
            tr.measureIndex = nextMeasure;
            callbacksRef.current.onMeasureChange(tr.measureIndex, 1);
          } else {
            const currentBeatInt = Math.floor(tr.beatPhase);
            if (currentBeatInt !== prevBeatInt) {
              callbacksRef.current.onMeasureChange(tr.measureIndex, currentBeatInt + 1);
            }
          }
        }

        rafIdRef.current = requestAnimationFrame(processAudioFrame);
      };

      rafIdRef.current = requestAnimationFrame(processAudioFrame);
    } catch (err) {
      setErrorMsg('No se pudo acceder al micrófono. Verifica los permisos del navegador.');
      stopFollowing();
    }
  }, [stopFollowing]);

  useEffect(() => {
    return () => stopFollowing();
  }, [stopFollowing]);

  return {
    isFollowing,
    liveBpm,
    bandStatus,
    inputLevel,
    lastVoiceAction,
    errorMsg,
    startFollowing,
    stopFollowing,
    syncToMeasure,
    tapDownbeat,
  };
}

