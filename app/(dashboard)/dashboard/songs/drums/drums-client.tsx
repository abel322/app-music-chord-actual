'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  Usb,
  Music,
  FileText,
  Play,
  ArrowRight,
  Sparkles,
  Layers,
  CircleDot,
  Radio,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MidiCalibratorModal } from '@/components/drums/MidiCalibratorModal'
import { useWebMidi } from '@/hooks/useWebMidi'
import { useAuth } from '@/lib/context/auth-context'
import { cn } from '@/lib/utils'

interface DrumsClientProps {
  initialSongs: any[]
}

export function DrumsClient({ initialSongs }: DrumsClientProps) {
  const { isAdmin } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [isCalibratorOpen, setIsCalibratorOpen] = useState(false)
  const { isConnected, deviceName } = useWebMidi()

  const filteredSongs = initialSongs.filter((song) => {
    const q = searchQuery.toLowerCase()
    const matchesTitle = song.title?.toLowerCase().includes(q)
    const matchesArtist = song.artist?.toLowerCase().includes(q)
    const matchesGenre = song.genre?.toLowerCase().includes(q)
    return matchesTitle || matchesArtist || matchesGenre
  })

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto pb-24">
      {/* Cabecera Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🥁</span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Módulo de Batería (Drums)
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/30">
              Web MIDI USB
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Partituras interactivas compás a compás, grabador cuantizado con cuenta previa y presets rítmicos.
          </p>
        </div>

        {/* Botón de Calibrador Donner USB (Solo Administrador) */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsCalibratorOpen(true)}
              className={cn(
                'gap-2 text-xs font-bold transition-all shadow-xs h-10 px-4 rounded-xl',
                isConnected
                  ? 'border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              )}
            >
              <span
                className={cn(
                  'w-2.5 h-2.5 rounded-full',
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                )}
              />
              <Usb className="w-4 h-4" />
              <span>{isConnected ? `Donner Conectada (${deviceName || 'USB'})` : 'Calibrar Batería Donner'}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Buscador de Canciones */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar canción por título, artista o género..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-xs"
        />
      </div>

      {/* Catálogo de Canciones */}
      {filteredSongs.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-6">
          <div className="text-4xl mb-3">🥁</div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No se encontraron canciones
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'Prueba con otro término de búsqueda.'
              : 'Agrega canciones desde el módulo de Acordes para ver sus partituras de batería.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSongs.map((song) => {
            const rawSections = Array.isArray(song.sections) ? song.sections : []
            const sectionsWithGroove = rawSections.filter((s: any) => s.drumGroove?.hits?.length > 0).length

            return (
              <div
                key={song.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {song.title}
                    </h2>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
                      ⏱️ {song.tempo || 120} BPM
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mb-3">
                    {song.artist || 'Artista no especificado'}
                  </p>

                  {/* Etiquetas de Métrica y Secciones */}
                  <div className="flex items-center gap-2 flex-wrap text-xs mb-4">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                      {song.timeSignature || '4/4'}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {rawSections.length} sección{rawSections.length !== 1 ? 'es' : ''}
                    </span>
                    {sectionsWithGroove > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1">
                        <span>✓</span>
                        <span>{sectionsWithGroove} grooves</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Botón Principal y Enlaces de Vista */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                  <Link href={`/dashboard/songs/drums/${song.id}`} className="block">
                    <Button
                      variant="gradient"
                      className="w-full justify-between text-xs font-black shadow-md shadow-primary-900/20 group/btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>🥁</span>
                        <span>Abrir Partitura de Batería</span>
                      </span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                  </Link>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Link href={`/dashboard/songs/chords/${song.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 gap-1"
                      >
                        <Music className="w-3.5 h-3.5" />
                        <span>Acordes</span>
                      </Button>
                    </Link>
                    <Link href={`/dashboard/songs/lyrics/${song.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Letras</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal Calibrador Donner (Solo Administrador) */}
      {isAdmin && isCalibratorOpen && (
        <MidiCalibratorModal
          isOpen={isCalibratorOpen}
          onClose={() => setIsCalibratorOpen(false)}
        />
      )}
    </div>
  )
}
