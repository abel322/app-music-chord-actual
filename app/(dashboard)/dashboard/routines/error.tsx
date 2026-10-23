'use client'

import { useEffect } from 'react'

export default function RoutinesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Error en el componente de rutinas:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
        Hubo un problema al cargar tus rutinas de práctica
      </h2>
      <p className="text-sm text-slate-500 max-w-md mb-6">
        No te preocupes, tus datos están a salvo. Puedes intentar recargar la vista.
      </p>
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl shadow transition-all active:scale-95"
      >
        Reintentar
      </button>
    </div>
  )
}
