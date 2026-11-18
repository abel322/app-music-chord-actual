export interface RepertoireSongItem {
  id: string
  repertoireId: string
  songId: string
  order: number
  createdAt?: string
  song: {
    id: string
    title: string
    artist: string | null
    key: string | null
    tempo: number | null
    timeSignature: string | null
    youtubeUrl?: string | null
    isFavorite?: boolean
  }
}

export interface RepertoireData {
  id: string
  name: string
  description: string | null
  eventDate?: string | null
  color: string
  userId?: string | null
  songs: RepertoireSongItem[]
  createdAt?: string
  updatedAt?: string
}
