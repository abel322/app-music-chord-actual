import { Metronome } from '@/components/practice/metronome'

export default function PracticePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">
            Modo Ensayo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
            Entrena tu ritmo y tempo con nuestro metrónomo digital de alta precisión.
          </p>
        </div>
      </div>
      
      <div className="flex justify-center items-center py-4">
        <Metronome />
      </div>
    </div>
  )
}
