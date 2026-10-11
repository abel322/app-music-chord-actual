import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LeadSheetBuilder } from '@/components/songs/LeadSheetBuilder'

export const metadata = {
  title: 'Nueva Canción • Lead Sheet | MusicChord',
  description: 'Crear una nueva canción con estructura de compases, divisiones de tiempo y progresiones armónicas.',
}

export default async function NewSongPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return <LeadSheetBuilder />
}
