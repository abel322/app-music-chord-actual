'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Music, 
  FileText, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  ExternalLink,
  Star,
  Trash2,
  CheckCircle2,
  Youtube,
  Play
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DeleteSongModal } from '@/components/songs/DeleteSongModal'
import { getYouTubeThumbnailUrl } from '@/lib/youtube'
import { useAuth } from '@/lib/context/auth-context'

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
  youtubeUrl?: string | null
  createdAt: string
  updatedAt: string
}

interface ChordsClientProps {
  initialSongs: SerializedSong[]
}

const COMMON_KEYS = ['Todas', 'C', 'D', 'E', 'F', 'G', 'A', 'B']

export function ChordsClient({ initialSongs }: ChordsClientProps) {
  const router = useRouter()
  const { isAdmin } = useAuth()
  const [songs, setSongs] = useState<SerializedSong[]>(initialSongs)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKey, setSelectedKey] = useState('Todas')
  const [songToDelete, setSongToDelete] = useState<SerializedSong | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  useEffect(() => {
    setSongs(initialSongs)
  }, [initialSongs])

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      const matchesSearch =
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (song.artist && song.artist.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (song.key && song.key.toLowerCase().includes(searchQuery.toLowerCase()))

      const matchesKey =
        selectedKey === 'Todas' ||
        (song.key && song.key.toUpperCase().startsWith(selectedKey.toUpperCase()))

      return matchesSearch && matchesKey
    })
  }, [songs, searchQuery, selectedKey])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header con Tabs y Botón de Creación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Canciones
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
              Modo Acordes
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gestión musical con enfoque en tonalidad, compases, tempo y estructura armónica.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Switcher de Vistas: Acordes vs Letras */}
          <div className="flex p-1 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
            <Link
              href="/dashboard/songs/chords"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm"
            >
              <Music className="w-3.5 h-3.5" />
              <span>Acordes</span>
            </Link>
            <Link
              href="/dashboard/songs/lyrics"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Letras</span>
            </Link>
          </div>

          {/* Botón "+ Nueva Canción" solo visible para el Administrador */}
          {isAdmin && (
            <Link href="/dashboard/songs/new">
              <Button variant="gradient" className="shadow-md shadow-primary-900/20">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Canción
              </Button>
            </Link>
          )}
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
            placeholder="Buscar por título, artista o tono (ej. Am, Sol)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm transition-all"
          />
        </div>

        {/* Filtro rápido de tonalidad */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mr-1 flex items-center gap-1 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Tono:
          </span>
          {COMMON_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSelectedKey(k)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all shrink-0 ${
                selectedKey === k
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen de Conteo */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
        <span>
          Mostrando <strong className="text-gray-800 dark:text-gray-200">{filteredSongs.length}</strong> de {initialSongs.length} canciones
        </span>
        {selectedKey !== 'Todas' && (
          <button
            onClick={() => setSelectedKey('Todas')}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Quitar filtro de tono
          </button>
        )}
      </div>

      {/* Listado de Canciones con Énfasis en Acordes */}
      {filteredSongs.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900/60 rounded-2xl border border-dashed border-gray-300 dark:border-slate-800 p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-950/60 flex items-center justify-center text-primary-600 dark:text-primary-400">
            <Music className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No se encontraron canciones
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            {initialSongs.length === 0
              ? 'Aún no hay canciones disponibles en la biblioteca.'
              : 'No hay canciones que coincidan con los criterios de búsqueda o tono seleccionado.'}
          </p>
          {initialSongs.length === 0 ? (
            isAdmin && (
              <Link href="/dashboard/songs/new">
                <Button variant="gradient">
                  <Plus className="w-4 h-4 mr-2" />
                  Crear Primera Canción
                </Button>
              </Link>
            )
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setSelectedKey('Todas')
              }}
            >
              Restablecer Filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSongs.map((song) => {
            const sectionsCount = Array.isArray(song.sections) ? song.sections.length : 0
            const thumbnailUrl = getYouTubeThumbnailUrl(song.youtubeUrl)

            return (
              <div
                key={song.id}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-xl hover:border-primary-500/50 dark:hover:border-primary-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Miniatura de Video de YouTube (si tiene enlace válido) */}
                  {thumbnailUrl && (
                    <a
                      href={song.youtubeUrl!}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block aspect-video w-full rounded-xl overflow-hidden mb-3 relative group/yt border border-gray-200 dark:border-slate-800 shadow-xs bg-slate-950 cursor-pointer"
                      title="Ver video en YouTube"
                    >
                      <img
                        src={thumbnailUrl}
                        alt={`Miniatura de ${song.title}`}
                        className="w-full h-full object-cover group-hover/yt:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover/yt:bg-black/40 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg group-hover/yt:scale-110 group-hover/yt:bg-red-600 transition-all">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[10px] font-bold text-white flex items-center gap-1 border border-white/10">
                        <Youtube className="w-3 h-3 text-red-500 fill-current" />
                        <span>YouTube</span>
                      </div>
                    </a>
                  )}

                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    {/* Badge destacado de Tonalidad */}
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-700 flex flex-col items-center justify-center text-white shadow-md shadow-primary-900/20 shrink-0">
                      <span className="text-base font-extrabold leading-none tracking-tight">
                        {song.key || 'C'}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider font-semibold opacity-80 mt-0.5">
                        Tono
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {song.isFavorite && (
                        <span className="p-1 rounded-md text-amber-500 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60" title="Favorita">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                        </span>
                      )}
                      {song.genre && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700">
                          {song.genre}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Título y Artista */}
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                    {song.title}
                  </h3>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-4 line-clamp-1">
                    {song.artist || 'Artista no especificado'}
                  </p>

                  {/* Metadatos Musicales (Compás, Tempo, Secciones) */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-xl bg-gray-50 dark:bg-slate-950/60 border border-gray-100 dark:border-slate-800/80 mb-4 text-center">
                    <div>
                      <span className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Compás
                      </span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {song.timeSignature || '4/4'}
                      </span>
                    </div>
                    <div className="border-x border-gray-200 dark:border-slate-800">
                      <span className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Tempo
                      </span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {song.tempo || 120} <span className="text-[10px] font-normal text-gray-400">BPM</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Estructura
                      </span>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        {sectionsCount > 0 ? `${sectionsCount} partes` : 'Simple'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Botón de Acción a Editor de Acordes y Eliminación Condicional */}
                <div className="pt-2 border-t border-gray-100 dark:border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400">
                    Lead Sheet de Estudio
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Botón de eliminar solo disponible para el Administrador */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          setSongToDelete(song)
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50"
                        title="Eliminar canción"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}

                    <Link
                      href={`/dashboard/songs/chords/${song.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 hover:bg-primary-100 dark:hover:bg-primary-900/60 border border-primary-200/60 dark:border-primary-800/50 transition-colors"
                    >
                      <span>Ver Acordes</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      <DeleteSongModal
        isOpen={!!songToDelete}
        song={songToDelete}
        onClose={() => setSongToDelete(null)}
        onSuccess={(deletedId, title) => {
          setSongs((prev) => prev.filter((s) => s.id !== deletedId))
          router.refresh()
          setToastMessage(`Canción «${title}» eliminada correctamente`)
          setTimeout(() => setToastMessage(null), 3500)
        }}
      />

      {/* Notificación Toast Flotante */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xl border border-slate-800 dark:border-slate-200 text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
