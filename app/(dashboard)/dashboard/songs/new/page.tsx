import { getAdminSession } from '@/lib/admin-auth'
import { redirect } from 'next/navigation'
import { LeadSheetBuilder } from '@/components/songs/LeadSheetBuilder'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Nueva Canción • Lead Sheet | MusicChord',
  description: 'Crear una nueva canción con estructura de compases, divisiones de tiempo y progresiones armónicas.',
}

export default async function NewSongPage() {
  const { isAdmin } = await getAdminSession()

  if (!isAdmin) {
    redirect('/dashboard/songs/chords')
  }

  return <LeadSheetBuilder />
}
