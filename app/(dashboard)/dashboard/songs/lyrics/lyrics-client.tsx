'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  FileText, 
  Music, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  ExternalLink,
  Star,
  Quote,
  AlignLeft,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SerializedSong {
  id: string
  title: string
  artist: string | null
  key: string | null
  timeSignature: string | null
  tempo: number | null
  genre: string | null
  content: string
  lyrics: string
  chords: string
  tags: string[]
  isFavorite: boolean
  sections?: any
  createdAt: string
  updatedAt: string
}

interface LyricsClientProps {
  initialSongs: SerializedSong[]
}

/**
 * Extrae un extracto limpio de letra a partir del modelo Song
 */
function extractLyricsSnippet(song: SerializedSong): { text: string; hasLyrics: boolean; linesCount: number } {
  // 1. Prioridad: campo lyrics directo
  if (song.lyrics && song.lyrics.trim().length > 0) {
    const lines = song.lyrics.split('\n').map(l => l.trim()).filter(Boolean)
    return {
      text: lines.slice(0, 3).join('\n'),
      hasLyrics: true,
      linesCount: lines.length,
    }
  }

  // 2. Extraer de sections si existen
  if (Array.isArray(song.sections) && song.sections.length > 0) {
    const extractedLines: string[] = []
    for (const section of song.sections) {
      if (Array.isArray(section.lines)) {
        for (const line of section.lines) {
          if (line.lyrics && line.lyrics.trim().length > 0) {
            extractedLines.push(line.lyrics.trim())
          }
        }
      }
    }
    if (extractedLines.length > 0) {
      return {
        text: extractedLines.slice(0, 3).join('\n'),
        hasLyrics: true,
        linesCount: extractedLines.length,
      }
    }
  }

  // 3. Fallback: campo content (limpiando posibles corchetes o etiquetas de acordes)
  if (song.content && song.content.trim().length > 0) {
    const cleaned = song.content
      .replace(/\[[^\]]*\]/g, '') // Quitar acordes en corchetes [C], [Am], etc.
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('#'))
    if (cleaned.length > 0) {
      return {
        text: cleaned.slice(0, 3).join('\n'),
        hasLyrics: true,
        linesCount: cleaned.length,
      }
    }
  }

  return {
    text: '',
    hasLyrics: false,
    linesCount: 0,
  }
}

export function LyricsClient({ initialSongs }: LyricsClientProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'with-lyrics' | 'instrumental'>('all')

  const processedSongs = useMemo(() => {
    return initialSongs.map((song) => {
      const snippet = extractLyricsSnippet(song)
      return {
        ...song,
        snippet,
      }
    })
  }, [initialSongs])

  const filteredSongs = useMemo(() => {
    return processedSongs.filter((song) => {
      const q = searchQuery.toLowerCase()
      const matchesSearch =
        song.title.toLowerCase().includes(q) ||
        (song.artist && song.artist.toLowerCase().includes(q)) ||
        (song.lyrics && song.lyrics.toLowerCase().includes(q)) ||
        (song.content && song.content.toLowerCase().includes(q)) ||
        (song.snippet.text && song.snippet.text.toLowerCase().includes(q))

      const matchesFilter =
        filterType === 'all' ||
        (filterType === 'with-lyrics' && song.snippet.hasLyrics) ||
        (filterType === 'instrumental' && !song.snippet.hasLyrics)

      return matchesSearch && matchesFilter
    })
  }, [processedSongs, searchQuery, filterType])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header con Tabs y Botón de Creación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Canciones
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              Modo Letras
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Visualización y gestión de canciones con foco en texto, versos y contenido lírico.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Switcher de Vistas: Acordes vs Letras */}
          <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <Link
              href="/dashboard/songs/chords"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Acordes</span>
            </Link>
            <Link
              href="/dashboard/songs/lyrics"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Letras</span>
            </Link>
          </div>

          <Link href="/dashboard/songs/new">
            <Button variant="gradient" className="shadow-md shadow-primary-900/20">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Canción
            </Button>
          </Link>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título, artista o texto dentro de la letra..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
          />
        </div>

        {/* Filtros de Tipo de Letra */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1 flex items-center gap-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Estado:
          </span>
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 ${
              filterType === 'all'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            Todas
          </button>
          <button
            type="button"
            onClick={() => setFilterType('with-lyrics')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 ${
              filterType === 'with-lyrics'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            Con Letra
          </button>
          <button
            type="button"
            onClick={() => setFilterType('instrumental')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 ${
              filterType === 'instrumental'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            Solo Instrumental
          </button>
        </div>
      </div>

      {/* Resumen de Conteo */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
        <span>
          Mostrando <strong className="text-gray-800 dark:text-gray-200">{filteredSongs.length}</strong> de {initialSongs.length} canciones
        </span>
        {filterType !== 'all' && (
          <button
            onClick={() => setFilterType('all')}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Ver todas
          </button>
        )}
      </div>

      {/* Listado de Canciones con Énfasis en Letras */}
      {filteredSongs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No se encontraron letras
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            {initialSongs.length === 0
              ? 'Aún no tienes canciones registradas. Crea una nueva canción para añadir tus letras y versos.'
              : 'No hay canciones que coincidan con el texto de búsqueda o el filtro seleccionado.'}
          </p>
          {initialSongs.length === 0 ? (
            <Link href="/dashboard/songs/new">
              <Button variant="gradient">
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Canción
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setFilterType('all')
              }}
            >
              Restablecer Filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSongs.map((song) => {
            return (
              <div
                key={song.id}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl hover:border-purple-500/50 dark:hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/70 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
                        <Quote className="w-5 h-5" />
                      </div>
                      <div>
                        {song.snippet.hasLyrics ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <AlignLeft className="w-2.5 h-2.5" />
                            {song.snippet.linesCount} líneas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-slate-700">
                            Instrumental
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {song.isFavorite && (
                        <span className="p-1 rounded-md text-amber-500 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60" title="Favorita">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                        </span>
                      )}
                      {song.key && (
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                          {song.key}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Título y Artista */}
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                    {song.title}
                  </h3>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
                    {song.artist || 'Artista no especificado'}
                  </p>

                  {/* Extracto de Letra (Lyric Snippet) */}
                  <div className="min-h-[84px] p-3 rounded-xl bg-gray-50 dark:bg-slate-950/60 border border-gray-100 dark:border-slate-800/80 mb-4">
                    {song.snippet.hasLyrics ? (
                      <p className="text-xs text-gray-600 dark:text-gray-300 italic whitespace-pre-line line-clamp-3 leading-relaxed font-serif">
                        &quot;{song.snippet.text}&quot;
                      </p>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-3 text-center text-gray-400 dark:text-gray-500">
                        <Sparkles className="w-4 h-4 mb-1 opacity-60" />
                        <span className="text-[11px]">Sin letra registrada (Solo acordes)</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Botón de Acción a Editor */}
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    {song.genre || (song.snippet.hasLyrics ? 'Con lírica' : 'Instrumental')}
                  </span>
                  <Link
                    href={`/dashboard/songs/${song.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200/60 dark:border-purple-800/50 transition-colors"
                  >
                    <span>Ver Letra</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
