'use client'

import React, { useState, useEffect } from 'react'
import { X, Usb, Activity, Volume2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { useWebMidi, MidiHitEvent } from '@/hooks/useWebMidi'
import { DONNER_DRUM_MAP, getDrumInfoByNote, DrumPadType } from '@/types/drum'
import { drumSynth } from '@/lib/audio/drumSynth'
import { cn } from '@/lib/utils'

interface MidiCalibratorModalProps {
  isOpen: boolean
  onClose: () => void
}

interface PadVisualConfig {
  id: string
  name: string
  type: DrumPadType
  midiNote: number
  keySymbol: string
  gridArea: string
  isCymbal?: boolean
}

// Disposición visual realista del kit de batería
const DRUM_KIT_LAYOUT: PadVisualConfig[] = [
  { id: 'crash', name: 'Crash', type: 'CRASH', midiNote: 49, keySymbol: '49', gridArea: 'crash', isCymbal: true },
  { id: 'tom1', name: 'Tom 1', type: 'TOM_HIGH', midiNote: 48, keySymbol: '48', gridArea: 'tom1' },
  { id: 'tom2', name: 'Tom 2', type: 'TOM_MID', midiNote: 45, keySymbol: '45', gridArea: 'tom2' },
  { id: 'ride', name: 'Ride', type: 'RIDE', midiNote: 51, keySymbol: '51', gridArea: 'ride', isCymbal: true },
  { id: 'hihat', name: 'Hi-Hat', type: 'HIHAT_CLOSED', midiNote: 42, keySymbol: '42', gridArea: 'hihat', isCymbal: true },
  { id: 'snare', name: 'Caja', type: 'SNARE', midiNote: 38, keySymbol: '38', gridArea: 'snare' },
  { id: 'floor', name: 'Floor Tom', type: 'TOM_FLOOR', midiNote: 41, keySymbol: '41', gridArea: 'floor' },
  { id: 'kick', name: 'Bombo', type: 'KICK', midiNote: 36, keySymbol: '36', gridArea: 'kick' },
]

export function MidiCalibratorModal({ isOpen, onClose }: MidiCalibratorModalProps) {
  const { isConnected, deviceName, devices, lastEvent, error, requestAccess, addHitListener } = useWebMidi()

  // Estado de pads activados recientemente con su velocidad
  const [activePads, setActivePads] = useState<Record<string, { velocity: number; timestamp: number }>>({})
  const [recentHitsLog, setRecentHitsLog] = useState<MidiHitEvent[]>([])
  const [soundFeedback, setSoundFeedback] = useState(true)

  // Suscribirse a los golpes MIDI en tiempo real
  useEffect(() => {
    if (!isOpen) return

    const unsubscribe = addHitListener((hit) => {
      // Identificar pad correspondiente
      const padInfo = getDrumInfoByNote(hit.note)

      // Reproducir sonido de confirmación si está activado
      if (soundFeedback) {
        drumSynth.playHit(padInfo.type, hit.velocity)
      }

      // Marcar pad activo para animación luminosa
      setActivePads((prev) => ({
        ...prev,
        [padInfo.type]: { velocity: hit.velocity, timestamp: Date.now() },
        [hit.note.toString()]: { velocity: hit.velocity, timestamp: Date.now() },
      }))

      // Agregar al log de eventos recientes (máx 8)
      setRecentHitsLog((prev) => [hit, ...prev.slice(0, 7)])

      // Apagar la animación después de 280ms
      setTimeout(() => {
        setActivePads((prev) => {
          const updated = { ...prev }
          if (updated[padInfo.type]?.timestamp === hit.timestamp) {
            delete updated[padInfo.type]
          }
          if (updated[hit.note.toString()]?.timestamp === hit.timestamp) {
            delete updated[hit.note.toString()]
          }
          return updated
        })
      }, 280)
    })

    return () => {
      unsubscribe()
    }
  }, [isOpen, addHitListener, soundFeedback])

  // Disparo manual al hacer clic en un pad virtual
  const handleVirtualPadClick = (pad: PadVisualConfig) => {
    if (soundFeedback) {
      drumSynth.playHit(pad.type, 110)
    }

    const syntheticHit: MidiHitEvent = {
      note: pad.midiNote,
      velocity: 110,
      channel: 10,
      timestamp: Date.now(),
      device: 'Virtual Screen Pad',
    }

    setActivePads((prev) => ({
      ...prev,
      [pad.type]: { velocity: 110, timestamp: Date.now() },
    }))

    setRecentHitsLog((prev) => [syntheticHit, ...prev.slice(0, 7)])

    setTimeout(() => {
      setActivePads((prev) => {
        const updated = { ...prev }
        delete updated[pad.type]
        return updated
      })
    }, 280)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden max-h-[92vh]">
        {/* Cabecera del Calibrador */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Usb className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Calibrador MIDI Donner</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-700/60 font-mono">
                  General MIDI Ch.10
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Golpea los pads físicos en tu batería Donner para verificar la señal y fuerza.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Estado de Conexión USB */}
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'w-3 h-3 rounded-full animate-pulse shadow-sm',
                isConnected ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'
              )}
            />
            <span className="font-bold text-slate-200">
              {isConnected
                ? `🟢 Batería Conectada: ${deviceName || 'Donner USB MIDI'}`
                : '🔴 Esperando conexión USB (Conecta tu Donner y autoriza el navegador)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundFeedback(!soundFeedback)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all',
                soundFeedback
                  ? 'bg-purple-950/70 border-purple-600 text-purple-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              )}
              title="Activar/desactivar sonido inmediato al golpear"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{soundFeedback ? 'Audio Activo' : 'Audio Mudo'}</span>
            </button>

            <button
              onClick={requestAccess}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Buscar puertos MIDI de nuevo"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reconectar</span>
            </button>
          </div>
        </div>

        {/* Representación Visual Interactiva del Kit Donner */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          <div className="bg-slate-950/70 rounded-2xl border border-slate-800/80 p-4 relative">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Distribución de Pads Donner</span>
              <span className="text-[10px] text-slate-400 font-normal">Haz clic en un pad para probarlo</span>
            </div>

            {/* Rejilla de Pads (Platos arriba, Tambores abajo, Bombo al centro) */}
            <div className="grid grid-cols-4 gap-3 max-w-xl mx-auto">
              {DRUM_KIT_LAYOUT.map((pad) => {
                const isActive = Boolean(activePads[pad.type] || activePads[pad.midiNote.toString()])
                const hitData = activePads[pad.type] || activePads[pad.midiNote.toString()]
                const velocityPercent = hitData ? Math.round((hitData.velocity / 127) * 100) : 0

                return (
                  <button
                    key={pad.id}
                    onClick={() => handleVirtualPadClick(pad)}
                    className={cn(
                      'group relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-150 cursor-pointer select-none active:scale-95',
                      pad.isCymbal
                        ? 'h-24 bg-gradient-to-b from-amber-950/30 to-slate-900 border-amber-900/40 rounded-full'
                        : 'h-28 bg-slate-900/90 border-slate-800',
                      isActive
                        ? 'border-purple-400 ring-4 ring-purple-500/50 scale-105 bg-purple-950/90 shadow-xl shadow-purple-500/30'
                        : 'hover:border-slate-700 hover:bg-slate-850'
                    )}
                  >
                    {/* Badge de Nota MIDI */}
                    <span className="absolute top-1.5 right-2 text-[9px] font-mono text-slate-500 font-bold">
                      #{pad.midiNote}
                    </span>

                    {/* Forma del Pad */}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 mb-1.5',
                        pad.isCymbal ? 'border-2 border-amber-500/40 bg-amber-500/10' : 'border-2 border-slate-700 bg-slate-800',
                        isActive && 'bg-purple-500 border-white text-white shadow-lg shadow-purple-500/60 scale-110'
                      )}
                    >
                      <span className="text-xs font-black">
                        {pad.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-slate-200 group-hover:text-white truncate">
                      {pad.name}
                    </span>

                    {/* Mini Barra de Fuerza (Velocity) */}
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                      <div
                        className={cn(
                          'h-full transition-all duration-75',
                          isActive ? 'bg-gradient-to-r from-purple-400 to-amber-400' : 'bg-slate-700'
                        )}
                        style={{ width: `${isActive ? velocityPercent : 0}%` }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Monitor de Último Golpe y Registro en Vivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Monitor de Dinámica */}
            <div className="bg-slate-950/70 rounded-2xl border border-slate-800/80 p-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-purple-400" />
                <span>Última Señal Recibida</span>
              </div>

              {lastEvent ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-black text-white">
                        {getDrumInfoByNote(lastEvent.note).name}
                      </p>
                      <p className="text-xs font-mono text-purple-400 font-semibold">
                        Nota MIDI {lastEvent.note} • Canal {lastEvent.channel}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-amber-400 font-mono">
                        {lastEvent.velocity}
                      </span>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Fuerza (1-127)</p>
                    </div>
                  </div>

                  {/* Barra de Fuerza Medidora */}
                  <div className="space-y-1">
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 transition-all duration-75"
                        style={{ width: `${Math.round((lastEvent.velocity / 127) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-500">
                      <span>Suave (p)</span>
                      <span>Medio (mf)</span>
                      <span>Fuerte (ff)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Aún no se ha registrado ningún golpe. Toca un pad en tu Donner USB.
                </div>
              )}
            </div>

            {/* Registro de Golpes Recientes */}
            <div className="bg-slate-950/70 rounded-2xl border border-slate-800/80 p-4">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Historial de Golpes (Live Log)
              </div>

              {recentHitsLog.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar font-mono text-xs">
                  {recentHitsLog.map((hit, idx) => {
                    const info = getDrumInfoByNote(hit.note)
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-purple-400 font-bold">#{hit.note}</span>
                          <span className="font-semibold text-white">{info.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                          <span>Vel: {hit.velocity}</span>
                          <span className="text-slate-600">•</span>
                          <span>{hit.device.slice(0, 12)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Esperando eventos en vivo...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <p className="text-[11px] text-slate-400">
            {isConnected ? '✅ Batería lista para grabar grooves compás a compás.' : '⚠️ Conecta la Donner a la laptop con el cable USB tipo B.'}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
