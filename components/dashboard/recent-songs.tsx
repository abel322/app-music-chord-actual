'use client'

import Link from 'next/link'
import { Music, Clock, MoreVertical } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface Song {
  id: string
  title: string
  artist: string | null
  key: string
  updatedAt: Date
}

interface RecentSongsProps {
  songs: Song[]
}

export function RecentSongs({ songs }: RecentSongsProps) {
  if (songs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
        <Music className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">No tienes canciones aún</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Comienza creando tu primera canción
        </p>
        <Link
          href="/dashboard/songs/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Music className="w-5 h-5" />
          Nueva Canción
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold">Canciones Recientes</h2>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {songs.map((song) => (
          <Link
            key={song.id}
            href={`/dashboard/songs/${song.id}`}
            className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-blue-500 flex items-center justify-center text-white font-bold">
                {song.key}
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-primary-600 transition-colors">
                  {song.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {song.artist || 'Sin artista'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  {formatDistanceToNow(new Date(song.updatedAt), {
                    addSuffix: true,
                    locale: es,
                  })}
                </div>
              </div>
              <button className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
