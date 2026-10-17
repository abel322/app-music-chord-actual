'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { FilterBar } from './components/FilterBar'
import { ProgressionCard } from './components/ProgressionCard'
import { ProgressionFormModal } from './components/ProgressionFormModal'
import { DeleteProgressionModal } from './components/DeleteProgressionModal'
import { chordProgressions, ProgressionDef, GENRES } from '@/lib/data/chordProgressions'
import {
  getAllMergedProgressions,
  saveCatalogProgression,
  deleteCatalogProgression,
} from '@/lib/catalog-progressions'
import { Music, Lock, Plus } from 'lucide-react'

export default function ChordsPage() {
  const { data: session, status } = useSession()

  const [progressions, setProgressions] = useState<ProgressionDef[]>(chordProgressions)
  const [selectedGenre, setSelectedGenre] = useState<string>('All')
  const [selectedKey, setSelectedKey] = useState<string>('All')

  // Estado de los modales CRUD
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false)
  const [progressionToEdit, setProgressionToEdit] = useState<ProgressionDef | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
  const [progressionToDelete, setProgressionToDelete] = useState<ProgressionDef | null>(null)

  // Cargar progresiones combinadas desde localStorage al montar
  useEffect(() => {
    const merged = getAllMergedProgressions()
    setProgressions(merged)
  }, [])

  // Extraer géneros dinámicamente incluyendo nuevos personalizados
  const availableGenres = useMemo(() => {
    const genresSet = new Set<string>(GENRES)
    progressions.forEach((p) => {
      if (p.genre) genresSet.add(p.genre)
    })
    return Array.from(genresSet)
  }, [progressions])

  // Extraer tonalidades únicas dinámicamente
  const allKeys = useMemo(() => {
    const keys = new Set<string>()
    progressions.forEach((p) => {
      if (p.key) keys.add(p.key)
    })
    return Array.from(keys).sort()
  }, [progressions])

  // Filtrar progresiones según género y tonalidad seleccionados
  const filteredProgressions = useMemo(() => {
    return progressions.filter((p) => {
      const matchGenre = selectedGenre === 'All' || p.genre === selectedGenre
      const matchKey = selectedKey === 'All' || p.key === selectedKey
      return matchGenre && matchKey
    })
  }, [progressions, selectedGenre, selectedKey])

  // Abrir modal de creación (campos limpios)
  const handleOpenCreateModal = () => {
    setProgressionToEdit(null)
    setIsFormModalOpen(true)
  }

  // Abrir modal de edición con datos precargados
  const handleOpenEditModal = (prog: ProgressionDef) => {
    setProgressionToEdit(prog)
    setIsFormModalOpen(true)
  }

  // Guardar (crear o editar)
  const handleSaveProgression = (saved: ProgressionDef) => {
    // 1. Persistir en localStorage
    saveCatalogProgression(saved)

    // 2. Opcional: sincronizar con endpoint de API en segundo plano
    fetch('/api/progressions', {
      method: progressionToEdit ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saved),
    }).catch(() => {
      // Ignorar error si está offline
    })

    // 3. Actualizar estado de forma inmediata y reactiva
    setProgressions((prev) => {
      const existsIndex = prev.findIndex((p) => p.id === saved.id)
      if (existsIndex !== -1) {
        const updated = [...prev]
        updated[existsIndex] = saved
        return updated
      }
      return [saved, ...prev]
    })
  }

  // Abrir modal de confirmación de borrado
  const handleOpenDeleteModal = (prog: ProgressionDef) => {
    setProgressionToDelete(prog)
    setIsDeleteModalOpen(true)
  }

  // Confirmar borrado
  const handleConfirmDelete = () => {
    if (!progressionToDelete) return

    const id = progressionToDelete.id

    // 1. Persistir en localStorage
    deleteCatalogProgression(id)

    // 2. Opcional: sincronizar con API en segundo plano
    fetch(`/api/progressions?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch(() => {
      // Ignorar si está offline
    })

    // 3. Actualizar estado reactivamente
    setProgressions((prev) => prev.filter((p) => p.id !== id))
    setProgressionToDelete(null)
  }

  // Show loading state while checking session in production
  if (status === 'loading' && process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-pulse flex flex-col items-center">
          <Music className="w-12 h-12 text-blue-500 mb-4 animate-bounce" />
          <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
        </div>
      </div>
    )
  }

  // Unauthenticated state in production
  if (!session && process.env.NODE_ENV !== 'development') {
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
            Escucha, crea, edita y reproduce progresiones de Lo-Fi, Neo-Soul, Trap, Jazz y más.
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
      <div className="max-w-5xl mx-auto">
        {/* Cabecera con título y botón "+ Nueva Progresión" */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Catálogo de Progresiones
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mt-1">
              Explora, crea y edita tus propias progresiones. Selecciona un género o tonalidad y dale a Play para escuchar.
            </p>
          </div>

          <button
            id="btn-new-progression"
            data-testid="new-progression-btn"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto shrink-0 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Progresión</span>
          </button>
        </header>

        {/* Filtros dinámicos */}
        <FilterBar
          genres={availableGenres}
          selectedGenre={selectedGenre}
          onSelectGenre={setSelectedGenre}
          keys={allKeys}
          selectedKey={selectedKey}
          onSelectKey={setSelectedKey}
        />

        {/* Lista de tarjetas de progresiones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredProgressions.length > 0 ? (
            filteredProgressions.map((prog) => (
              <ProgressionCard
                key={prog.id}
                progression={prog}
                onEdit={handleOpenEditModal}
                onDelete={handleOpenDeleteModal}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-8">
              <Music className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
              <p className="text-gray-600 dark:text-gray-300 font-medium">
                No se encontraron progresiones para los filtros seleccionados.
              </p>
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setSelectedGenre('All')
                    setSelectedKey('All')
                  }}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium"
                >
                  Limpiar filtros
                </button>
                <button
                  onClick={handleOpenCreateModal}
                  className="text-sm px-3.5 py-1.5 rounded-lg bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-medium hover:bg-purple-200 transition-colors"
                >
                  + Crear progresión en esta categoría
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Creación / Edición */}
      <ProgressionFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveProgression}
        progressionToEdit={progressionToEdit}
        existingGenres={availableGenres}
      />

      {/* Modal de Confirmación de Borrado */}
      <DeleteProgressionModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        progression={progressionToDelete}
      />
    </div>
  )
}
