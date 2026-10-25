'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface MidiHitEvent {
  note: number
  velocity: number
  channel: number
  timestamp: number
  device: string
}

export interface MidiDeviceInfo {
  id: string
  name: string
  manufacturer?: string
  state?: string
}

export function useWebMidi() {
  const [isSupported, setIsSupported] = useState<boolean>(false)
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [deviceName, setDeviceName] = useState<string | null>(null)
  const [devices, setDevices] = useState<MidiDeviceInfo[]>([])
  const [lastEvent, setLastEvent] = useState<MidiHitEvent | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Lista de listeners activos registrados para calibración o grabación
  const listenersRef = useRef<Set<(hit: MidiHitEvent) => void>>(new Set())
  const midiAccessRef = useRef<any>(null)

  // Suscribir listener
  const addHitListener = useCallback((callback: (hit: MidiHitEvent) => void) => {
    listenersRef.current.add(callback)
    return () => {
      listenersRef.current.delete(callback)
    }
  }, [])

  // Procesar mensaje MIDI en tiempo real
  const handleMidiMessage = useCallback((event: any, sourceName: string) => {
    if (!event.data || event.data.length < 3) return

    const [status, note, velocity] = event.data
    const command = status >> 4
    const channel = (status & 0x0f) + 1

    // Note On = 0x9 (9) y velocity > 0 (si velocity === 0 se interpreta como Note Off)
    if (command === 9 && velocity > 0) {
      const hitEvent: MidiHitEvent = {
        note,
        velocity,
        channel,
        timestamp: event.timeStamp || performance.now(),
        device: sourceName,
      }

      setLastEvent(hitEvent)

      // Notificar a todos los suscriptores (calibrador, grabador, etc.)
      listenersRef.current.forEach((cb) => {
        try {
          cb(hitEvent)
        } catch (err) {
          console.error('Error en listener MIDI:', err)
        }
      })
    }
  }, [])

  // Actualizar lista de puertos de entrada
  const updateInputs = useCallback((midiAccess: any) => {
    const inputs: MidiDeviceInfo[] = []
    let connectedName: string | null = null

    const inputEntries = Array.from(midiAccess.inputs.values()) as any[]

    inputEntries.forEach((input: any) => {
      const info: MidiDeviceInfo = {
        id: input.id,
        name: input.name || 'Dispositivo MIDI USB',
        manufacturer: input.manufacturer || 'Donner / Generic',
        state: input.state,
      }
      inputs.push(info)

      if (input.state === 'connected') {
        connectedName = input.name || 'Batería MIDI USB'
      }

      // Conectar listener de mensajes
      input.onmidimessage = (e: any) => handleMidiMessage(e, input.name || 'MIDI Device')
    })

    setDevices(inputs)
    setIsConnected(inputs.length > 0 && inputs.some((i) => i.state === 'connected'))
    setDeviceName(connectedName || (inputs.length > 0 ? inputs[0].name : null))
  }, [handleMidiMessage])

  // Solicitar acceso a Web MIDI
  const requestAccess = useCallback(async () => {
    if (typeof window === 'undefined') return

    if (!navigator.requestMIDIAccess) {
      setIsSupported(false)
      setError('Tu navegador no soporta Web MIDI API. Te sugerimos usar Google Chrome, Edge u Opera en tu PC/Laptop.')
      return
    }

    setIsSupported(true)

    try {
      const midiAccess = await navigator.requestMIDIAccess({ sysex: false })
      midiAccessRef.current = midiAccess

      updateInputs(midiAccess)

      midiAccess.onstatechange = () => {
        updateInputs(midiAccess)
      }
    } catch (err: any) {
      console.warn('Acceso a Web MIDI rechazado o no disponible:', err)
      setError('Permiso MIDI denegado. Conecta tu batería Donner por USB y autoriza el acceso al navegador.')
      setIsConnected(false)
    }
  }, [updateInputs])

  // Inicializar al montar
  useEffect(() => {
    requestAccess()

    return () => {
      if (midiAccessRef.current) {
        try {
          const inputEntries = Array.from(midiAccessRef.current.inputs.values()) as any[]
          inputEntries.forEach((input: any) => {
            input.onmidimessage = null
          })
          midiAccessRef.current.onstatechange = null
        } catch {
          // ignore cleanup errors
        }
      }
    }
  }, [requestAccess])

  return {
    isSupported,
    isConnected,
    deviceName,
    devices,
    lastEvent,
    error,
    requestAccess,
    addHitListener,
  }
}
