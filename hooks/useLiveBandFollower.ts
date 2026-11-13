'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface SongSectionAnchor {
  id: string;
  name: string;
  startMeasureIndex: number;
}

export type FollowStepMode = 'beats' | 'single_pulse_per_measure';
export type RoomEnvironment = 'solo_acoustic' | 'full_band';

export interface UseLiveBandFollowerOptions {
  initialBpm: number;
  beatsPerMeasure?: number;
  totalMeasures: number;
  sections: SongSectionAnchor[];
  environment?: RoomEnvironment;
  stepMode?: FollowStepMode;
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
  environment = 'full_band',
  stepMode = 'beats',
  onMeasureChange,
  onSectionJump,
}: UseLiveBandFollowerOptions) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [liveBpm, setLiveBpm] = useState(initialBpm || 75);
  const [bandStatus, setBandStatus] = useState<'idle' | 'listening' | 'tracking' | 'holding'>('idle');
  const [inputLevel, setInputLevel] = useState(0);
  const [heardTranscript, setHeardTranscript] = useState('');
  const [lastVoiceAction, setLastVoiceAction] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isFollowingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const voiceTimerRef = useRef<number | null>(null);

  const trackerRef = useRef({
    measureIndex: 0,
    beatPhase: 0,
    adaptiveBpm: initialBpm || 75,
    lastFrameTime: 0,
    lastOnsetTime: 0,
    lastSoundTime: 0,
    noiseFloorRms: 0.003,
    calibrationSamples: [] as number[],
    fluxHistory: [] as number[],
    prevSpectrum: null as Float32Array | null,
    lastVoiceTriggerTime: 0,
    hasStartedFirstAttack: false,
  });

  const callbacksRef = useRef({
    onMeasureChange,
    onSectionJump,
    sections,
    totalMeasures,
    beatsPerMeasure,
    environment,
    stepMode,
    initialBpm,
  });

  useEffect(() => {
    callbacksRef.current = {
      onMeasureChange,
      onSectionJump,
      sections,
      totalMeasures,
      beatsPerMeasure,
      environment,
      stepMode,
      initialBpm,
    };
  }, [onMeasureChange, onSectionJump, sections, totalMeasures, beatsPerMeasure, environment, stepMode, initialBpm]);

  const syncToMeasure = useCallback((measureIndex: number) => {
    const maxMeasure = Math.max(0, (callbacksRef.current.totalMeasures || 1) - 1);
    const clamped = Math.max(0, Math.min(measureIndex, maxMeasure));
    trackerRef.current.measureIndex = clamped;
    trackerRef.current.beatPhase = 0;
    trackerRef.current.lastSoundTime = performance.now();
    trackerRef.current.hasStartedFirstAttack = true;
    callbacksRef.current.onMeasureChange(clamped, 1);
  }, []);

  const tapDownbeat = useCallback(() => {
    const now = performance.now();
    const tr = trackerRef.current;
    const elapsedMs = now - tr.lastOnsetTime;
    const expectedBeatMs = 60000 / tr.adaptiveBpm;

    if (elapsedMs > expectedBeatMs * 0.55 && elapsedMs < expectedBeatMs * 1.6) {
      const measuredBpm = 60000 / elapsedMs;
      const baseBpm = callbacksRef.current.initialBpm || 75;
      const minBpm = Math.max(40, baseBpm * 0.6);
      const maxBpm = Math.min(210, baseBpm * 1.5);
      const clampedBpm = Math.max(minBpm, Math.min(maxBpm, measuredBpm));
      tr.adaptiveBpm = tr.adaptiveBpm * 0.65 + clampedBpm * 0.35;
      setLiveBpm(Math.round(tr.adaptiveBpm));
    }

    tr.beatPhase = 0;
    tr.lastOnsetTime = now;
    tr.lastSoundTime = now;
    tr.hasStartedFirstAttack = true;
    setBandStatus('tracking');
    callbacksRef.current.onMeasureChange(tr.measureIndex, 1);
  }, []);

  const stopFollowing = useCallback(() => {
    isFollowingRef.current = false;
    setIsFollowing(false);
    setBandStatus('idle');
    setInputLevel(0);

    if (voiceTimerRef.current) {
      clearTimeout(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch {}
      audioCtxRef.current = null;
    }
  }, []);

  const startVoiceRecognition = useCallback(() => {
    if (typeof window === 'undefined' || !isFollowingRef.current) return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const raw = event.results[i][0]?.transcript || '';
        if (!raw.trim()) continue;
        setHeardTranscript(raw.trim());

        const triggerNow = Date.now();
        if (triggerNow - trackerRef.current.lastVoiceTriggerTime < 1200) continue;

        const clean = normalizeText(raw).split(/\s+/).slice(-3).join(' ');
        const { sections: secs, onSectionJump: jumpCb } = callbacksRef.current;
        const currM = trackerRef.current.measureIndex;

        if (/\b(repetir|repite|otra vez|de nuevo)\b/.test(clean)) {
          const currentSec = [...secs].reverse().find((s) => s.startMeasureIndex <= currM) || secs[0];
          if (currentSec) {
            trackerRef.current.lastVoiceTriggerTime = triggerNow;
            trackerRef.current.measureIndex = currentSec.startMeasureIndex;
            trackerRef.current.beatPhase = 0;
            trackerRef.current.hasStartedFirstAttack = true;
            setLastVoiceAction(`↻ ${currentSec.name}`);
            jumpCb?.(currentSec.startMeasureIndex, currentSec.name);
            return;
          }
        }

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
          trackerRef.current.hasStartedFirstAttack = true;
          setLastVoiceAction(`🎙️ ${target.name}`);
          jumpCb?.(target.startMeasureIndex, target.name);
          return;
        }
      }
    };

    recognition.onend = () => {
      if (isFollowingRef.current) {
        voiceTimerRef.current = window.setTimeout(() => {
          try {
            recognition.start();
          } catch {}
        }, 250);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {}
  }, []);

  const startFollowing = useCallback(
    async (startFromMeasure = 0) => {
      stopFollowing();
      setErrorMsg(null);
      setHeardTranscript('');
      setLastVoiceAction('');

      if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setErrorMsg('El navegador no permite acceso al micrófono.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: true,
          },
        });

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') await ctx.resume();

        const source = ctx.createMediaStreamSource(stream);
        const micBoost = ctx.createGain();
        micBoost.gain.setValueAtTime(3.2, ctx.currentTime);

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.2;

        source.connect(micBoost);
        micBoost.connect(analyser);

        const baseBpm = callbacksRef.current.initialBpm || 75;
        const now = performance.now();
        const binHz = ctx.sampleRate / analyser.fftSize; // ~43Hz por bin a 44.1kHz

        trackerRef.current = {
          measureIndex: startFromMeasure,
          beatPhase: 0,
          adaptiveBpm: baseBpm,
          lastFrameTime: now,
          lastOnsetTime: now - 1000,
          lastSoundTime: now,
          noiseFloorRms: 0.003,
          calibrationSamples: [],
          fluxHistory: [],
          prevSpectrum: new Float32Array(analyser.frequencyBinCount),
          lastVoiceTriggerTime: 0,
          hasStartedFirstAttack: false,
        };

        streamRef.current = stream;
        audioCtxRef.current = ctx;
        isFollowingRef.current = true;
        setIsFollowing(true);
        setLiveBpm(Math.round(baseBpm));
        setBandStatus('listening');
        callbacksRef.current.onMeasureChange(startFromMeasure, 1);

        voiceTimerRef.current = window.setTimeout(() => {
          startVoiceRecognition();
        }, 350);

        const freqData = new Float32Array(analyser.frequencyBinCount);
        const timeData = new Uint8Array(analyser.fftSize);
        const minBpm = Math.max(40, baseBpm * 0.6);
        const maxBpm = Math.min(210, baseBpm * 1.5);

        // Índices de bandas musicales:
        // Banda Grave (Bombo / Bajo): ~50Hz a 250Hz
        const lowStart = Math.max(1, Math.floor(50 / binHz));
        const lowEnd = Math.min(freqData.length, Math.ceil(250 / binHz));
        // Banda Media-Aguda (Redoblante / Piano / Guitarras / Voces): ~900Hz a 4500Hz
        const midStart = Math.max(lowEnd + 1, Math.floor(900 / binHz));
        const midEnd = Math.min(freqData.length, Math.ceil(4500 / binHz));

        const processAudioFrame = () => {
          if (!isFollowingRef.current) return;

          const frameNow = performance.now();
          const tr = trackerRef.current;
          const dtSec = Math.min(0.1, (frameNow - tr.lastFrameTime) / 1000);
          tr.lastFrameTime = frameNow;

          analyser.getFloatFrequencyData(freqData);
          analyser.getByteTimeDomainData(timeData);

          let sumSq = 0;
          for (let i = 0; i < timeData.length; i++) {
            const norm = (timeData[i] - 128) / 128;
            sumSq += norm * norm;
          }
          const rms = Math.sqrt(sumSq / timeData.length);
          setInputLevel(Math.min(100, Math.round(rms * 600)));

          // Auto-calibrar piso de ruido de la sala en los primeros ~400ms
          if (tr.calibrationSamples.length < 25) {
            tr.calibrationSamples.push(rms);
            const sorted = [...tr.calibrationSamples].sort((a, b) => a - b);
            tr.noiseFloorRms = Math.max(0.002, sorted[Math.floor(sorted.length * 0.4)] || 0.003);
          }

          // Cálculo de Flujo Espectral Dual-Band (Grave + Medio/Agudo)
          const prev = tr.prevSpectrum;
          let lowFlux = 0;
          let midFlux = 0;

          if (prev) {
            for (let b = lowStart; b <= lowEnd; b++) {
              const rawDb = Number.isFinite(freqData[b]) ? freqData[b] : -100;
              const mag = Math.max(0, rawDb + 95);
              const diff = mag - prev[b];
              if (diff > 0) lowFlux += diff;
              prev[b] = mag;
            }

            for (let b = midStart; b <= midEnd; b++) {
              const rawDb = Number.isFinite(freqData[b]) ? freqData[b] : -100;
              const mag = Math.max(0, rawDb + 95);
              const diff = mag - prev[b];
              if (diff > 0) midFlux += diff;
              prev[b] = mag;
            }
          }

          // Ponderar graves (bombo/bajo) + ataques medios (caja/piano/guitarra/voz)
          const combinedFlux = lowFlux * 1.45 + midFlux * 0.85;

          tr.fluxHistory.push(combinedFlux);
          if (tr.fluxHistory.length > 32) tr.fluxHistory.shift();
          const avgFlux =
            tr.fluxHistory.reduce((acc, v) => acc + v, 0) / Math.max(1, tr.fluxHistory.length);

          const isSoloMode = callbacksRef.current.environment === 'solo_acoustic';
          const ratioThreshold = isSoloMode ? 1.42 : 1.72;
          const minFluxFloor = isSoloMode ? 5 : 12;
          const rmsFloor = Math.max(0.003, tr.noiseFloorRms * (isSoloMode ? 1.25 : 1.65));

          const isAttackDetected =
            combinedFlux > avgFlux * ratioThreshold + minFluxFloor && rms > rmsFloor;

          if (rms > rmsFloor || combinedFlux > avgFlux * 1.15) {
            tr.lastSoundTime = frameNow;
          }

          const expectedBeatMs = 60000 / tr.adaptiveBpm;
          const timeSinceLastOnset = frameNow - tr.lastOnsetTime;
          const currentStepMode = callbacksRef.current.stepMode;

          const minRefractoryMs =
            currentStepMode === 'single_pulse_per_measure'
              ? Math.max(550, expectedBeatMs * 1.6)
              : expectedBeatMs * 0.52;

          if (isAttackDetected && timeSinceLastOnset > minRefractoryMs) {
            tr.lastOnsetTime = frameNow;

            if (currentStepMode === 'single_pulse_per_measure') {
              if (!tr.hasStartedFirstAttack) {
                tr.hasStartedFirstAttack = true;
                setBandStatus('tracking');
                callbacksRef.current.onMeasureChange(tr.measureIndex, 1);
              } else {
                const nextMeasure = tr.measureIndex + 1;
                const total = callbacksRef.current.totalMeasures || 0;
                if (total > 0 && nextMeasure >= total) {
                  stopFollowing();
                  return;
                }
                tr.measureIndex = nextMeasure;
                tr.beatPhase = 0;
                setBandStatus('tracking');
                callbacksRef.current.onMeasureChange(tr.measureIndex, 1);
              }
            } else {
              tr.hasStartedFirstAttack = true;
              if (timeSinceLastOnset >= expectedBeatMs * 0.7 && timeSinceLastOnset <= expectedBeatMs * 1.4) {
                const instantBpm = 60000 / timeSinceLastOnset;
                const clampedBpm = Math.max(minBpm, Math.min(maxBpm, instantBpm));
                tr.adaptiveBpm = tr.adaptiveBpm * 0.76 + clampedBpm * 0.24;
                setLiveBpm(Math.round(tr.adaptiveBpm));
              }

              const nearestBeat = Math.round(tr.beatPhase);
              const phaseError = nearestBeat - tr.beatPhase;
              if (Math.abs(phaseError) < 0.42) {
                tr.beatPhase += phaseError * 0.5;
              }
            }
          }

          if (currentStepMode === 'beats' && tr.hasStartedFirstAttack) {
            const silenceDurationMs = frameNow - tr.lastSoundTime;
            if (silenceDurationMs > expectedBeatMs * 1.9) {
              setBandStatus('holding');
            } else {
              setBandStatus('tracking');
              const prevBeatInt = Math.floor(tr.beatPhase);
              tr.beatPhase += (tr.adaptiveBpm / 60) * dtSec;

              const spm = callbacksRef.current.beatsPerMeasure || 4;
              if (tr.beatPhase >= spm) {
                tr.beatPhase -= spm;
                const nextMeasure = tr.measureIndex + 1;
                const total = callbacksRef.current.totalMeasures || 0;
                if (total > 0 && nextMeasure >= total) {
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
          }

          rafIdRef.current = requestAnimationFrame(processAudioFrame);
        };

        rafIdRef.current = requestAnimationFrame(processAudioFrame);
      } catch {
        setErrorMsg('No se pudo acceder al micrófono. Revisa permisos en el navegador.');
        stopFollowing();
      }
    },
    [stopFollowing, startVoiceRecognition]
  );

  useEffect(() => {
    return () => stopFollowing();
  }, [stopFollowing]);

  return {
    isFollowing,
    liveBpm,
    bandStatus,
    inputLevel,
    heardTranscript,
    lastVoiceAction,
    errorMsg,
    startFollowing,
    stopFollowing,
    syncToMeasure,
    tapDownbeat,
  };
}
