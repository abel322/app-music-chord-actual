import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { parseChords, detectKey } from '@/lib/chord-parser'

const CreateSongSchema = z.object({
  title: z.string().min(1),
  artist: z.string().optional(),
  lyrics: z.string().min(1),
  content: z.string().optional(),
  key: z.string().optional(),
  timeSignature: z.string().optional(),
  tempo: z.number().optional(),
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

    const chords = parseChords(data.content || data.lyrics)
    const detectedKey = detectKey(chords)

    const song = await prisma.song.create({
      data: {
        title: data.title,
        artist: data.artist || '',
        content: data.content || data.lyrics,
        lyrics: data.lyrics,
        chords: JSON.stringify(chords),
        key: data.key || detectedKey,
        timeSignature: data.timeSignature || '4/4',
        tempo: data.tempo || 120,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ song }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to create song' }, { status: 500 })
  }
}
