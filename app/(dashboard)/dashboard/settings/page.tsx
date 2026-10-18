import { getAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Ajustes | MusicChord',
  description: 'Configuración de la cuenta y preferencias de la aplicación.',
}

export default async function SettingsPage() {
  const { isAdmin } = await getAdminSession()

  if (!isAdmin) {
    redirect('/dashboard/songs/chords')
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Ajustes</h1>
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          Configuración administrativa del sistema
        </p>
      </div>
    </div>
  )
}
