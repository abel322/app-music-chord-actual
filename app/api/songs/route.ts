import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { parseChords, detectKey } from '@/lib/chord-parser'

const CreateSongSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  artist: z.string().optional().nullable(),
  lyrics: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
  key: z.string().optional().nullable(),
  timeSignature: z.string().optional().nullable(),
  tempo: z.coerce.number().optional().nullable(),
  youtubeUrl: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  instruments: z.any().optional().nullable(),
  sections: z.any().optional().nullable(),
  chords: z.any().optional().nullable(),
  tags: z.array(z.string()).optional(),
  isFavorite: z.boolean().optional(),
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const songs = await prisma.song.findMany({
      where: {
        userId,
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { artist: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ songs })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch songs' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = CreateSongSchema.parse(body)

    const rawText = data.content || data.lyrics || ''
    const parsedChords = rawText ? parseChords(rawText) : []
    const detectedKey = parsedChords.length > 0 ? detectKey(parsedChords) : 'C'

    const chordsValue = data.chords
      ? typeof data.chords === 'string'
        ? data.chords
        : JSON.stringify(data.chords)
      : JSON.stringify(parsedChords)

    const song = await prisma.song.create({
      data: {
        title: data.title,
        artist: data.artist || '',
        content: data.content || data.lyrics || '',
        lyrics: data.lyrics || '',
        chords: chordsValue,
        key: data.key || detectedKey || 'C',
        timeSignature: data.timeSignature || '4/4',
        tempo: data.tempo ?? 120,
        youtubeUrl: data.youtubeUrl || null,
        genre: data.genre || null,
        instruments: data.instruments !== undefined ? data.instruments : undefined,
        sections: data.sections !== undefined ? data.sections : undefined,
        tags: data.tags || [],
        isFavorite: data.isFavorite ?? false,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ song }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error creating song:', error)
    return NextResponse.json({ error: 'Failed to create song' }, { status: 500 })
  }
}
