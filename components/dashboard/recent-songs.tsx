'use client'

import Link from 'next/link'
import { Music, Clock, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

import { useAuth } from '@/lib/context/auth-context'

interface Song {
  id: string
  title: string
  artist: string | null
  key: string | null
  timeSignature?: string | null
  updatedAt: Date | string
}

interface RecentSongsProps {
  songs: Song[]
}

export function RecentSongs({ songs }: RecentSongsProps) {
  const { isAdmin } = useAuth()

  if (songs.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <Music className="w-16 h-16 mx-auto mb-4 text-slate-400 opacity-60" />
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay canciones aún</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
          {isAdmin ? 'Comienza creando tu primera canción' : 'Pronto se añadirán nuevas canciones al repertorio.'}
        </p>
        {isAdmin && (
          <Link
            href="/dashboard/songs/new"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <Music className="w-4 h-4" />
            Nueva Canción
          </Link>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {isAdmin ? 'Canciones Recientes' : 'Canciones Destacadas / Recientes'}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'Últimos temas editados en tu biblioteca'
              : 'Accede a los Lead Sheets estructurados y acordes'}
          </p>
        </div>
        <Link
          href="/dashboard/songs/chords"
          className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
        >
          <span>Ver todas</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
        {songs.map((song) => (
          <Link
            key={song.id}
            href={`/dashboard/songs/chords/${song.id}`}
            className="flex items-center justify-between p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
          >
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary-600 to-indigo-700 flex flex-col items-center justify-center text-white font-extrabold shadow-sm shrink-0">
                <span className="text-sm sm:text-base leading-none">{song.key || 'C'}</span>
                <span className="text-[9px] uppercase tracking-wider opacity-75 font-semibold mt-0.5">Tono</span>
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                  {song.title}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                  <span className="truncate">{song.artist || 'Sin artista especificado'}</span>
                  <span>•</span>
                  <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                    {song.timeSignature || '4/4'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0 ml-3">
              {isAdmin && (
                <div className="text-right hidden sm:block text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {formatDistanceToNow(new Date(song.updatedAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/60 border border-primary-200/60 dark:border-primary-800/50 transition-colors">
                <span>Ver Acordes</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
