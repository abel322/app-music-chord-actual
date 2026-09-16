'use client'

import React, { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { FilterBar } from './components/FilterBar'
import { ProgressionCard } from './components/ProgressionCard'
import { chordProgressions, GENRES } from '@/lib/data/chordProgressions'
import { Music, Lock } from 'lucide-react'

export default function ChordsPage() {
  const { data: session, status } = useSession()

  const [selectedGenre, setSelectedGenre] = useState<string>('All')
  const [selectedKey, setSelectedKey] = useState<string>('All')

  // Extract unique keys for the filter
  const allKeys = useMemo(() => {
    const keys = new Set<string>()
    chordProgressions.forEach(p => keys.add(p.key))
    return Array.from(keys).sort()
  }, [])

  // Filter progressions based on selected genre and key
  const filteredProgressions = useMemo(() => {
    return chordProgressions.filter(p => {
      const matchGenre = selectedGenre === 'All' || p.genre === selectedGenre
      const matchKey = selectedKey === 'All' || p.key === selectedKey
      return matchGenre && matchKey
    })
  }, [selectedGenre, selectedKey])

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-pulse flex flex-col items-center">
          <Music className="w-12 h-12 text-blue-500 mb-4 animate-bounce" />
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  // Unauthenticated state
  if (!session) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 text-center">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Progresiones de Acordes
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            Inicia sesión para explorar nuestro extenso catálogo interactivo de progresiones de acordes.
            Escucha, aprende y reproduce progresiones de Lo-Fi, Neo-Soul, Trap, Jazz y más.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    )
  }

  // Authenticated state
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Catálogo de Progresiones
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Explora e interactúa con decenas de progresiones predefinidas. Selecciona un género o tonalidad y dale a Play para escuchar.
          </p>
        </header>

        <FilterBar
          genres={GENRES}
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
          keys={allKeys}
          selectedKey={selectedKey}
          onSelectKey={setSelectedKey}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProgressions.length > 0 ? (
            filteredProgressions.map((prog) => (
              <ProgressionCard key={prog.id} progression={prog} />
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-white dark:bg-gray-900 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                No se encontraron progresiones para los filtros seleccionados.
              </p>
              <button
                onClick={() => {
                  setSelectedGenre('All')
                  setSelectedKey('All')
                }}
                className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
