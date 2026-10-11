import { redirect } from 'next/navigation'

export default function SongDetailPage({ params }: { params: { id: string } }) {
  redirect(`/dashboard/songs/chords/${params.id}`)
}
